import gemini from "../config/gemini.js";


const cleanJson = (text) => {
    return text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
};

export const generateImagePrompt = async (story, storyData) => {
    try {
        const characters = (storyData.characters || [])
            .map(
                (character) => `
Name: ${character.name}
Type: ${character.type}
Gender: ${character.gender || "Not specified"}
Age: ${character.age || "Not specified"}
Hobbies: ${character.hobbies || "Not specified"}
Favourite Food: ${character.favouriteFood || "Not specified"}
`
            )
            .join("\n");

        const prompt = `
You are a professional children's storybook illustration prompt designer.

Create exactly one detailed image-generation prompt for each page of the story.

STORY TITLE:
${story.title}

SELECTED ILLUSTRATION STYLE:
${storyData.imageStyle}

IMPORTANT:
Every generated illustration must use the selected illustration style:
${storyData.imageStyle}

Do not replace the selected style with another style.

CHARACTERS:

${characters}

CHARACTER CONSISTENCY:

The characters above are the actual characters in this story.

For every page:

1. Use the same characters consistently.
2. Keep their names, type, appearance, age, and important characteristics consistent.
3. Do not invent completely different versions of the characters.
4. Do not rename characters.
5. If a character is an animal, preserve its animal identity.
6. If a character is an object or toy, preserve its identity and recognizable appearance.
7. Maintain consistent clothing, colors, physical features, and visual identity across all pages.
8. Character appearance should remain visually consistent from page to page.

STORY PAGES:

${story.pages
                .map(
                    (page) => `
Page ${page.pageNumber}:
${page.content}
`
                )
                .join("\n")}

IMAGE REQUIREMENTS:

For every page:

1. Create one clear visual scene.
2. Describe what the relevant characters are doing.
3. Describe their expressions and emotions.
4. Describe the environment.
5. Describe important objects relevant to the scene.
6. Maintain character consistency.
7. Use exactly this illustration style:
${storyData.imageStyle}
8. Make the scene visually appealing for a storybook.
9. Make the composition suitable for a children's storybook page.
10. Do not combine unrelated scenes.
11. Do not create multiple separate moments from the story in one illustration.
12. Do not include text.
13. Do not include captions.
14. Do not include speech bubbles.
15. Do not include written words.
16. Do not include watermarks.
17. Do not include UI elements.

VISUAL STYLE:

The selected style is:
${storyData.imageStyle}

The style must remain consistent across every page.

Create prompts that explicitly describe the selected style in visual terms.

Return ONLY valid JSON.

Use exactly this structure:

{
    "images": [
        {
            "pageNumber": 1,
            "scene": "",
            "mood": "",
            "prompt": ""
        }
    ]
}

Generate one object for every story page.

There must be exactly ${story.pages.length} image objects.

Do not include markdown.
Do not wrap the JSON in code blocks.
Do not include any text before or after the JSON.
`;

        const response = await gemini.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: prompt
        });

        const rawText = response.text.trim();
        const cleanedText = cleanJson(rawText);

        console.log("Gemini raw response:", rawText);

        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("generateImagePrompt error:", error);
        throw error;
    }
};