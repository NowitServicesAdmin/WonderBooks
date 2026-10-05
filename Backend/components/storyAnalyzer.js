import { createStoryPrompt } from "./storyPrompt.js";
import { generateContentResilient } from "./geminiCall.js";

const cleanJson = (text = "") =>
    text
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

export const analyzeStory = async (message) => {
    const prompt = createStoryPrompt(message);

    const response = await generateContentResilient({
        models: [
            process.env.GEMINI_PROMPT_MODEL || "gemini-3.5-flash-lite",
            process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash"
        ],
        contents: prompt,
        label: "Story analyzer"
    });

    return JSON.parse(cleanJson(response.text));
};