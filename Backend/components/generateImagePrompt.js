// import { generateContentResilient } from "./geminiCall.js";
// import { inferCharacterKind, isBlankField, stripLiteralText } from "./promptSafety.js";
// import { isNamedIn, pickPageCast } from "./sceneCast.js";

// const cleanJson = (text) => {
//     return text
//         .replace(/^```json\s*/i, "")
//         .replace(/\s*```$/i, "")
//         .trim();
// };

// const IMAGE_PROMPT_ATTEMPTS = 3;

// // Light model first; if it is rate-limited or down, the stronger model (its own
// // separate quota) takes over for that call.
// const PROMPT_MODELS = [
//     process.env.GEMINI_PROMPT_MODEL || "gemini-3.5-flash-lite",
//     process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash"
// ];

// // Look notes the Character Bible filled in, as ONE compact line. The code (not
// // the model) repeats this exact line in every image a character appears in, so
// // the look cannot drift from page to page.
// const lookSummary = (character = {}) => {
//     const { kind } = inferCharacterKind(character);
//     const animal = kind === "animal";
//     const parts = [];
//     const add = (label, value) => {
//         // "None" / "N/A" from the Character Bible is not a look detail.
//         if (isBlankField(value)) return;
//         parts.push(`${label}: ${stripLiteralText(value)}`);
//     };
//     const look = character.appearance || {};
//     const clothes = character.clothing || {};
//     const colors = character.colors || {};

//     add(animal ? "head fur" : "hair", look.hair);
//     add("eyes", look.eyes);
//     add(animal ? "skin / snout" : "skin tone", look.skinTone);
//     add("body", look.body);
//     add("fur", look.fur);
//     add("markings", look.markings);
//     add("top", clothes.top);
//     add("bottom", clothes.bottom);
//     add("shoes", clothes.shoes);
//     add("main colors", [colors.primary, colors.secondary, colors.accent].filter(Boolean).join(", "));
//     if (Array.isArray(character.signatureDetails) && character.signatureDetails.length) {
//         add("signature details", character.signatureDetails.join("; "));
//     }

//     return parts.join("; ");
// };

// const findCharacter = (characters = [], lookup) => {
//     const value = String(lookup?.name || lookup?.id || lookup || "").trim().toLowerCase();
//     if (!value) return null;

//     return (
//         characters.find(
//             (item) =>
//                 String(item?.id || "").trim().toLowerCase() === value ||
//                 String(item?.name || "").trim().toLowerCase() === value
//         ) || null
//     );
// };

// // The cover shows only the main characters (the rest appear on the pages).
// // Too many people on one cover is the main reason the picture drops one.
// const COVER_MAX_CHARACTERS = Math.max(1, Number(process.env.COVER_MAX_CHARACTERS) || 3);

// const pickCoverCharacters = (list = []) => {
//     const living = list
//         .filter((c) => inferCharacterKind(c).kind !== "object")
//         .slice(0, COVER_MAX_CHARACTERS);
//     const prop = list.find((c) => inferCharacterKind(c).kind === "object");
//     return list.filter((c) => living.includes(c) || c === prop);
// };

// // A book has at most 3 people + 1 pet + 1 object = 5 characters. Every character the
// // page text names must be drawn, so the default is 5 (it used to be 4, which silently
// // dropped one person on any page that named everybody). The generator merges the pet
// // and the object into one reference sheet when more than 4 files would be sent.
// const PAGE_MAX_CHARACTERS = Math.max(1, Number(process.env.PAGE_MAX_CHARACTERS) || 5);

// // A different camera suggestion per page, so the pages stop looking like the
// // same group photo again and again.
// const SHOT_ROTATION = [
//     "wide establishing shot: the whole place fills most of the picture and the characters, seen from the front or three-quarter view with their faces visible, are in the middle of an action",
//     "wide shot from a slightly low angle, full-body characters in mid-action with faces visible, the tall background (trees, towers, sky) rising above them",
//     "wide three-quarter view, characters walking or moving along a path and turning toward the viewer, the surroundings clearly visible around them",
//     "wide shot where the characters look toward the main landmark but turn their faces three-quarters to the viewer, the landmark large behind them",
//     "wide eye-level shot, full-body characters with faces visible, the setting dominant and richly detailed",
//     "high angle looking down on the characters (faces still visible) with the whole place around them clearly visible",
//     "wide diagonal composition with the key object clearly in the foreground and a layered background behind the characters",
//     "wide shot with the characters at the side of the picture facing the viewer three-quarters, a detailed, far-reaching distance behind them",
// ];

// const shotFor = (index) => SHOT_ROTATION[index % SHOT_ROTATION.length];

// const mentionsAny = (text = "", characters = []) => {
//     const names = characters
//         .map((c) => String(c?.name || "").trim())
//         .filter(Boolean)
//         .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
//     return names.length
//         ? new RegExp(`\\b(${names.join("|")})\\b`, "i").test(String(text))
//         : false;
// };

// const dropSentencesAbout = (text = "", characters = []) => {
//     const names = characters
//         .map((c) => String(c?.name || "").trim())
//         .filter(Boolean)
//         .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

//     if (!names.length) return String(text);

//     const mention = new RegExp(`\\b(${names.join("|")})\\b`, "i");
//     const kept = String(text)
//         .split(/(?<=[.!?])\s+/)
//         .filter((sentence) => !mention.test(sentence));

//     // never return an empty scene
//     return kept.length ? kept.join(" ") : String(text);
// };

// // One image prompt per story page, in page order. Prompts are matched to pages
// // by pageNumber; if the model left numbers out, fall back to position - but
// // only when the count is exactly right, otherwise position would be a guess.
// // A page with no usable prompt comes back as null (-> the attempt is retried).
// const alignImagesToPages = (images, pages) => {
//     const byNumber = new Map();

//     for (const image of images) {
//         const number = Number(image?.pageNumber);

//         if (Number.isInteger(number) && !byNumber.has(number)) {
//             byNumber.set(number, image);
//         }
//     }

//     const samePageCount = images.length === pages.length;

//     return pages.map((page, index) => {
//         const match =
//             byNumber.get(Number(page.pageNumber)) ||
//             (samePageCount ? images[index] : null);

//         if (!match?.prompt || !String(match.prompt).trim()) {
//             return null;
//         }

//         return { ...match, pageNumber: page.pageNumber };
//     });
// };

// const STYLE_BIBLE = {
//     watercolor: `
// Traditional hand-painted children's watercolor storybook illustration.
// Soft watercolor washes.
// Visible watercolor paper texture.
// Natural hand-painted brush strokes.
// Soft edges.
// Gentle color transitions.
// Warm, expressive storybook atmosphere.
// Delicate painted details.
// Slight natural watercolor imperfections.
// NOT photorealistic.
// NOT 3D rendered.
// NOT glossy digital art.
// NOT anime.
// `,

//     "3d-animation": `
// High-quality 3D animated children's storybook illustration.
// Soft rounded character design.
// Expressive faces.
// Appealing stylized proportions.
// Smooth 3D materials.
// Soft cinematic lighting.
// Warm family-friendly animated movie appearance.
// NOT photorealistic.
// NOT watercolor.
// `,

//     geometric: `
// Modern geometric children's storybook illustration.
// Clean geometric shapes.
// Simplified character forms.
// Strong visual structure.
// Balanced geometric composition.
// Clear silhouettes.
// Playful modern children's illustration.
// NOT photorealistic.
// NOT watercolor.
// `,

//     claymation: `
// Handcrafted clay animation children's storybook illustration.
// Visible clay texture.
// Soft rounded clay characters.
// Stop-motion inspired appearance.
// Handmade sculpted details.
// Soft studio lighting.
// Warm playful atmosphere.
// NOT photorealistic.
// NOT watercolor.
// `,

//     anime: `
// High-quality children's anime storybook illustration.
// Clean expressive linework.
// Soft cel-shaded rendering.
// Large expressive eyes where appropriate.
// Detailed but child-friendly character design.
// Warm storybook composition.
// NOT photorealistic.
// NOT watercolor.
// `,

//     cartoon: `
// High-quality children's cartoon storybook illustration.
// Clean expressive shapes.
// Friendly character design.
// Soft outlines.
// Bright but harmonious colors.
// Playful expressive faces.
// Professional children's picture-book appearance.
// NOT photorealistic.
// NOT watercolor.
// `,

//     "classic-storybook": `
// Classic children's storybook illustration.
// Traditional illustrated-book appearance.
// Rich hand-painted details.
// Soft textured surfaces.
// Warm nostalgic atmosphere.
// Detailed environments.
// Elegant children's publishing illustration.
// NOT photorealistic.
// NOT 3D rendered.
// `,

