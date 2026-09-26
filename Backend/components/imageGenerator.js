import OpenAI from "openai";
import { toFile } from "openai/uploads";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini";
const QUALITY = process.env.OPENAI_IMAGE_QUALITY || "medium"; // low | medium | high

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

// Builds a numbered list mapping each reference photo, in the exact order
// it is attached to the request, to the character it belongs to (e.g.
// "Reference photo 1: Buddy (Child)", "Reference photo 2: Max (Pet)",
// "Reference photo 3: Teddy (Object)"). The order here MUST match the
// order the files are attached in generateImage, or the labels will point
// at the wrong photo.
const buildReferenceManifest = (referenceImages) =>
    referenceImages
        .map((image, index) => {
            const label = image.characterName
                ? `${image.characterName}${image.characterType ? ` (${image.characterType})` : ""}`
                : `Unlabeled character ${index + 1}`;

            return `Reference photo ${index + 1}: ${label}`;
        })
        .join("\n");

// When real uploaded photos are attached as references, force the model
// to treat each one as the literal identity source for its OWN character
// - first lock onto an enhanced, dynamic likeness of the exact
// person/pet/object in each photo, THEN re-render every one of those
// identities in the requested illustration style. The previous version of
// this instruction only ever said "the main character" (singular), so
// when a person, a pet, and an object were all attached at once, the
// model treated it as one identity to match and almost always picked the
// person, ignoring the pet/object references entirely. Naming every
// reference photo by the character it belongs to fixes that.
const buildPromptWithReferenceInstruction = (prompt, referenceImages = []) => {
    if (!referenceImages.length) {
        return prompt;
    }

    const manifest = buildReferenceManifest(referenceImages);
    const multiple = referenceImages.length > 1;

    return `
IDENTITY SOURCE: ${referenceImages.length} reference photo(s) of real
people, pets and/or objects are attached to this request, in this exact
order:

${manifest}

Treat each attached photo as the definitive identity source ONLY for the
specific character it is labeled with above.${
        multiple
            ? " Every character listed above has its own dedicated reference photo and MUST be matched to it individually - do not blend, merge, or apply one character's reference onto a different character, and do not favor one character's likeness over another's. Every character with a reference photo must be rendered with equal fidelity to its own reference, even when that character is a pet or an object rather than a person."
            : " This reference photo is the definitive identity source for that character."
    }

STEP 1 - IDENTITY LOCK: For each labeled reference photo, first establish
a dynamic, enhanced, photo-realistic likeness of the exact
person/pet/object shown in that photo - same face/shape, same features,
same proportions, same recognizable details (for a pet: same breed,
fur/coat pattern and coloring; for an object: same shape, material,
colors and distinguishing details). Do not invent a different-looking
character for any labeled reference.

STEP 2 - STYLE TRANSFER: Then render every one of those identities fully
in the illustration style described below, together in the same scene
when the scene calls for it. The final image must be a full illustration
in the requested style (not a photo), but each character within it must
clearly be recognizable as the same subject shown in its own reference
photo.

SCENE AND STYLE INSTRUCTIONS:
${prompt}
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
    const validReferences = referenceImages.filter((image) => image?.buffer).slice(0, 4);

        const imageFiles = await Promise.all(
            validReferences.map((image, index) =>
                toFile(
                    image.buffer,
                    `reference-${index}.png`,
                    { type: image.contentType || "image/png" }
                )
            )
        );

        const finalPrompt = buildPromptWithReferenceInstruction(
            prompt,
            validReferences
        );

    console.log(
      `Generating OpenAI image (${MODEL}, quality: ${QUALITY}) with ${imageFiles.length} reference image(s), size ${size}...`,
    );

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        let response;

                if (imageFiles.length > 0) {
                    response = await client.images.edit({
                        model: MODEL,
                        image: imageFiles,
                        prompt: finalPrompt,
                        size,
                        quality: QUALITY
                    });
                } else {
                    response = await client.images.generate({
                        model: MODEL,
                        prompt: finalPrompt,
                        size,
                        quality: QUALITY
                    });
                }

        const b64 = response?.data?.[0]?.b64_json;

                if (!b64) {
                    throw new Error("OpenAI did not return image data.");
                }

        const imageBuffer = Buffer.from(b64, "base64");

        console.log(
          "OpenAI generated image size:",
          imageBuffer.length,
          "| usage:",
          response?.usage,
        );

        return imageBuffer;
      } catch (error) {
        lastError = error;

        const retryable = isRetryableError(error);

        if (!retryable || attempt === maxRetries) {
          break;
        }

        const delay = 1000 * Math.pow(2, attempt) + Math.random() * 300;

        console.warn(
          `OpenAI image generation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`,
          error?.message || error,
        );

        await sleep(delay);
      }
    }

    throw lastError;
  } catch (error) {
    console.error("generateImage (OpenAI) error:", error);
    throw error;
  }
};
