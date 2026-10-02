import { GoogleGenAI } from "@google/genai";

const gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const fallbackKey = process.env.GEMINI_FALLBACK_API_KEY;

export const geminiBackup =
    fallbackKey && fallbackKey !== process.env.GEMINI_API_KEY
        ? new GoogleGenAI({ apiKey: fallbackKey })
        : null;

export default gemini;