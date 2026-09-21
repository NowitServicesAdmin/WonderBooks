import gemini from "../config/gemini.js";

const cleanJson = (text) => {
    return text
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
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

const buildCharacterBible = (characters = []) => {
    if (!characters.length) {
        return `
CHARACTER BIBLE:

No characters were explicitly provided by the user.

Determine the minimum number of recurring characters
required for the story.

You may create up to:
- One person
- One pet
- One object

Do NOT force all three types into the story.

Only create a character when the story genuinely
benefits from that character.

Once a character is established, its identity,
appearance, colors, personality and signature details
must remain fixed throughout the entire story.
`;
    }

    return characters
        .map(
            (character, index) => `
CHARACTER ${index + 1}

Character ID:
${character.id || `character-${index + 1}`}

Name:
${character.name || "Unnamed"}

Type:
${character.type || "Unknown"}

Identity:
Gender: ${character.gender || "Not specified"}
Age: ${character.age || "Not specified"}

Hobbies:
${character.hobbies || "Not specified"}

Favourite Food:
${character.favouriteFood || "Not specified"}

USER PHOTO AVAILABLE:
${character.hasPhoto ? "Yes" : "No"}

VISUAL IDENTITY RULE:
This character is a recurring character in the book.

Preserve the same:
- face
- facial structure
- age
- body proportions
- hairstyle
- hair color
- eye color
- skin/fur appearance
- clothing
- clothing colors
- accessories
- markings
- primary colors
- secondary colors
- recognizable physical details

Do not redesign this character between pages.

Do not rename this character.

Do not change this character into another person,
animal or object.

Do not randomly change clothing colors.

Do not randomly change hairstyle, fur pattern,
body proportions or recognizable features.

PERSONALITY:
Use the supplied hobbies and characteristics to
maintain a consistent personality and behavior.

REFERENCE IMAGE:
If a visual reference image is provided to the image
generation model, treat that image as the primary
visual identity reference for this character.
`
        )
        .join("\n");
};

export const generateImagePrompt = async (story, storyData) => {
    try {
        const characters = storyData?.characters || [];

        const styleBible = getStyleBible(
            storyData?.imageStyle
        );

        const characterBible = buildCharacterBible(
            characters
        );

        const prompt = `
You are a professional children's storybook
illustration director and image-prompt designer.

Your task is to create:

1. ONE detailed COVER image-generation prompt for
   the whole book.
2. ONE detailed image-generation prompt for EACH
   page of the story.

The generated prompts will be sent to an
image-generation model.

The image prompts must prioritize:

1. Character identity consistency.
2. Character visual consistency.
3. Illustration style consistency.
4. Clear page-specific storytelling.
5. Attractive children's storybook composition.

STORY TITLE:
${story?.title || "Untitled Story"}

SELECTED IMAGE STYLE:
${storyData?.imageStyle || "Classic Storybook"}

==================================================
STYLE BIBLE
==================================================

${styleBible}

IMPORTANT STYLE RULE:

The selected illustration style is:

${storyData?.imageStyle || "Classic Storybook"}

The selected style MUST remain consistent across
the cover AND every page.

Do not substitute another artistic medium.

Do not mix watercolor with 3D rendering.

Do not mix cartoon rendering with photorealism.

Do not change the artistic medium between the cover
and the pages, or from page to page.

Every image must visually belong to the same
storybook.

==================================================
CHARACTER BIBLE
==================================================

${characterBible}

==================================================
CHARACTER CONSISTENCY RULES
==================================================

The Character Bible is the canonical source of truth
for recurring characters.

For every image (cover and pages):

1. Preserve the exact character identity.
2. Preserve age.
3. Preserve facial structure.
4. Preserve hairstyle or fur pattern.
5. Preserve body proportions.
6. Preserve skin/fur appearance.
7. Preserve clothing.
8. Preserve clothing colors.
9. Preserve important accessories.
10. Preserve distinctive markings.
11. Preserve primary and secondary colors.
12. Preserve recognizable physical characteristics.
13. Preserve personality.
14. Never rename a character.
15. Never replace a character with a different character.
16. Never create a visually unrelated version of a character.
17. Never randomly change clothing colors.
18. Never randomly change hair or fur colors.
19. Never age the character between images.
20. Never change a pet into another breed or animal.
21. Never change an object into another object.

If a character has a reference image supplied to
the image model, the reference image is the strongest
visual identity source for that character.

The generated character should look like the same
character in every illustration, including the cover.

==================================================
COVER RULES
==================================================

The cover must:

- Feature the main recurring character(s) prominently.
- Visually represent the overall theme and mood of
  the story, not one specific page's moment.
- Be an inviting, attractive front-cover illustration
  suitable for a children's storybook.
- Leave clear, relatively uncluttered space in the
  upper third of the composition, since the book
  title will be overlaid on top of the image
  separately after generation.
- Follow the same illustration style as the rest of
  the book.
- NOT include any text, letters, or numbers rendered
  into the artwork itself (the title is added later
  as a separate overlay, not by the image model).

==================================================
PAGE SCENE RULES
==================================================

Each page must represent ONLY the specific moment
described by that page.

Do not combine multiple unrelated moments.

Do not create a collage.

Do not create multiple panels.

Do not create comic panels.

Do not show different versions of the same character
at different moments in the same image.

Create one unified cinematic storybook scene.

==================================================
VISUAL STORYTELLING
==================================================

For every page:

- Clearly identify which recurring characters appear.
- Describe what each character is doing.
- Describe each character's expression.
- Describe the environment.
- Describe important objects.
- Describe foreground, middle ground and background
  when useful.
- Describe the composition.
- Describe camera perspective when useful.
- Maintain clear visual hierarchy.
- Make the image attractive for a children's book.
- Keep the main characters clearly visible.
- Avoid overcrowding the scene.

Characters that are NOT needed for a page should NOT
be forced into that page.

A character may appear on some pages and be absent
from other pages.

==================================================
TEXT RESTRICTIONS
==================================================

Never include, in the cover OR any page:

- written text
- captions
- speech bubbles
- letters
- numbers
- signs with readable text
- logos
- watermarks
- UI elements
- interface elements
- book titles inside the illustration

==================================================
STORY PAGES
==================================================

${(story?.pages || [])
    .map(
        (page) => `
PAGE ${page.pageNumber}

STORY CONTENT:
${page.content}
`
    )
    .join("\n")}

==================================================
OUTPUT REQUIREMENTS
==================================================

Create:

- exactly ONE cover image prompt
- exactly one image prompt for every story page

The cover prompt must contain:

- the selected visual style
- the main recurring character(s)
- character consistency instructions
- an overall scene representing the story's theme/mood
- composition notes reserving space for a title overlay
- text restrictions

The prompt for each page must contain:

- the selected visual style
- relevant recurring characters
- character consistency instructions
- character actions
- character expressions
- environment
- scene composition
- important visual details
- text restrictions

Return ONLY valid JSON.

Use exactly this structure:

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

- "cover" must always be present as a single object
  (not an array).
- "pageNumber" must match the story page number.
- "scene" must briefly describe the visual scene.
- "mood" must describe the emotional atmosphere.
- "characters" must contain ONLY the recurring
  characters actually appearing in that image.
- "prompt" must be a complete, detailed
  image-generation prompt.
- Generate exactly ${story?.pages?.length || 0} image objects
  in "images", one per story page.
- Do not include markdown.
- Do not wrap JSON in code blocks.
- Do not include explanations.
- Do not include text before or after the JSON.
`;

        const response = await gemini.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: prompt
        });

        const rawText = response.text.trim();

        const cleanedText = cleanJson(rawText);

        console.log("Gemini image prompt response:", rawText);

        const parsedResult = JSON.parse(cleanedText);

        if (!parsedResult?.cover?.prompt) {
            throw new Error(
                "Invalid image prompt response: cover prompt missing."
            );
        }

        if (!parsedResult?.images || !Array.isArray(parsedResult.images)) {
            throw new Error(
                "Invalid image prompt response: images array missing."
            );
        }

        if (parsedResult.images.length !== story.pages.length) {
            throw new Error(
                `Expected ${story.pages.length} image prompts but received ${parsedResult.images.length}.`
            );
        }

        return parsedResult;
    } catch (error) {
        console.error("generateImagePrompt error:", error);
        throw error;
    }
};