//     "digital-painting": `
// Professional digital painting for a children's storybook.
// Painterly brushwork.
// Rich atmospheric details.
// Soft edges.
// Expressive characters.
// Beautiful environmental depth.
// Polished illustrated appearance.
// NOT photorealistic.
// `,

//     fantasy: `
// Whimsical fantasy children's storybook illustration.
// Magical atmospheric lighting.
// Painterly details.
// Dreamlike environments.
// Expressive friendly characters.
// Rich imaginative details.
// Child-friendly fantasy artwork.
// NOT photorealistic.
// `,

//     "cute-kawaii": `
// Cute kawaii children's storybook illustration.
// Adorable simplified character proportions.
// Friendly expressive faces.
// Soft rounded shapes.
// Playful composition.
// Clean polished illustration.
// Warm child-friendly appearance.
// NOT photorealistic.
// `,

//     "comic-book": `
// Professional children's comic-book illustration.
// Strong clean linework.
// Dynamic composition.
// Expressive characters.
// Bold but harmonious colors.
// Clear readable silhouettes.
// Child-friendly comic illustration.
// NOT photorealistic.
// `,

//     "hand-drawn": `
// Hand-drawn children's storybook illustration.
// Visible artistic linework.
// Natural sketch-like details.
// Traditional illustrated appearance.
// Soft imperfect hand-drawn character shapes.
// Warm child-friendly composition.
// NOT photorealistic.
// `
// };

// Object.assign(STYLE_BIBLE, {
//     "3d-storybook": `
// High-quality 3D animated children's storybook illustration.
// Soft rounded character design, expressive faces, smooth 3D materials.
// Soft cinematic lighting, warm family-friendly animated movie look.
// NOT photorealistic.
// `,
//     watercolour: `
// Traditional hand-painted children's watercolour storybook illustration.
// Soft watercolour washes, visible paper texture, gentle brush strokes and soft edges.
// Warm, dreamy storybook atmosphere.
// NOT photorealistic. NOT 3D rendered. NOT glossy digital art. NOT anime.
// `,
//     "classic-illustrated": `
// Timeless classic illustrated storybook look.
// Fine ink outlines with rich painted colour, traditional book-illustration detail.
// Warm, slightly muted classic palette.
// NOT photorealistic. NOT 3D rendered.
// `,
//     "picture-book-kids": `
// Simple, bright children's picture-book illustration.
// Friendly rounded shapes, bold clean outlines, flat cheerful colours, uncluttered detail.
// NOT photorealistic. NOT 3D rendered.
// `,
//     "black-white-sketch": `
// Black and white pencil and ink sketch illustration.
// Hand-drawn linework with soft graphite shading and cross-hatching, no colour at all.
// NOT photorealistic. NOT colour.
// `,
//     "minimal-modern": `
// Clean minimal modern children's illustration.
// Simple geometric shapes, flat colours, a limited harmonious palette, lots of calm space.
// NOT photorealistic. NOT 3D rendered. NOT busy.
// `,
//     "vintage-retro": `
// Vintage retro children's book illustration.
// Old-print look with slightly faded warm colours, gentle grain and mid-century storybook charm.
// NOT photorealistic. NOT 3D rendered. NOT glossy digital art.
// `,
//     "fairy-tale": `
// Enchanted fairy-tale storybook illustration.
// Richly painted magical atmosphere, glowing soft light, storybook castles, forests and sparkles.
// Warm, detailed hand-painted look.
// NOT photorealistic. NOT 3D rendered. NOT anime.
// `,
//     "night-bedtime": `
// Calm bedtime storybook illustration.
// Moonlit night colours, deep blues and purples with warm glowing lights, soft sleepy edges.
// Gentle, peaceful, hand-painted look.
// NOT photorealistic. NOT harsh or scary.
// `,
//     adventure: `
// Bold dynamic adventure storybook illustration.
// Vivid saturated colours, bright clear lighting, sweeping landscapes, sense of movement.
// Painted children's book look.
// NOT photorealistic. NOT dark or scary.
// `,
//     "line-art-colouring": `
// Clean black line-art colouring-book illustration.
// Clear, even outlines on a plain white background, no shading, no filled colour.
// NOT photorealistic. NOT colour.
// `,
//     "seasonal-autumn": `
// Warm autumn storybook illustration.
// Falling leaves, golden orange and red harvest colours, cosy soft light.
// Hand-painted children's book look.
// NOT photorealistic. NOT 3D rendered.
// `,
// });

// const getStyleBible = (imageStyle = "") => {
//     // "Picture Book (Kids)" -> "picture-book-kids", "Night / Bedtime" -> "night-bedtime"
//     const normalizedStyle = String(imageStyle)
//         .toLowerCase()
//         .replace(/[^a-z0-9]+/g, "-")
//         .replace(/^-+|-+$/g, "");

//     return (
//         STYLE_BIBLE[normalizedStyle] ||
//         `
// ${String(imageStyle || "").trim() ? `Illustration style: ${String(imageStyle).trim()}.` : ""}
// Professional children's storybook illustration.
// Hand-crafted illustrated appearance.
// Consistent artistic medium.
// Soft expressive characters.
// Beautiful storybook composition.
// Child-friendly visual design.
// `
//     );
// };

// // One exact, repeated description line per character in the image.
// const characterLine = (character = {}) => {
//     const name = character.name || "Unnamed";
//     const look = lookSummary(character);
//     const { kind, species } = inferCharacterKind(character);
//     const who = [character.gender, character.age].filter((v) => v && !/not specified/i.test(String(v))).join(", ");
//     // Worn / carried items (a scarf, a daisy) drifted between pages when they
//     // were only one detail in a long list, so they are stated on their own.
//     const accessories = isBlankField(character.clothing?.accessories)
//         ? ""
//         : ` Always shown with (exactly these colors every time): ${String(character.clothing.accessories).trim()}.`;

//     if (kind === "object") {
//         return `- ${name} (object): drawn as an object, never as a person. KEY PROP: draw it LARGE and unmistakable, at least as big as a character's head, drawn exactly ONCE in its exact reference design, never tiny, never hidden, never behind anything.${look ? ` ${look}.` : ""}${accessories} Any sticker, label, badge or print on it is a plain blank shape with a simple symbol: NO letters or words on it. Match its reference image exactly.`;
//     }

//     if (kind === "animal") {
//         const label = species ? `a ${species}` : "an animal";
//         return `- ${name} (${label}): a real friendly cartoon ${species || "animal"} - an ANIMAL, never a human child or person. Animal body and animal face, NO human features, NO clothes (only the accessories listed below).${look ? ` ${look}.` : ""}${accessories} Same body shape and proportions in every pose, also when flying or jumping. Match its reference image exactly.`;
//     }

//     return `- ${name}${who ? ` (${who})` : ""}: a HUMAN person (human face and human ears, never an animal, no animal ears, snout, fur or tail).${look ? ` ${look}.` : ""}${accessories} Match the face and look of its reference image exactly.`;
// };

// export const compactStyle = (imageStyle) =>
//     `${getStyleBible(imageStyle)
//         .split("\n")
//         .map((line) => line.trim())
//         .filter(Boolean)
//         .join(" ")} Exactly the same art style and medium as every other image in this book.`;

// // Builds the final prompt sent to the image model. The SCENE (written by
// // Gemini) comes first because that is what the image model follows most; the
// // character looks, style and text rules are added by code so they are the same
// // in every image.
// // An object character (e.g. "Pencil") is often ALSO written into a person's
// // accessories / signature details ("pencil tucked behind his ear"). The image
// // model then draws a second, tiny, different pencil and the real one gets lost.
// // So when the object is in the picture, strip that mention from the people.
// const withoutObjectMentions = (character = {}, objectNames = []) => {
//     if (!objectNames.length) return character;
//     const mentions = (text) =>
//         objectNames.some((n) => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(String(text || "")));
//     const next = { ...character };
//     if (character.clothing && mentions(character.clothing.accessories)) {
//         next.clothing = { ...character.clothing, accessories: "" };
//     }
//     if (Array.isArray(character.signatureDetails)) {
//         next.signatureDetails = character.signatureDetails.filter((d) => !mentions(d));
//     }
//     return next;
// };

// // Age words in the scene ("both children") fight with the reference images
// // (an adult photo drawn as a child, or the other way round), so they are
// // replaced by neutral wording before the prompt is sent.
// const neutralizeAgeWords = (text = "") =>
//     String(text)
//         .replace(
//             /\b(?:(?:both|the|two|three|four|little|young|small)\s+)*(?:children|kids)\b/gi,
//             (match, offset, whole) =>
//                 offset === 0 || /[.!?]\s$/.test(whole.slice(Math.max(0, offset - 2), offset))
//                     ? "The characters"
//                     : "the characters",
//         );

