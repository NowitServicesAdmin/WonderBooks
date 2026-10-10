import { generateContentResilient } from "./geminiCall.js";
import { inferCharacterKind, isBlankField } from "./promptSafety.js";

const cleanJson = (text) => {
    return text
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
};

const IMAGE_PROMPT_ATTEMPTS = 3;

// Light model first; if it is rate-limited or down, the stronger model (its own
// separate quota) takes over for that call.
const PROMPT_MODELS = [
    process.env.GEMINI_PROMPT_MODEL || "gemini-3.5-flash-lite",
    process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash"
];

// Look notes the Character Bible filled in, as ONE compact line. The code (not
// the model) repeats this exact line in every image a character appears in, so
// the look cannot drift from page to page.
const lookSummary = (character = {}) => {
    const { kind } = inferCharacterKind(character);
    const animal = kind === "animal";
    const parts = [];
    const add = (label, value) => {
        // "None" / "N/A" from the Character Bible is not a look detail.
        if (isBlankField(value)) return;
        parts.push(`${label}: ${String(value).trim()}`);
    };
    const look = character.appearance || {};
    const clothes = character.clothing || {};
    const colors = character.colors || {};

    add(animal ? "head fur" : "hair", look.hair);
    add("eyes", look.eyes);
    add(animal ? "skin / snout" : "skin tone", look.skinTone);
    add("body", look.body);
    add("fur", look.fur);
    add("markings", look.markings);
    add("top", clothes.top);
    add("bottom", clothes.bottom);
    add("shoes", clothes.shoes);
    add("main colors", [colors.primary, colors.secondary, colors.accent].filter(Boolean).join(", "));
    if (Array.isArray(character.signatureDetails) && character.signatureDetails.length) {
        add("signature details", character.signatureDetails.join("; "));
    }

    return parts.join("; ");
};

const findCharacter = (characters = [], lookup) => {
    const value = String(lookup?.name || lookup?.id || lookup || "").trim().toLowerCase();
    if (!value) return null;

    return (
        characters.find(
            (item) =>
                String(item?.id || "").trim().toLowerCase() === value ||
                String(item?.name || "").trim().toLowerCase() === value
        ) || null
    );
};

// The cover shows only the main characters (the rest appear on the pages).
// Too many people on one cover is the main reason the picture drops one.
const COVER_MAX_CHARACTERS = Math.max(1, Number(process.env.COVER_MAX_CHARACTERS) || 3);

// A different camera suggestion per page, so the pages stop looking like the
// same group photo again and again.
const SHOT_ROTATION = [
    "wide establishing shot: the whole setting fills most of the frame, characters small to medium in size and in the middle of an action",
    "wide shot from a slightly low angle, characters full-body in mid-action, the tall background (trees, towers, sky) clearly visible",
    "wide three-quarter side view, characters walking or moving, the path and surroundings clearly visible around them",
    "wide over-the-shoulder view looking at what the characters are looking at, the main landmark large in the background",
    "wide eye-level shot, characters full-body and not filling the frame, the setting dominant",
    "high angle looking down on the characters, who look small, with the place around them clearly visible",
    "wide diagonal composition with an interesting object in the foreground and a layered background behind the characters",
    "wide shot of the characters seen from the side or behind, looking into a detailed distance",
];

const shotFor = (index) => SHOT_ROTATION[index % SHOT_ROTATION.length];

// One image prompt per story page, in page order. Prompts are matched to pages
// by pageNumber; if the model left numbers out, fall back to position - but
// only when the count is exactly right, otherwise position would be a guess.
// A page with no usable prompt comes back as null (-> the attempt is retried).
const alignImagesToPages = (images, pages) => {
    const byNumber = new Map();

    for (const image of images) {
        const number = Number(image?.pageNumber);

        if (Number.isInteger(number) && !byNumber.has(number)) {
            byNumber.set(number, image);
        }
    }

    const samePageCount = images.length === pages.length;

    return pages.map((page, index) => {
        const match =
            byNumber.get(Number(page.pageNumber)) ||
            (samePageCount ? images[index] : null);

        if (!match?.prompt || !String(match.prompt).trim()) {
            return null;
        }

        return { ...match, pageNumber: page.pageNumber };
    });
};

