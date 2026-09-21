// // import { cloudflareConfig } from "../config/cloudflare.js";

// // const MODEL = "@cf/black-forest-labs/flux-2-klein-9b";

// // export const generateImage = async ({
// //     prompt,
// //     referenceImages = [],
// //     width = 768,
// //     height = 1024,
// //     seed
// // }) => {
// //     try {
// //         if (!prompt?.trim()) {
// //             throw new Error("Image generation prompt is required.");
// //         }

// //         const url = `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/ai/run/${MODEL}`;

// //         const formData = new FormData();

// //         formData.append("prompt", prompt);
// //         formData.append("width", String(width));
// //         formData.append("height", String(height));

// //         if (seed !== undefined && seed !== null) {
// //             formData.append("seed", String(seed));
// //         }

// //         referenceImages
// //             .filter((image) => image?.buffer)
// //             .slice(0, 4)
// //             .forEach((image, index) => {
// //                 formData.append(
// //                     `input_image_${index}`,
// //                     new Blob([image.buffer], {
// //                         type: image.contentType || "image/png"
// //                     }),
// //                     `reference-${index}.png`
// //                 );
// //             });

// //         console.log(
// //             `Generating FLUX.2 image with ${Math.min(
// //                 referenceImages.filter((image) => image?.buffer).length,
// //                 4
// //             )} reference image(s)...`
// //         );

// //         const response = await fetch(url, {
// //             method: "POST",
// //             headers: {
// //                 Authorization: `Bearer ${cloudflareConfig.apiToken}`
// //             },
// //             body: formData
// //         });

// //         if (!response.ok) {
// //             const errorText = await response.text();

// //             throw new Error(
// //                 `Cloudflare FLUX.2 image generation failed: ${errorText}`
// //             );
// //         }

// //         const result = await response.json();

// //         if (!result?.success) {
// //             throw new Error(
// //                 `Cloudflare FLUX.2 returned an unsuccessful response: ${JSON.stringify(
// //                     result
// //                 )}`
// //             );
// //         }

// //         if (!result?.result?.image) {
// //             throw new Error(
// //                 "Cloudflare FLUX.2 did not return an image."
// //             );
// //         }

// //         const imageBuffer = Buffer.from(
// //             result.result.image,
// //             "base64"
// //         );

// //         console.log(
// //             "FLUX.2 generated image size:",
// //             imageBuffer.length
// //         );

// //         return imageBuffer;
// //     } catch (error) {
// //         console.error("generateImage error:", error);
// //         throw error;
// //     }
// // };
// import { GoogleGenAI } from "@google/genai";

// // Reads the same key you set up in AI Studio.
// // Make sure your .env uses this exact name: GEMINI_API_KEY=...
// const ai = new GoogleGenAI({
//     apiKey: process.env.GEMINI_API_KEY
// });

// // NOTE: PRIMARY_MODEL requires a billing-enabled Gemini project.
// // FALLBACK_MODEL has a genuine free-tier quota, so the pipeline
// // keeps working even if billing isn't set up yet or lapses.
// const PRIMARY_MODEL =
//     process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
// const FALLBACK_MODEL =
//     process.env.GEMINI_IMAGE_FALLBACK_MODEL || "gemini-2.5-flash-image";

// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// // "limit: 0" in the error body means this model has zero free-tier
// // quota on this project — no amount of waiting/retrying will help,
// // so this is treated as a hard failure that should trigger fallback
// // to a different model rather than a retry of the same one.
// const isHardQuotaError = (error) => {
//     const message = error?.message || "";
//     return /limit:\s*0\b/i.test(message);
// };

// const isRetryableError = (error) => {
//     if (isHardQuotaError(error)) {
//         return false;
//     }

//     const status = error?.status || error?.code;
//     const message = error?.message || "";

//     return (
//         status === 503 ||
//         status === 429 ||
//         /UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand/i.test(message)
//     );
// };

// /**
//  * Generates an image using Google Gemini Image (Nano Banana / Nano Banana Pro).
//  *
//  * @param {Object} params
//  * @param {string} params.prompt - Text description of the image.
//  * @param {Array<Object>} [params.referenceImages=[]] - Array of { buffer, contentType }
//  * @param {number} [params.width=768]
//  * @param {number} [params.height=1024]
//  * @param {number} [params.maxRetries=4] - Retries on transient 503/429 errors.
//  * @returns {Promise<Buffer>} Generated image as a Node.js Buffer.
//  */
// export const generateImage = async ({
//     prompt,
//     referenceImages = [],
//     width = 768,
//     height = 1024,
//     maxRetries = 4
// }) => {
//     try {
//         if (!prompt?.trim()) {
//             throw new Error("Image generation prompt is required.");
//         }

//         // ---------------------------------------------------------
//         // 1. Calculate Gemini aspect ratio
//         // ---------------------------------------------------------
//         let aspectRatio = "1:1";

//         if (width && height) {
//             const ratio = width / height;

//             if (ratio < 0.6) {
//                 aspectRatio = "9:16";
//             } else if (ratio < 0.8) {
//                 aspectRatio = "3:4";
//             } else if (ratio > 1.7) {
//                 aspectRatio = "16:9";
//             } else if (ratio > 1.3) {
//                 aspectRatio = "4:3";
//             } else {
//                 aspectRatio = "1:1";
//             }
//         }

//         // ---------------------------------------------------------
//         // 2. Prepare reference images
//         // ---------------------------------------------------------
//         const validReferences = referenceImages.filter(
//             (img) => img?.buffer
//         );