// // Headwear and glasses are what the image model forgets most (a crown missing
// // on one page of three), so they get their own "must show" line.
// const HEAD_ITEM = /\b(crown|circlet|tiara|headband|horns?|hat|helmet|glasses|hood|headpiece|bow)\b/i;

// const mustShowLine = (people = []) => {
//     const parts = [];
//     for (const character of people) {
//         const items = [
//             ...(Array.isArray(character.signatureDetails) ? character.signatureDetails : []),
//             character.clothing?.accessories,
//         ]
//             .filter((item) => !isBlankField(item))
//             .flatMap((item) => stripLiteralText(String(item)).split(/,|\band\b|;/i))
//             .map((item) => item.trim())
//             .filter((item) => HEAD_ITEM.test(item));
//         // The first (signature) item is enough: a second near-copy only adds noise.
//         const unique = [...new Set(items.map((item) => item.replace(/[.]+$/, "")))].slice(0, 1);
//         if (unique.length) parts.push(`${character.name || "The character"}: ${unique.join("; ")}`);
//     }
//     return parts.length
//         ? `MUST SHOW (draw it clearly on the head in this picture, and keep the whole head inside the frame, never cropped by the edge): ${parts.join(" | ")}.`
//         : "";
// };

// const loggedRosters = new Set();

// export const composeImagePrompt = ({
//     scene,
//     action,
//     mood,
//     shot,
//     sceneCharacters = [],
//     imageStyle,
//     isCover = false,
//     hasRoster = true,
// }) => {
//     const objectNames = sceneCharacters
//         .filter((c) => inferCharacterKind(c).kind === "object")
//         .map((c) => String(c.name || "").trim())
//         .filter(Boolean);
//     const people = sceneCharacters.filter((c) => inferCharacterKind(c).kind !== "object");
//     const roster = sceneCharacters
//         .map((c) =>
//             inferCharacterKind(c).kind === "object" ? c : withoutObjectMentions(c, objectNames),
//         )
//         .map(characterLine)
//         .join("\n");
//     // One-time log per distinct look, so a missing crown / wrong hair can be
//     // traced to the Character Bible text instead of guessed.
//     if (roster && !loggedRosters.has(roster)) {
//         loggedRosters.add(roster);
//         console.log(`Character looks sent to the image model:\n${roster}`);
//     }
//     // Characters the code added (named in the page text but missing from the
//     // model's scene) still have to be shown, so the scene text must say so.
//     const unmentioned = sceneCharacters
//         .filter((c) => !isNamedIn(scene, c) && !isNamedIn(action, c))
//         .map((c) => String(c.name || "").trim())
//         .filter(Boolean);
//     const alsoInPicture = unmentioned.length
//         ? `ALSO IN THE PICTURE: ${unmentioned.join(", ")} ${unmentioned.length > 1 ? "are" : "is"} here too, in the foreground or middle ground next to the others, taking part in the same action and clearly visible.`
//         : "";
//     const holder = people[0]?.name;
//     const objectPlacement = objectNames.length
//         ? `OBJECT PLACEMENT: ${objectNames.join(" and ")} must be clearly visible and large: ${holder ? `held out in ${holder}'s hands (or a character's hands) ` : "held in a character's hands "}or lying on the ground / a table right in front of the characters, in the foreground, in its exact reference design. It is the ONLY ${objectNames.join("/")} in the picture: do not draw a second one, and do not draw it as a tiny detail on a character.`
//         : "";

//     return [
//         `SCENE: ${neutralizeAgeWords(scene).trim()}`,
//         String(action || "").trim()
//             ? `KEY ACTION (this must be clearly visible in the picture, and it decides what the characters are doing, not the pose of the reference images): ${neutralizeAgeWords(action).trim()}`
//             : "",
//         alsoInPicture,
//         shot ? `CAMERA: ${shot}.` : "",
//         "FRAMING: the PLACE is the main subject, but every character must be easy to recognize. Painted from about eight metres back with a wide-angle view. Every character is a full-body figure about one third of the picture height (never more than 40%, never smaller than 25%), with the face clearly visible and facing the viewer or turned three-quarters, never seen only from behind, never hidden behind an object or another character, never cropped by the edge. Characters stand in the foreground or middle ground. About 60% of the picture shows the place itself (sky, trees, buildings, hills), and the main feature of the place is much taller than a character. This also applies when only one or two characters are in the picture. No close-ups and no portraits. The foreground, middle ground and far distance are all richly detailed.",
//         "LIGHT AND COLOR: bright, clear, evenly lit and cheerful, with rich, varied colors. No sepia, orange or brown overall tint, no muddy dark shadows, no heavy vignette. Interiors are bright and evenly lit with fresh, clean colors (cream walls, sky blue, leaf green) and only small warm lamp glows. Night scenes use deep blue with a few warm glowing lights and are still easy to read. Only the magical details glow.",
//         mood ? `MOOD: ${mood}.` : "",
//         sceneCharacters.length
//             ? `CHARACTERS IN THIS IMAGE (draw exactly these ${sceneCharacters.length}, each once, each clearly visible, with exactly this look every time):\n${roster}`
//             : hasRoster
//                 ? "No recurring character is in this image. Do not add any."
//                 : "",
//         objectPlacement,
//         mustShowLine(people),
//         `STYLE: ${compactStyle(imageStyle)}`,
//         isCover
//             ? "COVER COMPOSITION: front cover of a children's book. Keep the upper third calm and uncluttered (sky, soft background) because the title is added later."
//             : "",
//         "RULES: one single scene, no collage, no panels. The setting described in SCENE must be clearly visible. Every character keeps exactly the same face, hair, clothes, accessories and colors listed above on every page of the book, even if the SCENE wording suggests otherwise. Absolutely no text, letters, numbers, captions, speech bubbles, logos, watermarks or readable signs in the picture.",
//         "CLEAN RESULT: a tidy, uncluttered, carefully finished picture. Each character is drawn exactly once with natural proportions, a clear friendly face with two eyes, correct hands and feet, and no extra, merged or missing limbs. No duplicate characters, no stray blobs or smudges, no random extra objects.",
//     ]
//         .filter(Boolean)
//         .join("\n\n");
// };

// const buildRoster = (characters = []) => {
//     if (!characters.length) {
//         return "No characters were provided. If the story needs recurring characters, use at most one person, one pet and one object, and describe each one in EXACTLY the same words every time they appear.";
//     }

//     return characters
//         .map((character, index) => {
//             // Show what the character really is (a bison saved as "Child" is an
//             // animal), so the scene text uses animal actions, not human ones.
//             const { kind, species } = inferCharacterKind(character);
//             const typeLabel =
//                 kind === "animal"
//                     ? `ANIMAL${species ? ` (${species})` : ""}`
//                     : kind === "object"
//                         ? "OBJECT"
//                         : character.type || "Person";
//             const person = kind === "person";
//             const bits = [
//                 character.id || `character-${index + 1}`,
//                 character.name || "Unnamed",
//                 typeLabel,
//                 person && character.age && !/not specified/i.test(character.age) ? `age ${character.age}` : "",
//                 person && character.gender && !/not specified/i.test(character.gender) ? character.gender : "",
//             ].filter(Boolean);
//             return `- ${bits.join(" | ")}`;
//         })
//         .join("\n");
// };

// export const generateImagePrompt = async (story, storyData) => {
//     try {
//         const characters = storyData?.characters || [];
//         const hasRoster = characters.length > 0;
//         const pages = story?.pages || [];

//         const prompt = `
// You are a children's picture-book art director. Write the SCENE DESCRIPTION
// for the COVER and for EACH PAGE of the story below.

// A separate program adds the character looks, the art style and the text rules
// to every scene. So you must NOT describe what characters look like (no hair,
// clothes, colors or faces) and must NOT mention the art style. ${hasRoster ? "" : "(No characters were provided, so in this case DO describe any recurring character's look, in exactly the same words every time.)"}
// Your job is the scene: WHERE it happens and WHAT is happening.

// STORY TITLE: ${story?.title || "Untitled Story"}

// CHARACTERS (id | name | type | age | gender):
// ${buildRoster(characters)}

// ==================================================
// STORY PAGES (with a suggested camera for each page)
// ==================================================
// ${pages
//     .map(
//         (page, index) => `
// PAGE ${page.pageNumber}
// SUGGESTED CAMERA: ${shotFor(index)}
// STORY CONTENT:
// ${page.content}
// `
//     )
//     .join("\n")}