const STYLE_BIBLE = {
    watercolor: `
Traditional hand-painted children's watercolor storybook illustration.
Soft watercolor washes.
Visible watercolor paper texture.
Natural hand-painted brush strokes.
Soft edges.
Gentle color transitions.
Warm, expressive storybook atmosphere.
Delicate painted details.
Slight natural watercolor imperfections.
NOT photorealistic.
NOT 3D rendered.
NOT glossy digital art.
NOT anime.
`,

    "3d-animation": `
High-quality 3D animated children's storybook illustration.
Soft rounded character design.
Expressive faces.
Appealing stylized proportions.
Smooth 3D materials.
Soft cinematic lighting.
Warm family-friendly animated movie appearance.
NOT photorealistic.
NOT watercolor.
`,

    geometric: `
Modern geometric children's storybook illustration.
Clean geometric shapes.
Simplified character forms.
Strong visual structure.
Balanced geometric composition.
Clear silhouettes.
Playful modern children's illustration.
NOT photorealistic.
NOT watercolor.
`,

    claymation: `
Handcrafted clay animation children's storybook illustration.
Visible clay texture.
Soft rounded clay characters.
Stop-motion inspired appearance.
Handmade sculpted details.
Soft studio lighting.
Warm playful atmosphere.
NOT photorealistic.
NOT watercolor.
`,

    anime: `
High-quality children's anime storybook illustration.
Clean expressive linework.
Soft cel-shaded rendering.
Large expressive eyes where appropriate.
Detailed but child-friendly character design.
Warm storybook composition.
NOT photorealistic.
NOT watercolor.
`,

    cartoon: `
High-quality children's cartoon storybook illustration.
Clean expressive shapes.
Friendly character design.
Soft outlines.
Bright but harmonious colors.
Playful expressive faces.
Professional children's picture-book appearance.
NOT photorealistic.
NOT watercolor.
`,

    "classic-storybook": `
Classic children's storybook illustration.
Traditional illustrated-book appearance.
Rich hand-painted details.
Soft textured surfaces.
Warm nostalgic atmosphere.
Detailed environments.
Elegant children's publishing illustration.
NOT photorealistic.
NOT 3D rendered.
`,

    "digital-painting": `
Professional digital painting for a children's storybook.
Painterly brushwork.
Rich atmospheric details.
Soft edges.
Expressive characters.
Beautiful environmental depth.
Polished illustrated appearance.
NOT photorealistic.
`,

    fantasy: `
Whimsical fantasy children's storybook illustration.
Magical atmospheric lighting.
Painterly details.
Dreamlike environments.
Expressive friendly characters.
Rich imaginative details.
Child-friendly fantasy artwork.
NOT photorealistic.
`,

    "cute-kawaii": `
Cute kawaii children's storybook illustration.
Adorable simplified character proportions.
Friendly expressive faces.
Soft rounded shapes.
Playful composition.
Clean polished illustration.
Warm child-friendly appearance.
NOT photorealistic.
`,

    "comic-book": `
Professional children's comic-book illustration.
Strong clean linework.
Dynamic composition.
Expressive characters.
Bold but harmonious colors.
Clear readable silhouettes.
Child-friendly comic illustration.
NOT photorealistic.
`,

    "hand-drawn": `
Hand-drawn children's storybook illustration.
Visible artistic linework.
Natural sketch-like details.
Traditional illustrated appearance.
Soft imperfect hand-drawn character shapes.
Warm child-friendly composition.
NOT photorealistic.
`
};

const getStyleBible = (imageStyle = "") => {
    const normalizedStyle = String(imageStyle)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-");

    return (
        STYLE_BIBLE[normalizedStyle] ||
        `
Professional children's storybook illustration.
Hand-crafted illustrated appearance.
Consistent artistic medium.
Soft expressive characters.
Beautiful storybook composition.
Child-friendly visual design.
`
    );
};

