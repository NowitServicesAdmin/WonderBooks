// const TTS_ENGINE_URL = process.env.TTS_ENGINE_URL || "http://127.0.0.1:8020/generate";
// // Matches the `id` values from your language picker exactly (lowercase)
// const SUPPORTED_LANGS = new Set([
//   "english", "spanish", "french", "german", "italian",
//   "portuguese", "dutch", "hindi", "arabic", "chinese",
//   // "japanese" and "korean" have no Piper voice yet - falls back to English on the server
// ]);

// export async function generateAudio({ text, voiceId, language }) {
//   console.log("Triggering @god", text, voiceId, language)
//   const lang = SUPPORTED_LANGS.has((language || "").toLowerCase()) ? language.toLowerCase() : "english";

//   const res = await fetch(TTS_ENGINE_URL, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ text, voice: voiceId, lang }),
//     signal: AbortSignal.timeout(120000),
//   });

//   if (!res.ok) {
//     const detail = await res.text().catch(() => "");
//     throw new Error(`TTS engine failed (${res.status}): ${detail}`);
//   }

//   return Buffer.from(await res.arrayBuffer()); // MP3 bytes
// }

const TTS_ENGINE_URL =
  process.env.TTS_ENGINE_URL || "http://127.0.0.1:8020/generate";

const SUPPORTED_LANGS = new Set([
  "english",
  "spanish",
  "french",
  "german",
  "italian",
  "portuguese",
  "dutch",
  "hindi",
  "arabic",
  "chinese",
]);

export async function generateAudio({ text, voiceId, language }) {
  console.log("Triggering @god", text, voiceId, language);

  const lang = SUPPORTED_LANGS.has(
    (language || "").toLowerCase()
  )
    ? language.toLowerCase()
    : "english";

  const res = await fetch(TTS_ENGINE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      voice: voiceId,
      lang,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `TTS engine failed (${res.status}): ${detail}`
    );
  }

  if (!res.body) {
    throw new Error("TTS engine returned no audio stream");
  }

  return res.body;
}