// ==================================================
// HOW TO WRITE EACH "prompt" (50 to 90 words)
// ==================================================
// 1. START WITH THE SETTING of that page: the exact place and its most
//    distinctive visible features from the story, for example "a bright
//    futuristic city with shimmering glass towers and a tiny moon-shaped park".
//    Never fall back to a generic park, forest or room unless the story says so.
// 2. THEN say what each character in the image is DOING, using an action verb and
//    a body pose tied to what happens on that page, plus their expression.
//    Characters interact with the setting and with each other (reaching, running,
//    pointing, climbing, looking up, carrying something). They must NOT stand in a
//    row facing the viewer like a group photo.
// 3. Use the suggested camera for the page. Every shot is WIDE: never write a
//    close-up or a medium close-up. The characters are full-body figures about
//    one third of the picture height, faces visible (front or three-quarter view,
//    never only from behind), and the PLACE is the star: make the landmark,
//    trees, buildings, water and sky big and detailed, and describe the
//    background in layers (foreground, middle, far distance) so the setting is
//    clearly seen. Never write "tiny", "small figures" or "towering" about the characters.
// 4. WHO IS IN THE PICTURE: every character whose NAME is written in that page's
//    text MUST be in "characters" and in the scene: never leave out a named
//    character, and never leave out the object when the text names it. Words like
//    "they", "everyone", "the friends" or "together" mean all the characters who
//    are in that moment, so list them all. Leave a character out only when the page
//    text does not mention them and they are clearly not part of that moment. Never
//    more than ${PAGE_MAX_CHARACTERS} characters in one image.
// 5. Mention the one or two important objects from the story text (for example a
//    glowing sword in a stone, a rope bridge, a lantern). If an OBJECT character
//    (see the character list) is in the image, say that a character HOLDS it or that
//    it lies in the foreground, and that it is large and clearly visible. Never
//    describe it as tucked behind an ear, in a pocket or otherwise hidden.
// 6. One single scene. No collage, no panels.
// 6b. Refer to characters ONLY by their names (or "they"). NEVER write "child", "children", "kids", "boy", "girl", "man", "woman", "adult" or any age, because the reference images already show how old each character looks and a different age word makes the picture disagree with them.
// 7. Use no text, signs, letters or numbers in the picture.
// 8. NEVER state a color, pattern or design for a character's own clothes or
//    accessories (write "his scarf", not "a colorful scarf"; "her daisy", not "a
//    pink daisy"). Their exact colors are added separately and must not be
//    overridden by the scene text.

// 9. LIGHTING AND COLOR: every scene is bright, clear and colorful. Never write
//    "dim", "dark", "shadowy", "murky", "sepia" or "warm glow" for a whole room
//    (the word "warm" turns the picture into one orange-brown wash). Interiors are
//    "bright and evenly lit" by daylight or a clear window, with fresh colors such
//    as cream, sky blue and leaf green and only a small lamp glow. Night scenes
//    use deep blue with a few warm lights and stay easy to read. Give each scene
//    a clear palette instead of one brown wash.
// 10. SCALE: never use wording that pulls the camera in ("kneeling close to",
//    "peering into", "face to face", "in front of the camera", "close-up").
//    Describe what the small figures do and the big place around them.
//     In EVERY prompt name one BIG feature of the place that THIS page's story
//    text actually mentions (or the setting it clearly implies) and say the
//    characters are small next to it. Examples of the idea, never to be copied:
//    "a huge arched window looks out on the night sky while the two children
//    kneel small on the wooden floor"; "a towering oak with a rope swing fills the
//    left side while the girl and the dog are small figures on the path". The
//    moon, a nebula or a comet may be the big feature ONLY on a page whose text
//    names it. Different pages must use different big features and different
//    wording.
// 11. SAME PLACE = SAME WORDS. If a place appears in more than one image (the
//    cover counts), describe it with the SAME fixed features in exactly the same
//    words every time: window shape, frame and position, curtain color and side,
//    the main furniture and where it stands, wall and floor colors (for example
//    "an arched window with a white four-pane frame on the back wall, blue
//    curtains on its left, a wooden bed under it, honey-colored wooden floor").
//    Decide these features the first time the place appears and copy them word
//    for word afterwards.
// 12. "scene" must describe EXACTLY what "prompt" shows: same characters, same
//    action, same place, and nothing the prompt does not say. A mismatch makes
//    the finished picture fail its check and be painted again.
// 13. "action": ONE sentence naming the single most important thing happening in
//    the picture, taken from the story page, with exact body positions and where
//    they are, for example "the little rocket carries the girl, the boy and the
//    parrot up into the sky, their feet off the ground, held in its warm glow".
//    The "prompt" must show this same action. Characters are always drawn DOING
//    it, never just standing or walking next to it.
// 14. EACH CHARACTER ONCE, IN ONE PLACE. Say exactly where each character is. If
//    characters ride inside something (a rocket, boat, wagon, house), either show
//    them inside it (only their faces at the window or opening) or on it, never
//    both, and never draw them again outside it. If the story says float, fly or
//    drift, there is NO ground in the picture: the characters and their vehicle
//    are surrounded by sky or space, feet off the ground. Never write words that
//    suggest a second copy of a character (a reflection, a shadow figure, a twin).

// COVER: one scene in the story's most important setting that shows the theme
// and mood of the whole story. Use only the 2 or 3 MAIN people or pets (never
// more than ${COVER_MAX_CHARACTERS}), in a lively, friendly pose that is not a
// stiff line-up. In addition you may list ONE object character if the cover scene
// needs it (for example the suitcase being packed). Everything the cover scene or
// action mentions must be in the cover's "characters" list or be an ordinary
// unnamed prop: never describe a listed character who is not in "characters".

// ==================================================
// IMAGE SAFETY RULES (very important)
// ==================================================

// The image model runs a strict safety check on the FINISHED
// picture. Write every scene so the result passes it while
// still telling the story:

// - Animals are animals: describe them with fur/feathers and
//   animal proportions. Never use "young male/female" for an
//   animal and never give animals human hair or clothes unless
//   the story says so.
// - Conflict and battles are allowed as the story needs
//   (${storyData?.age || "age not specified"}). Show them through heroic poses,
//   magic, light, wind, sparks and dramatic composition. NEVER
//   show blood, wounds, gore, corpses, torture or nudity.
// - Villains (for example a demon lord) are stylized in the
//   selected illustration style, menacing but not horrifying.
//   For readers under 8 make them silly or only mildly spooky.
// - Show affection with calm wording such as "standing side by
//   side" or "smiling at each other". Do NOT use the words hug,
//   embrace, cuddle, kiss or carry for close body contact.
// - Any human child must be fully dressed in ordinary everyday
//   clothes, shown in a normal full-body or medium shot. No
//   bath, bed, swimming or undressing scenes.
// - Use a calm composition for readers under 8. For older
//   readers, tension and dramatic scenes are fine.

// ==================================================
// OUTPUT
// ==================================================

// Return ONLY valid JSON, no markdown, no code block, no text before or after:

// {
//     "cover": {
//         "scene": "",
//         "action": "",
//         "mood": "",
//         "characters": [],
//         "prompt": ""
//     },
//     "images": [
//         {
//             "pageNumber": 1,
//             "scene": "",
//             "action": "",
//             "mood": "",
//             "characters": [],
//             "prompt": ""
//         }
//     ]
// }

// Rules:
// - "cover" is a single object (not an array).
// - "pageNumber" matches the story page number.
// - "scene" is ONE short sentence summarising the picture (setting + action).
// - "action" is the one-sentence key action from rule 13.
// - "mood" is two or three words.
// - "characters" lists ONLY the characters that appear in that image, using the
//   exact ids from the CHARACTERS list above.
// - "prompt" is the scene description written as described above.
// - Generate exactly ${pages.length} objects in "images", one per story page.
// `;

//         // Gemini occasionally returns bad JSON, a wrong number of prompts, or
//         // a transient API error. With 10 pages that happens often enough to
//         // matter, so try a few times before giving up on the whole book.
//         let lastError;

//         for (let attempt = 1; attempt <= IMAGE_PROMPT_ATTEMPTS; attempt += 1) {
//             try {
//                 const response = await generateContentResilient({
//                     label: "Image prompts",
//                     models: PROMPT_MODELS,
//                     attemptsPerModel: 2,
//                     contents: prompt
//                 });

//                 const rawText = response.text.trim();

//                 console.log("Gemini image prompt response:", rawText);

//                 const parsedResult = JSON.parse(cleanJson(rawText));

//                 if (!parsedResult?.cover?.prompt) {
//                     throw new Error(
//                         "Invalid image prompt response: cover prompt missing."
//                     );
//                 }

//                 if (!Array.isArray(parsedResult.images)) {
//                     throw new Error(
//                         "Invalid image prompt response: images array missing."
//                     );
//                 }

