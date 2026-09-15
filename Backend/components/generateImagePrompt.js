import gemini from "../config/gemini.js";

const cleanJson = (text) => {
    return text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
};

export const generateImagePrompt = async (story) => {
    try {
        const prompt = `
You are a professional children's storybook illustration prompt designer.

Create one detailed image-generation prompt for each page of the story.

STORY TITLE:
${story.title}

STORY PAGES:
${story.pages.map((page) => `
Page ${page.pageNumber}:
${page.content}
`).join("\n")}

CHARACTER CONSISTENCY:
Anya: 8-year-old girl with curly brown hair, safety goggles, notebook, curious personality.
Bolt: small friendly pet robot with glowing blue LED eyes and metallic body.

For every page:
1. Create one clear visual scene.
2. Describe what Anya and Bolt are doing.
3. Describe their expressions and emotions.
4. Describe the environment.
5. Maintain consistent character appearance.
6. Use a consistent children's storybook illustration style.
7. Do not include text, captions, speech bubbles, or written words.
8. Do not combine unrelated scenes.

Return ONLY valid JSON in this exact structure:

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