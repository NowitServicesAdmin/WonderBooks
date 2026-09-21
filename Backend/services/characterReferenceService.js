import sharp from "sharp";
import crypto from "crypto";

import { getFromS3 } from "./s3Service.js";
import { uploadImage } from "./storageService.js";
import { generateImage } from "../components/imageGenerator.js";

const prepareReferenceImage = async (buffer) => {
    return sharp(buffer)
        .resize(512, 512, {
            fit: "inside",
            withoutEnlargement: true
        })
        .png()
        .toBuffer();
};

const buildCharacterReferencePrompt = ({
    character,
    imageStyle
}) => {
    return `
Create a canonical character reference illustration for a children's storybook.

ILLUSTRATION STYLE:
${imageStyle}

CHARACTER:

Name:
${character.name}

Type:
${character.type}

Identity:
Gender: ${character.identity?.gender || "Not specified"}
Age: ${character.identity?.age || "Not specified"}

Appearance:
Hair: ${character.appearance?.hair || "Not specified"}
Eyes: ${character.appearance?.eyes || "Not specified"}
Skin Tone: ${character.appearance?.skinTone || "Not specified"}
Body: ${character.appearance?.body || "Not specified"}
Fur: ${character.appearance?.fur || "Not specified"}
Markings: ${character.appearance?.markings || "Not specified"}

Clothing:
Top: ${character.clothing?.top || "Not specified"}
Bottom: ${character.clothing?.bottom || "Not specified"}
Shoes: ${character.clothing?.shoes || "Not specified"}
Accessories: ${character.clothing?.accessories || "Not specified"}

Colors:
Primary: ${character.colors?.primary || "Not specified"}
Secondary: ${character.colors?.secondary || "Not specified"}
Accent: ${character.colors?.accent || "Not specified"}

Personality:
${(character.personality || []).join(", ")}

Signature Details:
${(character.signatureDetails || []).join(", ")}

CHARACTER CONSISTENCY:

This is the canonical visual reference for this character.

Preserve exactly:
- identity
- facial structure
- hair
- eyes
- skin tone
- body proportions
- fur
- markings
- clothing
- colors
- accessories
- distinctive details

Do not redesign the character.

Create a clean full-body character reference.
Use a simple uncluttered background.
Show the entire character clearly.
No text.
No watermark.
`;
};

const getS3ImageBuffer = async (key) => {
    const response = await getFromS3(key);

    if (!response?.Body) {
        throw new Error(
            `Unable to read S3 object: ${key}`
        );
    }

    const bytes =
        await response.Body.transformToByteArray();

    return Buffer.from(bytes);
};

export const generateCharacterReference = async ({
    bookId,
    character,
    imageStyle
}) => {
    try {
        const prompt =
            buildCharacterReferencePrompt({
                character,
                imageStyle
            });

        let referenceImages = [];

        // User uploaded photo
        if (
            character.hasPhoto &&
            character.photoStorageProvider === "s3" &&
            character.photoStorageKey
        ) {
            console.log(
                `Loading S3 reference photo for ${character.name}...`
            );

            const originalBuffer =
                await getS3ImageBuffer(
                    character.photoStorageKey
                );

            const preparedBuffer =
                await prepareReferenceImage(
                    originalBuffer
                );

            referenceImages.push({
                buffer: preparedBuffer,
                contentType: "image/png"
            });
        }

        console.log(
            `Generating canonical reference for ${character.name}...`
        );

        const imageBuffer =
            await generateImage({
                prompt,
                referenceImages,
                width: 768,
                height: 1024
            });

        if (
            !imageBuffer ||
            !imageBuffer.length
        ) {
            throw new Error(
                `No reference image generated for ${character.name}`
            );
        }

        const key =
            `books/${bookId}/characters/${character.id}/reference-${crypto.randomUUID()}.png`;

        const uploaded =
            await uploadImage({
                key,
                buffer: imageBuffer,
                contentType: "image/png"
            });

        console.log(
            `Character reference uploaded: ${uploaded.url}`
        );

        return {
            referenceImageUrl: uploaded.url,
            referenceStorageProvider:
                uploaded.provider,
            referenceStorageKey:
                uploaded.key
        };
    } catch (error) {
        console.error(
            `Character reference generation failed for ${character.name}:`,
            error
        );

        throw error;
    }
};


export const generateCharacterReferences = async ({
    bookId,
    characters,
    imageStyle
}) => {
    const updatedCharacters = [];

    for (const character of characters) {
        const reference =
            await generateCharacterReference({
                bookId,
                character,
                imageStyle
            });

        updatedCharacters.push({
            ...character,
            ...reference
        });
    }

    return updatedCharacters;
};

// import sharp from "sharp";
// import crypto from "crypto";

// import { getFromS3 } from "./s3Service.js";
// import { uploadImage } from "./storageService.js";
// import { generateImage } from "../components/imageGenerator.js";

// const prepareReferenceImage = async (buffer) => {
//     return sharp(buffer)
//         .resize(512, 512, {
//             fit: "inside",
//             withoutEnlargement: true
//         })
//         .png()
//         .toBuffer();
// };

