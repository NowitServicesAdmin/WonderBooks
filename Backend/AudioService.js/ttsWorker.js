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

// export async function generateAudio({ text, voiceId, language }) {
//   console.log("Triggering @god", text, voiceId, language);

//   const lang = SUPPORTED_LANGS.has(
//     (language || "").toLowerCase()
//   )
//     ? language.toLowerCase()
//     : "english";

//   const res = await fetch(TTS_ENGINE_URL, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       text,
//       voice: voiceId,
//       lang,
//     }),
//     signal: AbortSignal.timeout(120000),
//   });

//   if (!res.ok) {
//     const detail = await res.text().catch(() => "");
//     throw new Error(
//       `TTS engine failed (${res.status}): ${detail}`
//     );
//   }

//   if (!res.body) {
//     throw new Error("TTS engine returned no audio stream");
//   }

//   return res.body;
// }

export async function generateAudio({
  text,
  voiceId,
  language,
}) {
  console.log("[TTS ENGINE] Request:", {
    textLength: text?.length,
    voiceId,
    language,
  });

  const normalizedLanguage = (language || "").toLowerCase();

  const lang = SUPPORTED_LANGS.has(normalizedLanguage)
    ? normalizedLanguage
    : "english";

  console.log("[TTS ENGINE] Normalized language:", lang);

  const startTime = Date.now();

  const response = await fetch(TTS_ENGINE_URL, {
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

  const responseTime = Date.now() - startTime;

  console.log("[TTS ENGINE] Response:", {
    status: response.status,
    contentType: response.headers.get("content-type"),
    contentLength: response.headers.get("content-length"),
    transferEncoding: response.headers.get("transfer-encoding"),
    responseTime: `${responseTime} ms`,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");

    console.error("[TTS ENGINE] Failed:", {
      status: response.status,
      detail,
    });

    throw new Error(
      `TTS engine failed (${response.status}): ${detail}`
    );
  }

  if (!response.body) {
    throw new Error(
      "TTS engine returned no audio stream"
    );
  }

  console.log(
    "[TTS ENGINE] Audio stream received successfully"
  );

  /*
   * Return the ReadableStream directly.
   *
   * The /api/tts handler consumes this stream:
   *
   * for await (const chunk of audioStream) {
   *   res.write(chunk);
   * }
   *
   * IMPORTANT:
   * These chunks are HTTP byte chunks from the same MP3.
   * They are NOT independently playable audio segments.
   */
  return response.body;
}