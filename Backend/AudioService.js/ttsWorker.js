// // AudioService.js/ttsWorker.js
// import fs from "fs/promises";
// import path from "path";

// const TTS_ENGINE_URL = process.env.TTS_ENGINE_URL || "http://13.235.1.156:8020/generate";
// const AUDIO_DIR = path.join(process.cwd(), "uploads", "audio"); // matches app.js's static path
// const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:5000"; // matches PORT in app.js

// export async function generateAudio({ text, voiceId }) {
//   const res = await fetch(TTS_ENGINE_URL, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ text, voice: voiceId }),
//     signal: AbortSignal.timeout(120000),
//   });

//   if (!res.ok) {
//     const detail = await res.text().catch(() => "");
//     throw new Error(`TTS engine failed (${res.status}): ${detail}`);
//   }

//   return Buffer.from(await res.arrayBuffer()); // MP3 bytes
// }

// export async function saveAudio(cacheKey, buffer) {
//   // cacheKey looks like "bookId/pageId/voiceId.mp3"
//   const filePath = path.join(AUDIO_DIR, cacheKey);
//   await fs.mkdir(path.dirname(filePath), { recursive: true });
//   await fs.writeFile(filePath, buffer);
//   return `${PUBLIC_BASE_URL}/audio/${cacheKey}`;
// }
// AudioService.js/ttsWorker.js
// const TTS_ENGINE_URL = process.env.TTS_ENGINE_URL || "http://3.229.24.45:8020/generate";
const TTS_ENGINE_URL = process.env.TTS_ENGINE_URL || "http://127.0.0.1:8020/generate";

// Matches the `id` values from your language picker exactly (lowercase)
const SUPPORTED_LANGS = new Set([
  "english", "spanish", "french", "german", "italian",
  "portuguese", "dutch", "hindi", "arabic", "chinese",
  // "japanese" and "korean" have no Piper voice yet - falls back to English on the server
]);

export async function generateAudio({ text, voiceId, language }) {
  console.log("Triggering @god", text, voiceId, language)
  const lang = SUPPORTED_LANGS.has((language || "").toLowerCase()) ? language.toLowerCase() : "english";

  const res = await fetch(TTS_ENGINE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice: voiceId, lang }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`TTS engine failed (${res.status}): ${detail}`);
  }

  return Buffer.from(await res.arrayBuffer()); // MP3 bytes
}