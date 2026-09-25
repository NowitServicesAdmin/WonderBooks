// import { openai } from "../config/openai.js";
// import { generateStoryPrompt } from "./generatestoryPrompt.js";

// export const generateStory = async (storyData) => {
//     const prompt = generateStoryPrompt(storyData);

//     const response = await openai.responses.create({
//         model: "gpt-5-mini",
//         input: prompt,
//     });
//     console.log(response,"response ")
//     return JSON.parse(response.output_text);
// };

import { openai } from "../config/openai.js";
import { generateStoryPrompt } from "./generatestoryPrompt.js";

const MAX_OUTPUT_TOKENS = 6000; // plenty of headroom above what a 2-10 page story + reasoning needs

const requestStory = async (prompt) => {
    const response = await openai.responses.create({
        model: "gpt-5-mini",
        input: prompt,
        max_output_tokens: MAX_OUTPUT_TOKENS,
        // Structured writing, not a hard reasoning problem — keep more of the
        // token budget for the actual story instead of hidden reasoning.
        reasoning: { effort: "low" },
        // Forces the API to only return syntactically valid JSON.
        text: { format: { type: "json_object" } },
    });

    // status can be "completed" or "incomplete" (hit max_output_tokens, was
    // filtered, etc.) — incomplete means the JSON below is guaranteed truncated.
    if (response.status === "incomplete") {
        const reason = response.incomplete_details?.reason || "unknown";
        throw new Error(`Story generation was cut off (${reason})`);
    }

    if (!response.output_text) {
        throw new Error("Story generation returned no output text");
    }

    return JSON.parse(response.output_text);
};

export const generateStory = async (storyData) => {
    const prompt = generateStoryPrompt(storyData);

    try {
        return await requestStory(prompt);
    } catch (error) {
        console.error("generateStory failed, retrying once:", error.message);
        // One retry covers occasional truncation/parse failures without
        // masking a real, persistent problem (that retry will just fail too).
        return await requestStory(prompt);
    }
};