// const buildCharacterReferencePrompt = ({
//     character,
//     imageStyle
// }) => {
//     return `
// Create a canonical character reference illustration for a children's storybook.

// ILLUSTRATION STYLE:
// ${imageStyle}

// CHARACTER:

// Name:
// ${character.name}

// Type:
// ${character.type}

// Identity:
// Gender: ${character.identity?.gender || "Not specified"}
// Age: ${character.identity?.age || "Not specified"}

// Appearance:
// Hair: ${character.appearance?.hair || "Not specified"}
// Eyes: ${character.appearance?.eyes || "Not specified"}
// Skin Tone: ${character.appearance?.skinTone || "Not specified"}
// Body: ${character.appearance?.body || "Not specified"}
// Fur: ${character.appearance?.fur || "Not specified"}
// Markings: ${character.appearance?.markings || "Not specified"}

// Clothing:
// Top: ${character.clothing?.top || "Not specified"}
// Bottom: ${character.clothing?.bottom || "Not specified"}
// Shoes: ${character.clothing?.shoes || "Not specified"}
// Accessories: ${character.clothing?.accessories || "Not specified"}

// Colors:
// Primary: ${character.colors?.primary || "Not specified"}
// Secondary: ${character.colors?.secondary || "Not specified"}
// Accent: ${character.colors?.accent || "Not specified"}

// Personality:
// ${(character.personality || []).join(", ")}

// Signature Details:
// ${(character.signatureDetails || []).join(", ")}

// CHARACTER CONSISTENCY:

// This is the canonical visual reference for this character.

// Preserve exactly:
// - identity
// - facial structure
// - hair
// - eyes
// - skin tone
// - body proportions
// - fur
// - markings
// - clothing
// - colors
// - accessories
// - distinctive details

// Do not redesign the character.

// If a reference photo is provided, use it as the primary visual identity reference.
// Preserve the person's recognizable facial features and overall appearance while adapting them to the requested illustration style.

// Create a clean full-body character reference.

// Show the entire character clearly from head to toe.
// Use a simple uncluttered background.
// Keep the character centered.
// Use consistent proportions.
// Do not add other characters or objects.
// No text.
// No watermark.
// `;
// };

// const getS3ImageBuffer = async (key) => {
//     const response = await getFromS3(key);

//     if (!response?.Body) {
//         throw new Error(
//             `Unable to read S3 object: ${key}`
//         );
//     }

//     const bytes =
//         await response.Body.transformToByteArray();

//     return Buffer.from(bytes);
// };

// export const generateCharacterReference = async ({
//     bookId,
//     character,
//     imageStyle
// }) => {
//     try {
//         const prompt =
//             buildCharacterReferencePrompt({
//                 character,
//                 imageStyle
//             });

//         const referenceImages = [];

//         // User uploaded photo
//         if (
//             character.hasPhoto &&
//             character.photoStorageProvider === "s3" &&
//             character.photoStorageKey
//         ) {
//             console.log(
//                 `Loading S3 reference photo for ${character.name}...`
//             );

//             const originalBuffer =
//                 await getS3ImageBuffer(
//                     character.photoStorageKey
//                 );

//             const preparedBuffer =
//                 await prepareReferenceImage(
//                     originalBuffer
//                 );

//             referenceImages.push({
//                 buffer: preparedBuffer,
//                 contentType: "image/png"
//             });

//             console.log(
//                 `Prepared uploaded photo for ${character.name}`
//             );
//         }

//         console.log(
//             `Generating canonical Gemini reference for ${character.name}...`
//         );

//         const imageBuffer =
//             await generateImage({
//                 prompt,
//                 referenceImages,
//                 width: 768,
//                 height: 1024
//             });

//         if (
//             !imageBuffer ||
//             !imageBuffer.length
//         ) {
//             throw new Error(
//                 `No reference image generated for ${character.name}`
//             );
//         }

//         // Normalize Gemini output to PNG
//         const normalizedImage =
//             await sharp(imageBuffer)
//                 .png()
//                 .toBuffer();

//         const key =
//             `books/${bookId}/characters/${character.id}/reference-${crypto.randomUUID()}.png`;

//         // Generated character references are stored in R2
//         const uploaded =
//             await uploadImage({
//                 key,
//                 buffer: normalizedImage,
//                 contentType: "image/png"
//             });

//         console.log(
//             `Character reference uploaded to R2: ${uploaded.url}`
//         );

//         return {
//             referenceImageUrl: uploaded.url,
//             referenceStorageProvider:
//                 uploaded.provider,
//             referenceStorageKey:
//                 uploaded.key
//         };
//     } catch (error) {
//         console.error(
//             `Character reference generation failed for ${character.name}:`,
//             error
//         );

//         throw error;
//     }
// };

// export const generateCharacterReferences = async ({
//     bookId,
//     characters,
//     imageStyle
// }) => {
//     const updatedCharacters = [];

//     for (const character of characters) {
//         const reference =
//             await generateCharacterReference({
//                 bookId,
//                 character,
//                 imageStyle
//             });

//         updatedCharacters.push({
//             ...character,
//             ...reference
//         });
//     }

//     return updatedCharacters;
// };