//                 const images = alignImagesToPages(
//                     parsedResult.images,
//                     story.pages
//                 );

//                 if (images.some((image) => !image)) {
//                     throw new Error(
//                         `Expected ${story.pages.length} image prompts but received ${parsedResult.images.length}.`
//                     );
//                 }

//                 // Turn the model's scene text into the final prompt: scene
//                 // first, then the exact character looks, style and rules.
//                 const resolveSceneCharacters = (entries = [], max = Infinity) => {
//                     const found = [];
//                     for (const entry of Array.isArray(entries) ? entries : []) {
//                         const match = findCharacter(characters, entry);
//                         if (match && !found.includes(match)) found.push(match);
//                     }
//                     return found.slice(0, max);
//                 };

//                 const coverRaw = parsedResult.cover;
//                 const coverAll = resolveSceneCharacters(coverRaw.characters);
//                 let coverCharacters = pickCoverCharacters(coverAll);
//                 if (!coverCharacters.length && characters.length) {
//                     coverCharacters = pickCoverCharacters(characters);
//                 }
//                 const coverCut = coverAll.filter((c) => !coverCharacters.includes(c));
//                 const coverScenePrompt = dropSentencesAbout(coverRaw.prompt, coverCut);

//                 const cover = {
//                     ...coverRaw,
//                     scene: dropSentencesAbout(String(coverRaw.scene || coverScenePrompt), coverCut).slice(0, 400),
//                     characters: coverCharacters.map((c) => c.id || c.name),
//                     prompt: composeImagePrompt({
//                         scene: coverScenePrompt,
//                         action: mentionsAny(coverRaw.action, coverCut) ? "" : coverRaw.action,
//                         mood: coverRaw.mood,
//                         sceneCharacters: coverCharacters,
//                         imageStyle: storyData?.imageStyle,
//                         isCover: true,
//                         hasRoster
//                     })
//                 };

//                 const finalImages = images.map((image, index) => {
//                     const pageText =
//                         pages.find((p) => Number(p.pageNumber) === Number(image.pageNumber))
//                             ?.content || "";
//                     const allScene = resolveSceneCharacters(image.characters);
//                     // The code (not only the model) decides who is drawn: every
//                     // character named in the page text is guaranteed.
//                     const sceneCharacters = pickPageCast({
//                         characters,
//                         pageText,
//                         modelList: allScene,
//                         max: PAGE_MAX_CHARACTERS,
//                     });
//                     const cut = allScene.filter((c) => !sceneCharacters.includes(c));
//                     const pageScenePrompt = dropSentencesAbout(image.prompt, cut);

//                     return {
//                         ...image,
//                         scene: dropSentencesAbout(String(image.scene || pageScenePrompt), cut).slice(0, 400),
//                         // Keep the model's own list if none matched, so
//                         // downstream lookups behave exactly as before.
//                         characters: sceneCharacters.length
//                             ? sceneCharacters.map((c) => c.id || c.name)
//                             : image.characters || [],
//                         prompt: composeImagePrompt({
//                             scene: pageScenePrompt,
//                             action: mentionsAny(image.action, cut) ? "" : image.action,
//                             mood: image.mood,
//                             shot: sceneCharacters.length ? shotFor(index) : "",
//                             sceneCharacters,
//                             imageStyle: storyData?.imageStyle,
//                             hasRoster
//                         })
//                     };
//                 });

//                 return { ...parsedResult, cover, images: finalImages };
//             } catch (attemptError) {
//                 lastError = attemptError;
//                 console.error(
//                     `generateImagePrompt attempt ${attempt}/${IMAGE_PROMPT_ATTEMPTS} failed:`,
//                     attemptError.message
//                 );

//                 // Every Gemini model already refused (quota / outage): trying
//                 // again right away only burns more quota. Retries are for bad
//                 // JSON or a wrong page count.
//                 if (attemptError.allModelsFailed) {
//                     break;
//                 }

//                 if (attempt < IMAGE_PROMPT_ATTEMPTS) {
//                     await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
//                 }
//             }
//         }

//         throw lastError;
//     } catch (error) {
//         console.error("generateImagePrompt error:", error);
//         throw error;
//     }
// };

import { generateContentResilient } from "./geminiCall.js";
import { inferCharacterKind, isBlankField, stripLiteralText } from "./promptSafety.js";
import { isNamedIn, pickPageCast } from "./sceneCast.js";

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

const escapeRe = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const norm = (value) => (typeof value === "string" ? value.trim() : "");

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
        parts.push(`${label}: ${stripLiteralText(value)}`);
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

const pickCoverCharacters = (list = []) => {
    const living = list
        .filter((c) => inferCharacterKind(c).kind !== "object")
        .slice(0, COVER_MAX_CHARACTERS);
    const prop = list.find((c) => inferCharacterKind(c).kind === "object");
    return list.filter((c) => living.includes(c) || c === prop);
};

// A book has at most 3 people + 1 pet + 1 object = 5 characters. Every character the
// page text names must be drawn, so the default is 5 (it used to be 4, which silently
// dropped one person on any page that named everybody). The generator merges the pet
// and the object into one reference sheet when more than 4 files would be sent.
const PAGE_MAX_CHARACTERS = Math.max(1, Number(process.env.PAGE_MAX_CHARACTERS) || 5);

// A different camera suggestion per page, so the pages stop looking like the
// same group photo again and again.
const SHOT_ROTATION = [
    "wide establishing shot: the whole place fills most of the picture and the characters, seen from the front or three-quarter view with their faces visible, are in the middle of an action",
    "wide shot from a slightly low angle, full-body characters in mid-action with faces visible, the tall background (trees, towers, sky) rising above them",
    "wide three-quarter view, characters walking or moving along a path and turning toward the viewer, the surroundings clearly visible around them",
    "wide shot where the characters look toward the main landmark but turn their faces three-quarters to the viewer, the landmark large behind them",
    "wide eye-level shot, full-body characters with faces visible, the setting dominant and richly detailed",
    "high angle looking down on the characters (faces still visible) with the whole place around them clearly visible",
    "wide diagonal composition with the key object clearly in the foreground and a layered background behind the characters",
    "wide shot with the characters at the side of the picture facing the viewer three-quarters, a detailed, far-reaching distance behind them",
];

const shotFor = (index) => SHOT_ROTATION[index % SHOT_ROTATION.length];

const mentionsAny = (text = "", characters = []) => {
    const names = characters
        .map((c) => String(c?.name || "").trim())
        .filter(Boolean)
        .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    return names.length
        ? new RegExp(`\\b(${names.join("|")})\\b`, "i").test(String(text))
        : false;
};

const dropSentencesAbout = (text = "", characters = []) => {
    const names = characters
        .map((c) => String(c?.name || "").trim())
        .filter(Boolean)
        .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

    if (!names.length) return String(text);

    const mention = new RegExp(`\\b(${names.join("|")})\\b`, "i");
    const kept = String(text)
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => !mention.test(sentence));

    // never return an empty scene
    return kept.length ? kept.join(" ") : String(text);
};

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

// ---------------------------------------------------------------
// Subject + verb + object, and key objects that persist
// ---------------------------------------------------------------

// Every cover / page entry must name WHO does WHAT to WHICH thing. If one is
// missing the attempt is retried (the kite disappeared because nothing forced
// the planner to keep it in the picture).
const missingSVO = (entry) =>
    !norm(entry?.subject) || !norm(entry?.verb) || !norm(entry?.object);

// Story objects that drive the plot (kite, coin, map...). One fixed description
// each, repeated word for word by the code on every page they appear in.
const cleanKeyObjects = (list = []) =>
    (Array.isArray(list) ? list : [])
        .map((item) => ({
            name: norm(item?.name),
            description: norm(item?.description),
        }))
        .filter((item) => item.name);

const sameName = (a = "", b = "") => {
    const x = String(a).trim().toLowerCase();
    const y = String(b).trim().toLowerCase();
    return Boolean(x) && Boolean(y) && (x === y || x.includes(y) || y.includes(x));
};

