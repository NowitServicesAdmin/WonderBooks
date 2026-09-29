import gemini from "../config/gemini.js";
import { createUserContent, createPartFromBase64 } from "@google/genai";

// Configurable so you can drop to a less-loaded model (e.g. "gemini-2.5-flash")
// via env var without touching code, if 3.5 keeps 503ing.
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) => {
  const status = error?.status || error?.code;
  const message = error?.message || "";

  return (
    status === 503 ||
    status === 429 ||
    /UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand/i.test(message)
  );
};

const cleanJson = (text) => {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
};

const normalizeCharacters = (characters = []) => {
  return characters.map((character) => ({
    id: String(character.id),
    type: character.type,
    name: character.name,
    gender: character.gender || "",
    age: character.age || "",
    hobbies: character.hobbies || "",
    favouriteFood: character.favouriteFood || "",
    hasPhoto: Boolean(character.hasPhoto),
    photoUrl: character.photoUrl || null,
    photoStorageProvider: character.photoStorageProvider || null,
    photoStorageKey: character.photoStorageKey || null,
  }));
};

const generateContentWithRetry = async (params, { maxRetries = 4 } = {}) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await gemini.models.generateContent(params);
    } catch (error) {
      lastError = error;

      const retryable = isRetryableError(error);

      if (!retryable || attempt === maxRetries) {
        throw error;
      }

      const delay = 1000 * Math.pow(2, attempt) + Math.random() * 300;

      console.warn(
        `Gemini call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`,
        error?.message || error,
      );

      await sleep(delay);
    }
  }

  throw lastError;
};