// One exact, repeated description line per character in the image.
const characterLine = (character = {}) => {
    const name = character.name || "Unnamed";
    const look = lookSummary(character);
    const { kind, species } = inferCharacterKind(character);
    const who = [character.gender, character.age].filter((v) => v && !/not specified/i.test(String(v))).join(", ");
    // Worn / carried items (a scarf, a daisy) drifted between pages when they
    // were only one detail in a long list, so they are stated on their own.
    const accessories = isBlankField(character.clothing?.accessories)
        ? ""
        : ` Always shown with (exactly these colors every time): ${String(character.clothing.accessories).trim()}.`;

    if (kind === "object") {
        return `- ${name} (object): drawn as an object, never as a person.${look ? ` ${look}.` : ""}${accessories} Match its reference photo.`;
    }

    if (kind === "animal") {
        const label = species ? `a ${species}` : "an animal";
        return `- ${name} (${label}): a real friendly cartoon ${species || "animal"} - an ANIMAL, never a human child or person. Animal body and animal face, NO human features, NO clothes (only the accessories listed below).${look ? ` ${look}.` : ""}${accessories} Match its reference photo.`;
    }

    return `- ${name}${who ? ` (${who})` : ""}:${look ? ` ${look}.` : ""}${accessories} Match the face and look of the reference photo.`;
};

const compactStyle = (imageStyle) =>
    `${getStyleBible(imageStyle)
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" ")} Exactly the same art style and medium as every other image in this book.`;

// Builds the final prompt sent to the image model. The SCENE (written by
// Gemini) comes first because that is what the image model follows most; the
// character looks, style and text rules are added by code so they are the same
// in every image.
export const composeImagePrompt = ({
    scene,
    mood,
    shot,
    sceneCharacters = [],
    imageStyle,
    isCover = false,
    hasRoster = true,
}) => {
    const roster = sceneCharacters.map(characterLine).join("\n");

    return [
        `SCENE: ${String(scene || "").trim()}`,
        shot ? `CAMERA: ${shot}.` : "",
        "FRAMING: pull the camera well back. Show every character full-body, taking up no more than about half of the picture height, with generous space around them. The background fills the rest and is richly detailed in the foreground, middle ground and far distance. No close-ups and no characters cropped by the edge of the picture.",
        mood ? `MOOD: ${mood}.` : "",
        sceneCharacters.length
            ? `CHARACTERS IN THIS IMAGE (draw exactly these ${sceneCharacters.length}, each once, each clearly visible, with exactly this look every time):\n${roster}`
            : hasRoster
                ? "No recurring character is in this image. Do not add any."
                : "",
        `STYLE: ${compactStyle(imageStyle)}`,
        isCover
            ? "COVER COMPOSITION: front cover of a children's book. Keep the upper third calm and uncluttered (sky, soft background) because the title is added later."
            : "",
        "RULES: one single scene, no collage, no panels. The setting described in SCENE must be clearly visible. Every character keeps exactly the same clothes, accessories and colors listed above, even if the SCENE wording suggests otherwise. Absolutely no text, letters, numbers, captions, speech bubbles, logos, watermarks or readable signs in the picture.",
    ]
        .filter(Boolean)
        .join("\n\n");
};

const buildRoster = (characters = []) => {
    if (!characters.length) {
        return "No characters were provided. If the story needs recurring characters, use at most one person, one pet and one object, and describe each one in EXACTLY the same words every time they appear.";
    }

    return characters
        .map((character, index) => {
            // Show what the character really is (a bison saved as "Child" is an
            // animal), so the scene text uses animal actions, not human ones.
            const { kind, species } = inferCharacterKind(character);
            const typeLabel =
                kind === "animal"
                    ? `ANIMAL${species ? ` (${species})` : ""}`
                    : kind === "object"
                        ? "OBJECT"
                        : character.type || "Person";
            const person = kind === "person";
            const bits = [
                character.id || `character-${index + 1}`,
                character.name || "Unnamed",
                typeLabel,
                person && character.age && !/not specified/i.test(character.age) ? `age ${character.age}` : "",
                person && character.gender && !/not specified/i.test(character.gender) ? character.gender : "",
            ].filter(Boolean);
            return `- ${bits.join(" | ")}`;
        })
        .join("\n");
};

