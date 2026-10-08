import { openai } from "../config/openai.js";
import { generateStoryPrompt } from "./generatestoryPrompt.js";
import { getBookPageCount } from "../config/bookConfig.js";

const MAX_OUTPUT_TOKENS = 12000;
const MAX_ATTEMPTS = 2;

const requestStory = async (prompt) => {
  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: prompt,
    max_output_tokens: MAX_OUTPUT_TOKENS,
    // token budget for the actual story instead of hidden reasoning.
    reasoning: { effort: "low" },
    // Forces the API to only return syntactically valid JSON.
    text: { format: { type: "json_object" } },
  });

  // status can be "completed" or "incomplete" (hit max_output_tokens, was
  if (response.status === "incomplete") {
    const reason = response.incomplete_details?.reason || "unknown";
    throw new Error(`Story generation was cut off (${reason})`);
  }

  if (!response.output_text) {
    throw new Error("Story generation returned no output text");
  }

  return JSON.parse(response.output_text);
};

const normalizeStory = (story) => {
  const pages = (Array.isArray(story?.pages) ? story.pages : [])
    .filter((page) => page && String(page.content || "").trim())
    .map((page, index) => ({ ...page, pageNumber: index + 1 }));

  return { ...story, pages };
};

export const generateStory = async (storyData) => {
  const prompt = generateStoryPrompt(storyData);
  const expectedPages = Number(storyData.pageCount) || getBookPageCount();

  let lastError;
  let closestStory = null; // valid story with the wrong page count

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const story = normalizeStory(await requestStory(prompt));

      if (
        !story.title ||
        story.title === "undefined" ||
        story.pages.length === 0
      ) {
        throw new Error("Generated story is invalid or contains no pages");
      }

      if (story.pages.length !== expectedPages) {
        closestStory = story;
        throw new Error(
          `Expected ${expectedPages} pages but the story has ${story.pages.length}`,
        );
      }

      return story;
    } catch (error) {
      lastError = error;
      console.error(
        `generateStory attempt ${attempt}/${MAX_ATTEMPTS} failed:`,
        error.message,
      );
    }
  }

  if (closestStory) {
    console.warn(
      `Using a ${closestStory.pages.length}-page story (wanted ${expectedPages}).`,
    );
    if (closestStory.pages.length > expectedPages) {
      closestStory = {
        ...closestStory,
        pages: closestStory.pages.slice(0, expectedPages),
      };
    }
    return closestStory;
  }

  throw lastError;
};