//         // Gemini 3 Pro Image supports up to 14 reference images;
//         // slicing conservatively for WonderBook's use case.
//         const sourceImages = validReferences
//             .slice(0, 6)
//             .map((img) => ({
//                 inlineData: {
//                     data: img.buffer.toString("base64"),
//                     mimeType: img.contentType || "image/png"
//                 }
//             }));

//         // ---------------------------------------------------------
//         // 3. Build multimodal Gemini input
//         // ---------------------------------------------------------
//         const contents = [
//             {
//                 role: "user",
//                 parts: [{ text: prompt }, ...sourceImages]
//             }
//         ];

//         const generationConfig = {
//             responseModalities: ["IMAGE"],
//             imageConfig: {
//                 aspectRatio,
//                 imageSize: "1K" // "1K" | "2K" | "4K"
//             }
//         };

//         // ---------------------------------------------------------
//         // 4. Try the primary model first, retrying on transient
//         //    errors; fall back to a free-tier-capable model if the
//         //    primary hits a hard (zero) quota wall.
//         // ---------------------------------------------------------
//         const modelsToTry = [PRIMARY_MODEL];

//         if (FALLBACK_MODEL && FALLBACK_MODEL !== PRIMARY_MODEL) {
//             modelsToTry.push(FALLBACK_MODEL);
//         }

//         let lastError;

//         for (const model of modelsToTry) {
//             console.log(
//                 `Generating Gemini image (${model}) with ${sourceImages.length} reference image(s), aspect ratio ${aspectRatio}...`
//             );

//             for (let attempt = 0; attempt <= maxRetries; attempt++) {
//                 try {
//                     const response = await ai.models.generateContent({
//                         model,
//                         contents,
//                         config: generationConfig
//                     });

//                     const parts =
//                         response?.candidates?.[0]?.content?.parts || [];

//                     const imagePart = parts.find(
//                         (part) => part?.inlineData?.data
//                     );

//                     if (!imagePart?.inlineData?.data) {
//                         console.error(
//                             "Gemini response structure:",
//                             JSON.stringify(response, null, 2)
//                         );

//                         throw new Error(
//                             "Gemini completed successfully but did not return raw image data parts."
//                         );
//                     }

//                     const imageBuffer = Buffer.from(
//                         imagePart.inlineData.data,
//                         "base64"
//                     );

//                     console.log(
//                         `Gemini generated image size (${model}):`,
//                         imageBuffer.length
//                     );

//                     return imageBuffer;
//                 } catch (error) {
//                     lastError = error;

//                     if (isHardQuotaError(error)) {
//                         console.warn(
//                             `Model ${model} has zero quota on this project, moving to fallback if available...`,
//                             error?.message || error
//                         );
//                         break; // stop retrying this model, try next model
//                     }

//                     const retryable = isRetryableError(error);

//                     if (!retryable || attempt === maxRetries) {
//                         break; // exhausted retries on this model, try next model
//                     }

//                     const delay =
//                         1000 * Math.pow(2, attempt) + Math.random() * 300;

//                     console.warn(
//                         `Gemini image generation failed on ${model} (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`,
//                         error?.message || error
//                     );

//                     await sleep(delay);
//                 }
//             }
//         }

//         throw lastError;
//     } catch (error) {
//         console.error("generateImage error:", error);
//         throw error;
//     }
// };
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

// When a real uploaded photo is attached as a reference, force the
// model to treat it as the literal identity source: first lock onto
// an enhanced, dynamic photographic likeness of the real person/pet,
// THEN re-render that exact likeness in the requested illustration
// style. Without this instruction, the model tends to treat the
// reference as loose "inspiration" rather than an identity to match.
const buildPromptWithReferenceInstruction = (prompt, hasReferences) => {
    if (!hasReferences) {
        return prompt;
    }

    return `
IDENTITY SOURCE: One or more reference photos of the real person/pet
are attached to this request. Treat the attached photo(s) as the
definitive identity source for the main character's face, hair,
skin tone, body type, and any distinguishing features.

STEP 1 - IDENTITY LOCK: First establish a dynamic, enhanced,
photo-realistic likeness of the exact person/pet shown in the
reference photo(s) - same face shape, same features, same
proportions, same recognizable details. Do not invent a different
looking character.

STEP 2 - STYLE TRANSFER: Then render that exact identity fully in
the illustration style described below. The final image must be a
full illustration in the requested style (not a photo), but the
character within it must clearly be recognizable as the same person
shown in the reference photo(s).

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
    maxRetries = 4
}) => {
    try {
        if (!prompt?.trim()) {
            throw new Error("Image generation prompt is required.");
        }

        const size = closestSupportedSize(width, height);

        const validReferences = referenceImages.filter(
            (image) => image?.buffer
        );

        const imageFiles = await Promise.all(
            validReferences.slice(0, 4).map((image, index) =>
                toFile(
                    image.buffer,
                    `reference-${index}.png`,
                    { type: image.contentType || "image/png" }
                )
            )
        );

        const finalPrompt = buildPromptWithReferenceInstruction(
            prompt,
            imageFiles.length > 0
        );

        console.log(
            `Generating OpenAI image (${MODEL}, quality: ${QUALITY}) with ${imageFiles.length} reference image(s), size ${size}...`
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
                    response?.usage
                );

                return imageBuffer;
            } catch (error) {
                lastError = error;

                const retryable = isRetryableError(error);

                if (!retryable || attempt === maxRetries) {
                    break;
                }

                const delay =
                    1000 * Math.pow(2, attempt) + Math.random() * 300;

                console.warn(
                    `OpenAI image generation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`,
                    error?.message || error
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