export const generateImagePrompt = async (story, storyData) => {
    try {
        const characters = storyData?.characters || [];
        const hasRoster = characters.length > 0;
        const pages = story?.pages || [];

        const prompt = `
You are a children's picture-book art director. Write the SCENE DESCRIPTION
for the COVER and for EACH PAGE of the story below.

A separate program adds the character looks, the art style and the text rules
to every scene. So you must NOT describe what characters look like (no hair,
clothes, colors or faces) and must NOT mention the art style. ${hasRoster ? "" : "(No characters were provided, so in this case DO describe any recurring character's look, in exactly the same words every time.)"}
Your job is the scene: WHERE it happens and WHAT is happening.

STORY TITLE: ${story?.title || "Untitled Story"}

CHARACTERS (id | name | type | age | gender):
${buildRoster(characters)}

==================================================
STORY PAGES (with a suggested camera for each page)
==================================================
${pages
    .map(
        (page, index) => `
PAGE ${page.pageNumber}
SUGGESTED CAMERA: ${shotFor(index)}
STORY CONTENT:
${page.content}
`
    )
    .join("\n")}

==================================================
HOW TO WRITE EACH "prompt" (50 to 90 words)
==================================================
1. START WITH THE SETTING of that page: the exact place and its most
   distinctive visible features from the story, for example "a bright
   futuristic city with shimmering glass towers and a tiny moon-shaped park".
   Never fall back to a generic park, forest or room unless the story says so.
2. THEN say what each character in the image is DOING, using an action verb and
   a body pose tied to what happens on that page, plus their expression.
   Characters interact with the setting and with each other (reaching, running,
   pointing, climbing, looking up, carrying something). They must NOT stand in a
   row facing the viewer like a group photo.
3. Use the suggested camera for the page. Every shot is WIDE: never write a
   close-up or a medium close-up, and never make the characters fill the
   picture. Describe the background in layers (foreground, middle, far distance)
   so the setting is clearly seen.
4. Include ONLY the characters that the page needs. A character who is not in
   that moment of the story is left out.
5. Mention the one or two important objects from the story text (for example a
   glowing sword in a stone, a rope bridge, a lantern).
6. One single scene. No collage, no panels.
7. Use no text, signs, letters or numbers in the picture.
8. NEVER state a color, pattern or design for a character's own clothes or
   accessories (write "his scarf", not "a colorful scarf"; "her daisy", not "a
   pink daisy"). Their exact colors are added separately and must not be
   overridden by the scene text.

COVER: one scene in the story's most important setting that shows the theme
and mood of the whole story. Use only the 2 or 3 MAIN characters (never more
than ${COVER_MAX_CHARACTERS}), in a lively, friendly pose that is not a stiff line-up.

==================================================
IMAGE SAFETY RULES (very important)
==================================================

The image model runs a strict safety check on the FINISHED
picture. Write every scene so the result passes it while
still telling the story:

- Animals are animals: describe them with fur/feathers and
  animal proportions. Never use "young male/female" for an
  animal and never give animals human hair or clothes unless
  the story says so.
- Conflict and battles are allowed as the story needs
  (${storyData?.age || "age not specified"}). Show them through heroic poses,
  magic, light, wind, sparks and dramatic composition. NEVER
  show blood, wounds, gore, corpses, torture or nudity.
- Villains (for example a demon lord) are stylized in the
  selected illustration style, menacing but not horrifying.
  For readers under 8 make them silly or only mildly spooky.
- Show affection with calm wording such as "standing side by
  side" or "smiling at each other". Do NOT use the words hug,
  embrace, cuddle, kiss or carry for close body contact.
- Any human child must be fully dressed in ordinary everyday
  clothes, shown in a normal full-body or medium shot. No
  bath, bed, swimming or undressing scenes.
- Use a calm composition for readers under 8. For older
  readers, tension and dramatic scenes are fine.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON, no markdown, no code block, no text before or after:

{
    "cover": {
        "scene": "",
        "mood": "",
        "characters": [],
        "prompt": ""
    },
    "images": [
        {
            "pageNumber": 1,
            "scene": "",
            "mood": "",
            "characters": [],
            "prompt": ""
        }
    ]
}

Rules:
- "cover" is a single object (not an array).
- "pageNumber" matches the story page number.
- "scene" is ONE short sentence summarising the picture (setting + action).
- "mood" is two or three words.
- "characters" lists ONLY the characters that appear in that image, using the
  exact ids from the CHARACTERS list above.
- "prompt" is the scene description written as described above.
- Generate exactly ${pages.length} objects in "images", one per story page.
`;

        // Gemini occasionally returns bad JSON, a wrong number of prompts, or
        // a transient API error. With 10 pages that happens often enough to
        // matter, so try a few times before giving up on the whole book.
        let lastError;

        for (let attempt = 1; attempt <= IMAGE_PROMPT_ATTEMPTS; attempt += 1) {
            try {
                const response = await generateContentResilient({
                    label: "Image prompts",
                    models: PROMPT_MODELS,
                    attemptsPerModel: 2,
                    contents: prompt
                });

                const rawText = response.text.trim();

                console.log("Gemini image prompt response:", rawText);

                const parsedResult = JSON.parse(cleanJson(rawText));

                if (!parsedResult?.cover?.prompt) {
                    throw new Error(
                        "Invalid image prompt response: cover prompt missing."
                    );
                }

                if (!Array.isArray(parsedResult.images)) {
                    throw new Error(
                        "Invalid image prompt response: images array missing."
                    );
                }

                const images = alignImagesToPages(
                    parsedResult.images,
                    story.pages
                );

                if (images.some((image) => !image)) {
                    throw new Error(
                        `Expected ${story.pages.length} image prompts but received ${parsedResult.images.length}.`
                    );
                }

                // Turn the model's scene text into the final prompt: scene
                // first, then the exact character looks, style and rules.
                const resolveSceneCharacters = (entries = [], max = Infinity) => {
                    const found = [];
                    for (const entry of Array.isArray(entries) ? entries : []) {
                        const match = findCharacter(characters, entry);
                        if (match && !found.includes(match)) found.push(match);
                    }
                    return found.slice(0, max);
                };

                const coverRaw = parsedResult.cover;
                let coverCharacters = resolveSceneCharacters(coverRaw.characters, COVER_MAX_CHARACTERS);
                if (!coverCharacters.length && characters.length) {
                    coverCharacters = characters.slice(0, COVER_MAX_CHARACTERS);
                }

                const cover = {
                    ...coverRaw,
                    scene: String(coverRaw.scene || coverRaw.prompt).slice(0, 400),
                    characters: coverCharacters.map((c) => c.id || c.name),
                    prompt: composeImagePrompt({
                        scene: coverRaw.prompt,
                        mood: coverRaw.mood,
                        sceneCharacters: coverCharacters,
                        imageStyle: storyData?.imageStyle,
                        isCover: true,
                        hasRoster
                    })
                };

                const finalImages = images.map((image, index) => {
                    const sceneCharacters = resolveSceneCharacters(image.characters);

                    return {
                        ...image,
                        scene: String(image.scene || image.prompt).slice(0, 400),
                        // Keep the model's own list if none matched, so
                        // downstream lookups behave exactly as before.
                        characters: sceneCharacters.length
                            ? sceneCharacters.map((c) => c.id || c.name)
                            : image.characters || [],
                        prompt: composeImagePrompt({
                            scene: image.prompt,
                            mood: image.mood,
                            shot: sceneCharacters.length ? shotFor(index) : "",
                            sceneCharacters,
                            imageStyle: storyData?.imageStyle,
                            hasRoster
                        })
                    };
                });

                return { ...parsedResult, cover, images: finalImages };
            } catch (attemptError) {
                lastError = attemptError;
                console.error(
                    `generateImagePrompt attempt ${attempt}/${IMAGE_PROMPT_ATTEMPTS} failed:`,
                    attemptError.message
                );

                // Every Gemini model already refused (quota / outage): trying
                // again right away only burns more quota. Retries are for bad
                // JSON or a wrong page count.
                if (attemptError.allModelsFailed) {
                    break;
                }

                if (attempt < IMAGE_PROMPT_ATTEMPTS) {
                    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
                }
            }
        }

        throw lastError;
    } catch (error) {
        console.error("generateImagePrompt error:", error);
        throw error;
    }
};