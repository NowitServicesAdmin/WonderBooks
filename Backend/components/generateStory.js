import { openai } from "../config/openai.js";
import { generateStoryPrompt } from "./generatestoryPrompt.js";

export const generateStory = async (storyData) => {
    const prompt = generateStoryPrompt(storyData);

    const response = await openai.responses.create({
        model: "gpt-5-mini",
        input: prompt,
    });
    console.log(response,"response ")
    return JSON.parse(response.output_text);
};