// What must be visible on this page: the model's mustShow + its "object" + any
// key object whose name appears in the page text (the code guarantees this even
// when the model forgets it). Object-type characters are skipped here because
// OBJECT PLACEMENT already handles them.
const resolveMustShow = ({ entry, pageText = "", keyObjects = [], sceneCharacters = [] }) => {
    const characterObjectNames = sceneCharacters
        .filter((c) => inferCharacterKind(c).kind === "object")
        .map((c) => String(c.name || "").trim())
        .filter(Boolean);

    const names = [
        norm(entry?.object),
        ...(Array.isArray(entry?.mustShow) ? entry.mustShow.map(norm) : []),
        ...keyObjects
            .filter((k) => new RegExp(`\\b${escapeRe(k.name)}\\b`, "i").test(String(pageText)))
            .map((k) => k.name),
    ].filter(Boolean);

    const unique = [];
    for (const name of names) {
        if (characterObjectNames.some((n) => sameName(n, name))) continue;
        if (!unique.some((u) => sameName(u, name))) unique.push(name);
    }

    return unique.map((name) => {
        const known = keyObjects.find((k) => sameName(k.name, name));
        return known?.description ? `${known.name}: ${known.description}` : name;
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

Object.assign(STYLE_BIBLE, {
    "3d-storybook": `
High-quality 3D animated children's storybook illustration.
Soft rounded character design, expressive faces, smooth 3D materials.
Soft cinematic lighting, warm family-friendly animated movie look.
NOT photorealistic.
`,
    watercolour: `
Traditional hand-painted children's watercolour storybook illustration.
Soft watercolour washes, visible paper texture, gentle brush strokes and soft edges.
Warm, dreamy storybook atmosphere.
NOT photorealistic. NOT 3D rendered. NOT glossy digital art. NOT anime.
`,
    "classic-illustrated": `
Timeless classic illustrated storybook look.
Fine ink outlines with rich painted colour, traditional book-illustration detail.
Warm, slightly muted classic palette.
NOT photorealistic. NOT 3D rendered.
`,
    "picture-book-kids": `
Simple, bright children's picture-book illustration.
Friendly rounded shapes, bold clean outlines, flat cheerful colours, uncluttered detail.
NOT photorealistic. NOT 3D rendered.
`,
    "black-white-sketch": `
Black and white pencil and ink sketch illustration.
Hand-drawn linework with soft graphite shading and cross-hatching, no colour at all.
NOT photorealistic. NOT colour.
`,
    "minimal-modern": `
Clean minimal modern children's illustration.
Simple geometric shapes, flat colours, a limited harmonious palette, lots of calm space.
NOT photorealistic. NOT 3D rendered. NOT busy.
`,
    "vintage-retro": `
Vintage retro children's book illustration.
Old-print look with slightly faded warm colours, gentle grain and mid-century storybook charm.
NOT photorealistic. NOT 3D rendered. NOT glossy digital art.
`,
    "fairy-tale": `
Enchanted fairy-tale storybook illustration.
Richly painted magical atmosphere, glowing soft light, storybook castles, forests and sparkles.
Warm, detailed hand-painted look.
NOT photorealistic. NOT 3D rendered. NOT anime.
`,
    "night-bedtime": `
Calm bedtime storybook illustration.
Moonlit night colours, deep blues and purples with warm glowing lights, soft sleepy edges.
Gentle, peaceful, hand-painted look.
NOT photorealistic. NOT harsh or scary.
`,
    adventure: `
Bold dynamic adventure storybook illustration.
Vivid saturated colours, bright clear lighting, sweeping landscapes, sense of movement.
Painted children's book look.
NOT photorealistic. NOT dark or scary.
`,
    "line-art-colouring": `
Clean black line-art colouring-book illustration.
Clear, even outlines on a plain white background, no shading, no filled colour.
NOT photorealistic. NOT colour.
`,
    "seasonal-autumn": `
Warm autumn storybook illustration.
Falling leaves, golden orange and red harvest colours, cosy soft light.
Hand-painted children's book look.
NOT photorealistic. NOT 3D rendered.
`,
});

const getStyleBible = (imageStyle = "") => {
    // "Picture Book (Kids)" -> "picture-book-kids", "Night / Bedtime" -> "night-bedtime"
    const normalizedStyle = String(imageStyle)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return (
        STYLE_BIBLE[normalizedStyle] ||
        `
${String(imageStyle || "").trim() ? `Illustration style: ${String(imageStyle).trim()}.` : ""}
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
        return `- ${name} (object): drawn as an object, never as a person. KEY PROP: draw it LARGE and unmistakable, at least as big as a character's head, drawn exactly ONCE in its exact reference design, never tiny, never hidden, never behind anything.${look ? ` ${look}.` : ""}${accessories} Any sticker, label, badge or print on it is a plain blank shape with a simple symbol: NO letters or words on it. Match its reference image exactly.`;
    }

    if (kind === "animal") {
        const label = species ? `a ${species}` : "an animal";
        return `- ${name} (${label}): a real friendly cartoon ${species || "animal"} - an ANIMAL, never a human child or person. Animal body and animal face, NO human features, NO clothes (only the accessories listed below).${look ? ` ${look}.` : ""}${accessories} Same body shape and proportions in every pose, also when flying or jumping. Match its reference image exactly.`;
    }

    return `- ${name}${who ? ` (${who})` : ""}: a HUMAN person (human face and human ears, never an animal, no animal ears, snout, fur or tail).${look ? ` ${look}.` : ""}${accessories} Match the face and look of its reference image exactly.`;
};

export const compactStyle = (imageStyle) =>
    `${getStyleBible(imageStyle)
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" ")} Exactly the same art style and medium as every other image in this book.`;

// Builds the final prompt sent to the image model. The SCENE (written by
// Gemini) comes first because that is what the image model follows most; the
// character looks, style and text rules are added by code so they are the same
// in every image.
// An object character (e.g. "Pencil") is often ALSO written into a person's
// accessories / signature details ("pencil tucked behind his ear"). The image
// model then draws a second, tiny, different pencil and the real one gets lost.
// So when the object is in the picture, strip that mention from the people.
const withoutObjectMentions = (character = {}, objectNames = []) => {
    if (!objectNames.length) return character;
    const mentions = (text) =>
        objectNames.some((n) => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(String(text || "")));
    const next = { ...character };
    if (character.clothing && mentions(character.clothing.accessories)) {
        next.clothing = { ...character.clothing, accessories: "" };
    }
    if (Array.isArray(character.signatureDetails)) {
        next.signatureDetails = character.signatureDetails.filter((d) => !mentions(d));
    }
    return next;
};

// Age words in the scene ("both children") fight with the reference images
// (an adult photo drawn as a child, or the other way round), so they are
// replaced by neutral wording before the prompt is sent.
const neutralizeAgeWords = (text = "") =>
    String(text)
        .replace(
            /\b(?:(?:both|the|two|three|four|little|young|small)\s+)*(?:children|kids)\b/gi,
            (match, offset, whole) =>
                offset === 0 || /[.!?]\s$/.test(whole.slice(Math.max(0, offset - 2), offset))
                    ? "The characters"
                    : "the characters",
        );

// Headwear and glasses are what the image model forgets most (a crown missing
// on one page of three), so they get their own "must show" line.
const HEAD_ITEM = /\b(crown|circlet|tiara|headband|horns?|hat|helmet|glasses|hood|headpiece|bow)\b/i;

const mustShowLine = (people = []) => {
    const parts = [];
    for (const character of people) {
        const items = [
            ...(Array.isArray(character.signatureDetails) ? character.signatureDetails : []),
            character.clothing?.accessories,
        ]
            .filter((item) => !isBlankField(item))
            .flatMap((item) => stripLiteralText(String(item)).split(/,|\band\b|;/i))
            .map((item) => item.trim())
            .filter((item) => HEAD_ITEM.test(item));
        // The first (signature) item is enough: a second near-copy only adds noise.
        const unique = [...new Set(items.map((item) => item.replace(/[.]+$/, "")))].slice(0, 1);
        if (unique.length) parts.push(`${character.name || "The character"}: ${unique.join("; ")}`);
    }
    return parts.length
        ? `MUST SHOW (draw it clearly on the head in this picture, and keep the whole head inside the frame, never cropped by the edge): ${parts.join(" | ")}.`
        : "";
};

const loggedRosters = new Set();

export const composeImagePrompt = ({
    scene,
    action,
    mood,
    shot,
    sceneCharacters = [],
    imageStyle,
    isCover = false,
    isLast = false,
    hasRoster = true,
    subject = "",
    verb = "",
    object = "",
    keyObjectLines = [],
}) => {
    const objectNames = sceneCharacters
        .filter((c) => inferCharacterKind(c).kind === "object")
        .map((c) => String(c.name || "").trim())
        .filter(Boolean);
    const people = sceneCharacters.filter((c) => inferCharacterKind(c).kind !== "object");
    const roster = sceneCharacters
        .map((c) =>
            inferCharacterKind(c).kind === "object" ? c : withoutObjectMentions(c, objectNames),
        )
        .map(characterLine)
        .join("\n");
    // One-time log per distinct look, so a missing crown / wrong hair can be
    // traced to the Character Bible text instead of guessed.
    if (roster && !loggedRosters.has(roster)) {
        loggedRosters.add(roster);
        console.log(`Character looks sent to the image model:\n${roster}`);
    }
    // Characters the code added (named in the page text but missing from the
    // model's scene) still have to be shown, so the scene text must say so.
    const unmentioned = sceneCharacters
        .filter((c) => !isNamedIn(scene, c) && !isNamedIn(action, c))
        .map((c) => String(c.name || "").trim())
        .filter(Boolean);
    const alsoInPicture = unmentioned.length
        ? `ALSO IN THE PICTURE: ${unmentioned.join(", ")} ${unmentioned.length > 1 ? "are" : "is"} here too, in the foreground or middle ground next to the others, taking part in the same action and clearly visible.`
        : "";
    const holder = people[0]?.name;
    const objectPlacement = objectNames.length
        ? `OBJECT PLACEMENT: ${objectNames.join(" and ")} must be clearly visible and large: ${holder ? `held out in ${holder}'s hands (or a character's hands) ` : "held in a character's hands "}or lying on the ground / a table right in front of the characters, in the foreground, in its exact reference design. It is the ONLY ${objectNames.join("/")} in the picture: do not draw a second one, and do not draw it as a tiny detail on a character.`
        : "";

    // WHO does WHAT to WHICH thing: all three must be drawn, not implied.
    const svoLine =
        norm(subject) && norm(verb) && norm(object)
            ? `SUBJECT - ACTION - OBJECT (all three must be clearly visible in the picture, not just implied): ${norm(subject)} ${norm(verb)} ${norm(object)}.`
            : "";

    // Story objects that must not vanish between pages (the kite on page 3).
    const keyObjectBlock = keyObjectLines.length
        ? `KEY STORY OBJECTS (each must be fully visible, large enough to recognise at a glance, never cropped by the edge, never hidden behind a character, never reduced to a tiny background detail, drawn exactly ONCE and with exactly the same design on every page; if another character has it, show it in that character's hands):\n${keyObjectLines.map((line) => `- ${line}`).join("\n")}`
        : "";

    // Pull the child into the picture.
    const readerInvitation = isCover
        ? "READER INVITATION: the cover welcomes the child into the adventure. One character looks out of the picture toward the viewer with a bright, curious smile, and the main object or path leads the eye into the scene."
        : "READER INVITATION: make the child reading this feel they are standing right there in the scene. Draw it vividly and truthfully, with real-feeling details (wind in clothes and leaves, dust or steam, sunlight and soft shadows, textures of wood, cloth and stone). One character glances or gestures out toward the viewer, or the key object is held out toward the viewer in the foreground, as if inviting the reader to join in.";

    // The last page shows how the story ends.
    const endingLine = isLast
        ? "ENDING PAGE: this is the last page, so the picture shows how the story ENDS. The problem is solved, every character looks happy and safe, and the key object is shown in its final state (returned, safe, shared or put away) exactly as the last page of the story says. A warm, satisfying, hopeful conclusion the child can see at a glance."
        : "";

    return [
        `SCENE: ${neutralizeAgeWords(scene).trim()}`,
        String(action || "").trim()
            ? `KEY ACTION (this must be clearly visible in the picture, and it decides what the characters are doing, not the pose of the reference images): ${neutralizeAgeWords(action).trim()}`
            : "",
        svoLine,
        alsoInPicture,
        shot ? `CAMERA: ${shot}.` : "",
        "FRAMING: the PLACE is the main subject, but every character must be easy to recognize. Painted from about eight metres back with a wide-angle view. Every character is a full-body figure about one third of the picture height (never more than 40%, never smaller than 25%), with the face clearly visible and facing the viewer or turned three-quarters, never seen only from behind, never hidden behind an object or another character, never cropped by the edge. Characters stand in the foreground or middle ground. About 60% of the picture shows the place itself (sky, trees, buildings, hills), and the main feature of the place is much taller than a character. This also applies when only one or two characters are in the picture. No close-ups and no portraits. The foreground, middle ground and far distance are all richly detailed.",
        "LIGHT AND COLOR: bright, clear, evenly lit and cheerful, with rich, varied colors. No sepia, orange or brown overall tint, no muddy dark shadows, no heavy vignette. Interiors are bright and evenly lit with fresh, clean colors (cream walls, sky blue, leaf green) and only small warm lamp glows. Night scenes use deep blue with a few warm glowing lights and are still easy to read. Only the magical details glow.",
        mood ? `MOOD: ${mood}.` : "",
        sceneCharacters.length
            ? `CHARACTERS IN THIS IMAGE (draw exactly these ${sceneCharacters.length}, each once, each clearly visible, with exactly this look every time):\n${roster}`
            : hasRoster
                ? "No recurring character is in this image. Do not add any."
                : "",
        objectPlacement,
        keyObjectBlock,
        mustShowLine(people),
        readerInvitation,
        endingLine,
        `STYLE: ${compactStyle(imageStyle)}`,
        isCover
            ? "COVER COMPOSITION: front cover of a children's book. Keep the upper third calm and uncluttered (sky, soft background) because the title is added later."
            : "",
        "RULES: one single scene, no collage, no panels. The setting described in SCENE must be clearly visible. Every character keeps exactly the same face, hair, clothes, accessories and colors listed above on every page of the book, even if the SCENE wording suggests otherwise. Absolutely no text, letters, numbers, captions, speech bubbles, logos, watermarks or readable signs in the picture.",
        "CLEAN RESULT: a tidy, uncluttered, carefully finished picture. Each character is drawn exactly once with natural proportions, a clear friendly face with two eyes, correct hands and feet, and no extra, merged or missing limbs. No duplicate characters, no stray blobs or smudges, no random extra objects.",
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
   close-up or a medium close-up. The characters are full-body figures about
   one third of the picture height, faces visible (front or three-quarter view,
   never only from behind), and the PLACE is the star: make the landmark,
   trees, buildings, water and sky big and detailed, and describe the
   background in layers (foreground, middle, far distance) so the setting is
   clearly seen. Never write "tiny", "small figures" or "towering" about the characters.
4. WHO IS IN THE PICTURE: every character whose NAME is written in that page's
   text MUST be in "characters" and in the scene: never leave out a named
   character, and never leave out the object when the text names it. Words like
   "they", "everyone", "the friends" or "together" mean all the characters who
   are in that moment, so list them all. Leave a character out only when the page
   text does not mention them and they are clearly not part of that moment. Never
   more than ${PAGE_MAX_CHARACTERS} characters in one image.
5. Mention the one or two important objects from the story text (for example a
   glowing sword in a stone, a rope bridge, a lantern). If an OBJECT character
   (see the character list) is in the image, say that a character HOLDS it or that
   it lies in the foreground, and that it is large and clearly visible. Never
   describe it as tucked behind an ear, in a pocket or otherwise hidden.
6. One single scene. No collage, no panels.
6b. Refer to characters ONLY by their names (or "they"). NEVER write "child", "children", "kids", "boy", "girl", "man", "woman", "adult" or any age, because the reference images already show how old each character looks and a different age word makes the picture disagree with them.
7. Use no text, signs, letters or numbers in the picture.
8. NEVER state a color, pattern or design for a character's own clothes or
   accessories (write "his scarf", not "a colorful scarf"; "her daisy", not "a
   pink daisy"). Their exact colors are added separately and must not be
   overridden by the scene text.

9. LIGHTING AND COLOR: every scene is bright, clear and colorful. Never write
   "dim", "dark", "shadowy", "murky", "sepia" or "warm glow" for a whole room
   (the word "warm" turns the picture into one orange-brown wash). Interiors are
   "bright and evenly lit" by daylight or a clear window, with fresh colors such
   as cream, sky blue and leaf green and only a small lamp glow. Night scenes
   use deep blue with a few warm lights and stay easy to read. Give each scene
   a clear palette instead of one brown wash.
10. SCALE: never use wording that pulls the camera in ("kneeling close to",
   "peering into", "face to face", "in front of the camera", "close-up").
   Describe what the small figures do and the big place around them.
    In EVERY prompt name one BIG feature of the place that THIS page's story
   text actually mentions (or the setting it clearly implies) and say the
   characters are small next to it. Examples of the idea, never to be copied:
   "a huge arched window looks out on the night sky while the two children
   kneel small on the wooden floor"; "a towering oak with a rope swing fills the
   left side while the girl and the dog are small figures on the path". The
   moon, a nebula or a comet may be the big feature ONLY on a page whose text
   names it. Different pages must use different big features and different
   wording.
11. SAME PLACE = SAME WORDS. If a place appears in more than one image (the
   cover counts), describe it with the SAME fixed features in exactly the same
   words every time: window shape, frame and position, curtain color and side,
   the main furniture and where it stands, wall and floor colors (for example
   "an arched window with a white four-pane frame on the back wall, blue
   curtains on its left, a wooden bed under it, honey-colored wooden floor").
   Decide these features the first time the place appears and copy them word
   for word afterwards.
12. "scene" must describe EXACTLY what "prompt" shows: same characters, same
   action, same place, and nothing the prompt does not say. A mismatch makes
   the finished picture fail its check and be painted again.
13. "action": ONE sentence naming the single most important thing happening in
   the picture, taken from the story page, with exact body positions and where
   they are, for example "the little rocket carries the girl, the boy and the
   parrot up into the sky, their feet off the ground, held in its warm glow".
   The "prompt" must show this same action. Characters are always drawn DOING
   it, never just standing or walking next to it.
14. EACH CHARACTER ONCE, IN ONE PLACE. Say exactly where each character is. If
   characters ride inside something (a rocket, boat, wagon, house), either show
   them inside it (only their faces at the window or opening) or on it, never
   both, and never draw them again outside it. If the story says float, fly or
   drift, there is NO ground in the picture: the characters and their vehicle
   are surrounded by sky or space, feet off the ground. Never write words that
   suggest a second copy of a character (a reflection, a shadow figure, a twin).
15. SUBJECT + VERB + OBJECT ON EVERY PAGE. For the cover and for EVERY page give
   "subject" (the character doing the main action, by name), "verb" (one concrete
   visible action word or short phrase: "chases", "holds up", "points at",
   "follows") and "object" (the main thing the action is done to or with: "the
   blue kite"). The FIRST sentence of "prompt" must show the subject doing that
   verb to that object. All three must be drawn, not just implied. Never leave
   one empty.
16. KEY OBJECTS NEVER DISAPPEAR. First list in "keyObjects" every story object
   that drives the plot (a kite, a coin, a map, a lantern) EXCEPT the ones
   already in the CHARACTERS list. Give each ONE fixed description (shape, size,
   color, material, no text on it) and then use that same description every time.
   A key object stays in the picture on EVERY page until the story text says it
   is gone, returned or destroyed, even if the page text mentions it only in
   passing (for example "he found out why he took the kite" still means the kite
   is in the picture). If another character is holding it, show it in their
   hands. List every object that must be visible on that page in "mustShow".
17. DRAW THE READER IN. The child reading the book should feel they are in the
   scene. Use vivid, real, sensory details (wind in clothes and leaves, dust,
   steam, sunlight, textures of wood, cloth and stone, busy background life) and
   let one character glance or gesture out toward the viewer, or hold the key
   object out toward the viewer in the foreground, as if inviting the reader to
   join in. This must never break the wide framing or hide a face.
18. THE LAST PAGE SHOWS THE ENDING. On the final page the "prompt", "scene" and
   "action" show how the story ends: the problem solved, everyone safe and happy,
   and the key object in its final state exactly as the last page's text says.
   The cover should hint at the adventure without giving the ending away.

COVER: one scene in the story's most important setting that shows the theme
and mood of the whole story. Use only the 2 or 3 MAIN people or pets (never
more than ${COVER_MAX_CHARACTERS}), in a lively, friendly pose that is not a
stiff line-up. In addition you may list ONE object character if the cover scene
needs it (for example the suitcase being packed). Everything the cover scene or
action mentions must be in the cover's "characters" list or be an ordinary
unnamed prop: never describe a listed character who is not in "characters".

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
    "keyObjects": [
        {
            "name": "",
            "description": ""
        }
    ],
    "cover": {
        "scene": "",
        "action": "",
        "subject": "",
        "verb": "",
        "object": "",
        "mustShow": [],
        "mood": "",
        "characters": [],
        "prompt": ""
    },
    "images": [
        {
            "pageNumber": 1,
            "scene": "",
            "action": "",
            "subject": "",
            "verb": "",
            "object": "",
            "mustShow": [],
            "mood": "",
            "characters": [],
            "prompt": ""
        }
    ]
}

Rules:
- "keyObjects" lists the plot-driving objects from rule 16 (may be empty only if the story has none).
- "cover" is a single object (not an array).
- "pageNumber" matches the story page number.
- "scene" is ONE short sentence summarising the picture (setting + action).
- "action" is the one-sentence key action from rule 13.
- "subject", "verb" and "object" are required on the cover and on every page (rule 15).
- "mustShow" lists every object that must be visible in that image (rule 16), using the names from "keyObjects".
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

                // const rawText = response.text.trim(); gotted something error 
                // Gemini can return no text at all (safety block, empty reply,
                // stopped early). Say why, and let the normal retry run.
                const candidate = response?.candidates?.[0];
                const rawText =
                    typeof response?.text === "string" ? response.text.trim() : "";

                if (!rawText) {
                    throw new Error(
                        `Gemini returned no text (blockReason: ${response?.promptFeedback?.blockReason || "none"
                        }, finishReason: ${candidate?.finishReason || "unknown"}).`
                    );
                }

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

                // Every picture needs subject + verb + object. A page without
                // them is how the kite got lost, so the whole attempt is retried.
                const incomplete = [];
                if (missingSVO(parsedResult.cover)) incomplete.push("cover");
                images.forEach((image) => {
                    if (missingSVO(image)) incomplete.push(`page ${image.pageNumber}`);
                });
                if (incomplete.length) {
                    throw new Error(
                        `Missing subject/verb/object for: ${incomplete.join(", ")}.`
                    );
                }

                const keyObjects = cleanKeyObjects(parsedResult.keyObjects);

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
                const coverAll = resolveSceneCharacters(coverRaw.characters);
                let coverCharacters = pickCoverCharacters(coverAll);
                if (!coverCharacters.length && characters.length) {
                    coverCharacters = pickCoverCharacters(characters);
                }
                const coverCut = coverAll.filter((c) => !coverCharacters.includes(c));
                const coverScenePrompt = dropSentencesAbout(coverRaw.prompt, coverCut);

                const coverMustShow = resolveMustShow({
                    entry: coverRaw,
                    pageText: `${coverRaw.scene || ""} ${coverRaw.action || ""}`,
                    keyObjects,
                    sceneCharacters: coverCharacters,
                });

                const cover = {
                    ...coverRaw,
                    scene: dropSentencesAbout(String(coverRaw.scene || coverScenePrompt), coverCut).slice(0, 400),
                    characters: coverCharacters.map((c) => c.id || c.name),
                    mustShow: coverMustShow,
                    prompt: composeImagePrompt({
                        scene: coverScenePrompt,
                        action: mentionsAny(coverRaw.action, coverCut) ? "" : coverRaw.action,
                        mood: coverRaw.mood,
                        sceneCharacters: coverCharacters,
                        imageStyle: storyData?.imageStyle,
                        isCover: true,
                        hasRoster,
                        subject: coverRaw.subject,
                        verb: coverRaw.verb,
                        object: coverRaw.object,
                        keyObjectLines: coverMustShow,
                    })
                };

                const finalImages = images.map((image, index) => {
                    const pageText =
                        pages.find((p) => Number(p.pageNumber) === Number(image.pageNumber))
                            ?.content || "";
                    const allScene = resolveSceneCharacters(image.characters);
                    // The code (not only the model) decides who is drawn: every
                    // character named in the page text is guaranteed.
                    const sceneCharacters = pickPageCast({
                        characters,
                        pageText,
                        modelList: allScene,
                        max: PAGE_MAX_CHARACTERS,
                    });
                    const cut = allScene.filter((c) => !sceneCharacters.includes(c));
                    const pageScenePrompt = dropSentencesAbout(image.prompt, cut);

                    // The code guarantees key objects named in the page text are
                    // listed, even if the model forgot them.
                    const pageMustShow = resolveMustShow({
                        entry: image,
                        pageText,
                        keyObjects,
                        sceneCharacters,
                    });

                    return {
                        ...image,
                        scene: dropSentencesAbout(String(image.scene || pageScenePrompt), cut).slice(0, 400),
                        // Keep the model's own list if none matched, so
                        // downstream lookups behave exactly as before.
                        characters: sceneCharacters.length
                            ? sceneCharacters.map((c) => c.id || c.name)
                            : image.characters || [],
                        mustShow: pageMustShow,
                        prompt: composeImagePrompt({
                            scene: pageScenePrompt,
                            action: mentionsAny(image.action, cut) ? "" : image.action,
                            mood: image.mood,
                            shot: sceneCharacters.length ? shotFor(index) : "",
                            sceneCharacters,
                            imageStyle: storyData?.imageStyle,
                            isLast: index === images.length - 1,
                            hasRoster,
                            subject: image.subject,
                            verb: image.verb,
                            object: image.object,
                            keyObjectLines: pageMustShow,
                        })
                    };
                });

                return { ...parsedResult, keyObjects, cover, images: finalImages };
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