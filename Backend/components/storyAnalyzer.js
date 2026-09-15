import gemini from "../config/gemini.js";
import { createStoryPrompt } from "./storyPrompt.js";

export const analyzeStory = async (message) => {
    const prompt = createStoryPrompt(message);

    const response = await gemini.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
    });

    return JSON.parse(response.text);
};