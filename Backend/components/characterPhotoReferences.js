import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { MAX_REFERENCE_CHARACTERS } from "../config/characterLimits.js";

// Matches your existing uploadToS3 config: bucket "wonderbooks",
// region ap-south-1 (confirmed from your S3 URLs).
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "ap-south-1"
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Every page used to re-download every photo from S3 (10 pages x 5 photos).
// Keys are unique per upload, so a small in-memory cache is safe: a book's
// photos are fetched once and reused for the cover and all pages.
const PHOTO_CACHE_LIMIT = 40;
const photoCache = new Map(); // photoStorageKey -> Buffer

const rememberPhoto = (key, buffer) => {
    photoCache.set(key, buffer);
    while (photoCache.size > PHOTO_CACHE_LIMIT) {
        photoCache.delete(photoCache.keys().next().value);
    }
};

const sameCharacter = (character, lookup) => {
    const value = String(lookup || "").trim().toLowerCase();
    if (!value) return false;
    return (
        String(character?.id || "").trim().toLowerCase() === value ||
        String(character?.name || "").trim().toLowerCase() === value
    );
};

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
 * @param {Object} [options]
 * @param {Array<string>} [options.only] - ids/names of the characters that are
 *   actually in THIS image. When given, only those photos are returned, so a
 *   character that is not in the scene is never drawn into it.
 * @returns {Promise<Array<{ buffer: Buffer, contentType: string, characterId: string, characterName: string, characterType: string }>>}
 */
export const getCharacterPhotoReferenceImages = async (characters = [], { only = null } = {}) => {
    const references = [];

    if (!BUCKET_NAME) {
        console.error(
            "AWS_S3_BUCKET_NAME is not set — cannot load character reference photos."
        );
        return references;
    }

    const wanted = Array.isArray(only) ? only : null;

    for (const character of characters) {
        if (!character?.hasPhoto || !character?.photoStorageKey) {
            continue;
        }

        if (wanted && !wanted.some((lookup) => sameCharacter(character, lookup))) {
            continue;
        }

        try {
            let buffer = photoCache.get(character.photoStorageKey);

            if (!buffer) {
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

                buffer = Buffer.from(bytes);
                rememberPhoto(character.photoStorageKey, buffer);
            }

            references.push({
                buffer,
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

    return references.slice(0, MAX_REFERENCE_CHARACTERS);
};