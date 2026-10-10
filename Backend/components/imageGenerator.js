import OpenAI from "openai";
import { toFile } from "openai/uploads";
import sharp from "sharp";
import {
  isModerationBlock,
  sanitizeImagePrompt,
  MAX_SAFETY_LEVEL,
} from "./promptSafety.js";
import { MAX_REFERENCE_CHARACTERS } from "../config/characterLimits.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini";
const QUALITY = process.env.OPENAI_IMAGE_QUALITY || "medium"; // low | medium | high
// "low" = less restrictive automatic filtering (supported by images.generate).
const MODERATION = process.env.OPENAI_IMAGE_MODERATION || "low"; // auto | low

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) => {
  const status = error?.status;
  const message = error?.message || "";

  return (
    status === 429 ||
    status === 500 ||
    status === 503 ||
    /rate limit|overloaded|temporarily unavailable/i.test(message)
  );
};

// OpenAI only accepts a fixed set of output sizes for gpt-image models.
const closestSupportedSize = (width, height) => {
  const ratio = width / height;

  if (Math.abs(ratio - 1) < 0.15) {
    return "1024x1024";
  }

  return ratio < 1 ? "1024x1536" : "1536x1024";
};

// ---------------------------------------------------------------------------
// WHY THIS EXISTS: with 5 reference photos in one images.edit call, OpenAI
// returned a picture while reporting only 8 input tokens - i.e. it never saw
// the prompt or the photos - so the result was a random stock-looking image
// (horses, a cereal bowl, warning signs). Calls with 1-4 photos were normal.
// So: never send more than MAX_EDIT_IMAGES files. Extra characters are merged
// into ONE side-by-side sheet, which still counts as a single reference.
// ---------------------------------------------------------------------------
const MAX_EDIT_IMAGES = Math.max(
  1,
  Number(process.env.OPENAI_MAX_REFERENCE_IMAGES) || 4,
);

// A normal edit call with references uses 500+ input tokens. Anything this
// low means the request was effectively ignored.
const MIN_PLAUSIBLE_INPUT_TOKENS = 100;