export const generateCharacterBible = async ({ story, storyData, characterPhotos = [] }) => {
  try {
    const providedCharacters = normalizeCharacters(storyData.characters || []);

    // Photos actually loaded from S3 for the characters that have one,
    // keyed by characterId so we can label each attached image with the
    // character it belongs to. Without this, appearance fields (hair,
    // eyes, skin tone, fur, species, markings, etc.) were being invented
    // from nothing by a text-only Gemini call that never saw the photo -
    // the bible would describe a generic-looking character instead of the
    // real person/pet/object the user uploaded, and that fabricated
    // description then fought with the real photo later when the
    // canonical reference image was generated.
    const photosById = new Map(
      (characterPhotos || [])
        .filter((photo) => photo?.buffer)
        .map((photo) => [String(photo.characterId), photo]),
    );

    const prompt = `
You are a professional children's storybook character designer.

Create a CHARACTER BIBLE for the story below.

The Character Bible is the canonical source of truth for character
identity and visual appearance across the entire book.

STORY TITLE:
${story.title}

STORY:
${story.pages
  .map(
    (page) =>
      `Page ${page.pageNumber}:
${page.content}`,
  )
  .join("\n\n")}

SELECTED ILLUSTRATION STYLE:
${storyData.imageStyle || "Classic Storybook"}

USER PROVIDED CHARACTERS:
${JSON.stringify(providedCharacters, null, 2)}

CHARACTER RULES:

1. If user-provided characters exist, preserve them.
2. Never rename a user-provided character.
3. Never change a user-provided character type.
4. Never remove a user-provided character.
5. Fill in missing visual information intelligently.
   - EXCEPTION: for any character with a reference photo attached
     to this request (labeled "Reference photo for character ..."
     below), do NOT invent appearance details. Look at that photo
     and describe what is ACTUALLY shown: real hair color/style,
     real eye color, real skin tone, real species/breed, real fur
     color and pattern, real markings, real body proportions. These
     fields must match the attached photo, not a generic guess.
   - Only invent appearance details for characters that have NO
     attached reference photo.
6. If there are NO user-provided characters, determine the minimum
   recurring cast required by the story.
7. The maximum recurring cast is:
   - 1 person
   - 1 pet
   - 1 object
8. Do not create unnecessary recurring characters.
9. A character does NOT need to appear on every page.
10. Only characters actually needed by the story should be recurring.
11. Character identity and appearance must remain unchanged across pages.

IDENTITY CONSISTENCY:

Once a character is defined, these properties are immutable:

- name
- type
- gender
- age
- hair
- eyes
- skin tone
- body
- fur
- markings
- clothing
- primary colors
- secondary colors
- accent colors
- accessories
- personality
- signature details

Scene-specific properties may change:

- pose
- facial expression
- action
- location
- lighting
- camera angle
- interaction with other characters

VISUAL DESIGN:

Design every character so that they are easy to recognize
when appearing on different pages.

For people:
- define hair
- eyes
- skin tone
- body/build
- clothing
- shoes
- accessories

For pets:
- define species
- fur
- markings
- eyes
- body
- collar/accessories

For objects:
- define shape
- material
- primary color
- secondary color
- distinctive details

STYLE:

The character design must work naturally with:
${storyData.imageStyle || "Classic Storybook"}

Do not change the selected illustration style.

RETURN ONLY VALID JSON.

JSON FORMAT:

{
    "characters": [
        {
            "id": "",
            "type": "person",
            "name": "",
            "identity": {
                "gender": "",
                "age": ""
            },
            "appearance": {
                "hair": "",
                "eyes": "",
                "skinTone": "",
                "body": "",
                "fur": "",
                "markings": ""
            },
            "clothing": {
                "top": "",
                "bottom": "",
                "shoes": "",
                "accessories": ""
            },
            "colors": {
                "primary": "",
                "secondary": "",
                "accent": ""
            },
            "personality": [],
            "signatureDetails": [],
            "hasPhoto": false,
            "photoUrl": null,
            "photoStorageProvider": null,
            "photoStorageKey": null
        }
    ]
}
`;

    // Build the multimodal content list: the text prompt, followed by
    // each character's actual uploaded photo (when one exists), each
    // preceded by a short text label naming which character it belongs
    // to. This is what lets Gemini describe the REAL appearance instead
    // of guessing - previously "contents" was just the prompt string, so
    // no image bytes were ever sent to this call at all.
    const contentParts = [prompt];

    for (const character of providedCharacters) {
      const photo = photosById.get(String(character.id));

      if (!photo) {
        continue;
      }

      contentParts.push(
        `Reference photo for character "${character.name}" (id: ${character.id}, type: ${character.type}):`,
      );
      contentParts.push(
        createPartFromBase64(
          photo.buffer.toString("base64"),
          photo.contentType || "image/png",
        ),
      );
    }

    const hasPhotos = contentParts.length > 1;

    // NOTE: the @google/genai SDK expects "config", not "generationConfig".
    // The old field name was silently ignored, so temperature and
    // JSON-mode enforcement weren't actually being applied before.
    const response = await generateContentWithRetry({
      model: TEXT_MODEL, // gemini-3.5-flash is multimodal, handles both cases
      contents: hasPhotos ? createUserContent(contentParts) : prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    console.log("Character Bible Gemini response:", response);
    console.log("Character Bible response text:", response?.text);

    const text =
      typeof response?.text === "string"
        ? response.text
        : response?.candidates?.[0]?.content?.parts
            ?.filter((part) => typeof part?.text === "string")
            ?.map((part) => part.text)
            ?.join("")
            ?.trim();

    if (!text) {
      console.error(
        "Gemini Character Bible empty response:",
        JSON.stringify(response, null, 2),
      );
      throw new Error("Gemini did not return a character bible.");
    }

    const parsed = JSON.parse(cleanJson(text));

    if (!Array.isArray(parsed.characters)) {
      throw new Error("Character Bible must contain a characters array.");
    }

    if (parsed.characters.length > 3) {
      throw new Error(
        "Character Bible cannot contain more than 3 recurring characters.",
      );
    }

    const personCount = parsed.characters.filter(
      (character) => character.type === "person",
    ).length;

    const petCount = parsed.characters.filter(
      (character) => character.type === "pet",
    ).length;

    const objectCount = parsed.characters.filter(
      (character) => character.type === "object",
    ).length;

    if (personCount > 1 || petCount > 1 || objectCount > 1) {
      throw new Error(
        "Character Bible supports at most one person, one pet and one object.",
      );
    }

    return parsed;
  } catch (error) {
    console.error("Character Bible generation error:", error);

    throw error;
  }
};