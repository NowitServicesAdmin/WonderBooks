import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Matches your existing uploadToS3 config: bucket "wonderbooks",
// region ap-south-1 (confirmed from your S3 URLs).
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "ap-south-1"
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

/**
 * Loads the ORIGINAL uploaded character photos directly from S3
 * (character.photoStorageKey), rather than a canonical Gemini-generated
 * reference (character.referenceStorageKey).
 *
 * Each returned reference carries the character's name/type/id alongside
 * its image buffer. Without this, every reference photo (person, pet,
 * object) was an anonymous, unlabeled buffer — the image model had no way
 * to know which photo belonged to which character, so it defaulted to
 * treating the request as if there were only one identity to match
 * (almost always the person). Keeping this metadata attached lets
 * generateImage build an explicit "reference photo N = this character"
 * manifest so every character with a photo gets matched to its own.
 *
 * @param {Array<Object>} characters - storyData.characters
 * @returns {Promise<Array<{ buffer: Buffer, contentType: string, characterId: string, characterName: string, characterType: string }>>}
 */
export const getCharacterPhotoReferenceImages = async (characters = []) => {
    const references = [];

    if (!BUCKET_NAME) {
        console.error(
            "AWS_S3_BUCKET_NAME is not set — cannot load character reference photos."
        );
        return references;
    }

    for (const character of characters) {
        if (!character?.hasPhoto || !character?.photoStorageKey) {
            continue;
        }

        try {
            console.log(
                `Loading uploaded photo for character ${character.name}...`
            );

            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: character.photoStorageKey
            });

            const response = await s3Client.send(command);

            if (!response?.Body) {
                console.warn(
                    `Empty S3 photo for character: ${character.name}`
                );
                continue;
            }

            const bytes = await response.Body.transformToByteArray();

            if (!bytes?.length) {
                console.warn(
                    `Empty photo buffer for character: ${character.name}`
                );
                continue;
            }

            references.push({
                buffer: Buffer.from(bytes),
                contentType: "image/png",
                characterId: character.id,
                characterName: character.name || "Unnamed character",
                characterType: character.type || "Character"
            });

            console.log(`Photo loaded for ${character.name}`);
        } catch (error) {
            console.error(
                `Failed to load uploaded photo for character ${character.name}:`,
                error
            );
        }
    }

    return references.slice(0, 4);
};