const combineReferences = async (refs) => {
  const TILE = 512;

  const tiles = await Promise.all(
    refs.map((ref) =>
      sharp(ref.buffer)
        .rotate()
        .resize(TILE, TILE, { fit: "contain", background: "#ffffff" })
        .png()
        .toBuffer(),
    ),
  );

  const sheet = await sharp({
    create: {
      width: TILE * tiles.length,
      height: TILE,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite(
      tiles.map((input, index) => ({ input, left: index * TILE, top: 0 })),
    )
    .png()
    .toBuffer();

  const names = refs.map((ref) => ref.characterName || "character");

  return {
    buffer: sheet,
    contentType: "image/png",
    characterName: names.join(" and "),
    characterType: `ONE image with ${refs.length} separate characters side by side, left to right: ${refs
      .map(
        (ref) =>
          `${ref.characterName || "character"}${ref.characterType ? ` (${ref.characterType})` : ""}`,
      )
      .join(", ")} - match each one individually`,
  };
};

// Keeps at most `max` reference files; the overflow is merged into one sheet.
const limitReferences = async (refs, max) => {
  if (refs.length <= max) {
    return refs;
  }

  return [
    ...refs.slice(0, max - 1),
    await combineReferences(refs.slice(max - 1)),
  ];
};

const toUploadFiles = (refs) =>
  Promise.all(
    refs.map((image, index) =>
      toFile(image.buffer, `reference-${index}.png`, {
        type: image.contentType || "image/png",
      }),
    ),
  );

const buildReferenceManifest = (referenceImages) =>
  referenceImages
    .map((image, index) => {
      const label = image.characterName
        ? `${image.characterName}${image.characterType ? ` (${image.characterType})` : ""}`
        : `Unlabeled character ${index + 1}`;

      return `Reference photo ${index + 1}: ${label}`;
    })
    .join("\n");

const buildPromptWithReferenceInstruction = (prompt, referenceImages = []) => {
  if (!referenceImages.length) {
    return prompt;
  }

  const manifest = buildReferenceManifest(referenceImages);
  const multiple = referenceImages.length > 1;

  return `
Create ONE children's storybook illustration (portrait page). The SCENE below is the most important part: its setting, action and camera angle must clearly appear in the picture.

${prompt}

REFERENCE PHOTOS (${referenceImages.length} attached, in this order):
${manifest}

How to use the reference photos:
- Each photo shows who ONE character is. Use it ONLY for that character's identity: face, hair, skin tone, body shape, clothing and colors (for a pet or object: same kind, shape, colors and markings).
- Do NOT copy a photo's pose, framing, camera angle, background or lighting. Pose and placement come from the SCENE.
- Draw exactly the characters listed above, each once, each clearly recognizable${multiple ? " and clearly different from the others - never blend two characters' features, never favor one over another" : ""}. Do not add any other recurring character.
- The characters are busy doing what the SCENE says, inside the setting it describes. They are not lined up facing the viewer.
- Keep the camera pulled back: characters are full-body and never fill the frame, so the setting around them is clearly visible and detailed.
- The result is a fully illustrated picture in the STYLE above, not a photo.
`.trim();
};

/**
 * Generates an image using OpenAI's gpt-image-1 / gpt-image-1-mini.
 *
 * @param {Object} params
 * @param {string} params.prompt
 * @param {Array<Object>} [params.referenceImages=[]] - Array of { buffer, contentType }
 * @param {number} [params.width=768]
 * @param {number} [params.height=1024]
 * @param {number} [params.maxRetries=4]
 * @returns {Promise<Buffer>}
 */
export const generateImage = async ({
  prompt,
  referenceImages = [],
  width = 768,
  height = 1024,
  maxRetries = 4,
}) => {
  try {
    if (!prompt?.trim()) {
      throw new Error("Image generation prompt is required.");
    }

    const size = closestSupportedSize(width, height);

    // Sliced ONCE here, and this exact sliced list is used both to build the
    // uploaded image files AND the reference manifest in the prompt, so the
    // "Reference photo N" labels always line up with the Nth file actually
    // sent to the model.
    const validReferences = referenceImages
      .filter((image) => image?.buffer)
      .slice(0, MAX_REFERENCE_CHARACTERS);

    // At most MAX_EDIT_IMAGES files go to OpenAI (see note above).
    let referencesForCall = await limitReferences(
      validReferences,
      MAX_EDIT_IMAGES,
    );
    let imageFiles = await toUploadFiles(referencesForCall);

    console.log(
      `Generating OpenAI image (${MODEL}, quality: ${QUALITY}) with ${referencesForCall.length} reference file(s) (${validReferences.length} character(s)), size ${size}...`,
    );

    let lastError;
    let safetyLevel = 0; // raised each time the output moderation blocks us
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Level 2 = last resort: drop the reference photos as well.
        const useReferences =
          safetyLevel < MAX_SAFETY_LEVEL && imageFiles.length > 0;

        const safePrompt = sanitizeImagePrompt(prompt, safetyLevel);
        const finalPrompt = buildPromptWithReferenceInstruction(
          safePrompt,
          useReferences ? referencesForCall : [],
        );

        let response;

        if (useReferences) {
          response = await client.images.edit({
            model: MODEL,
            image: imageFiles,
            prompt: finalPrompt,
            size,
            quality: QUALITY,
          });
        } else {
          response = await client.images.generate({
            model: MODEL,
            prompt: finalPrompt,
            size,
            quality: QUALITY,
            moderation: MODERATION,
          });
        }

        // The request was effectively ignored (prompt + photos never seen), so
        // the picture is random. Merge ALL references into one sheet and retry.
        const inputTokens = response?.usage?.input_tokens;
        if (
          useReferences &&
          typeof inputTokens === "number" &&
          inputTokens < MIN_PLAUSIBLE_INPUT_TOKENS
        ) {
          console.warn(
            `OpenAI reported only ${inputTokens} input tokens for ${referencesForCall.length} reference file(s) - the request was ignored. Retrying with the references merged into one image...`,
          );

          if (referencesForCall.length > 1) {
            referencesForCall = await limitReferences(validReferences, 1);
            imageFiles = await toUploadFiles(referencesForCall);
          }

          throw Object.assign(
            new Error("OpenAI ignored the request (too few input tokens)."),
            {
              status: 503,
            },
          );
        }

        const b64 = response?.data?.[0]?.b64_json;

        if (!b64) {
          throw new Error("OpenAI did not return image data.");
        }

        const imageBuffer = Buffer.from(b64, "base64");

        console.log(
          "OpenAI generated image size:",
          imageBuffer.length,
          `| safety level: ${safetyLevel}`,
          "| usage:",
          response?.usage,
        );

        return imageBuffer;
      } catch (error) {
        lastError = error;

        // Output moderation block: retry with safer wording (no wait needed).
        if (isModerationBlock(error) && safetyLevel < MAX_SAFETY_LEVEL) {
          safetyLevel += 1;
          console.warn(
            `OpenAI moderation blocked the image (request ${error?.requestID}). Retrying with safety level ${safetyLevel}...`,
          );
          continue; // does not use up a normal retry
        }

        if (!isRetryableError(error) || attempt === maxRetries) {
          break;
        }

        const delay = 1000 * Math.pow(2, attempt) + Math.random() * 300;

        console.warn(
          `OpenAI image generation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`,
          error?.message || error,
        );

        await sleep(delay);
        attempt += 1;
      }
    }

    throw lastError;
  } catch (error) {
    console.error("generateImage (OpenAI) error:", error);
    throw error;
  }
};
