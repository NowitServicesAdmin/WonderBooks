
// const TTS_ENGINE_URL =
//   process.env.TTS_ENGINE_URL || "http://127.0.0.1:8020/generate";

// const SUPPORTED_LANGS = new Set([
//   "english",
//   "spanish",
//   "french",
//   "german",
//   "italian",
//   "portuguese",
//   "dutch",
//   "hindi",
//   "arabic",
//   "chinese",
// ]);


// export async function generateAudio({
//   text,
//   voiceId,
//   language,
// }) {
//   console.log("[TTS ENGINE] Request:", {
//     textLength: text?.length,
//     voiceId,
//     language,
//   });

//   const normalizedLanguage = (language || "").toLowerCase();

//   const lang = SUPPORTED_LANGS.has(normalizedLanguage)
//     ? normalizedLanguage
//     : "english";

//   console.log("[TTS ENGINE] Normalized language:", lang);

//   const startTime = Date.now();

//   const response = await fetch(TTS_ENGINE_URL, {
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

//   const responseTime = Date.now() - startTime;

//   console.log("[TTS ENGINE] Response:", {
//     status: response.status,
//     contentType: response.headers.get("content-type"),
//     contentLength: response.headers.get("content-length"),
//     transferEncoding: response.headers.get("transfer-encoding"),
//     responseTime: `${responseTime} ms`,
//   });

//   if (!response.ok) {
//     const detail = await response.text().catch(() => "");

//     console.error("[TTS ENGINE] Failed:", {
//       status: response.status,
//       detail,
//     });

//     throw new Error(
//       `TTS engine failed (${response.status}): ${detail}`
//     );
//   }

//   if (!response.body) {
//     throw new Error(
//       "TTS engine returned no audio stream"
//     );
//   }

//   console.log(
//     "[TTS ENGINE] Audio stream received successfully"
//   );

//   return response.body;
// }

const TTS_ENGINE_URL =
  process.env.TTS_ENGINE_URL || "http://127.0.0.1:8020/generate";

// Canonical language ids sent to the TTS engine (match your language picker ids).
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
  "telugu",
]);

// Accepts ids, display names and locale codes, and maps them to a canonical id.
const LANG_ALIASES = {
  en: "english",
  es: "spanish",
  fr: "french",
  de: "german",
  it: "italian",
  pt: "portuguese",
  nl: "dutch",
  hi: "hindi",
  ar: "arabic",
  zh: "chinese",
  te: "telugu",
  "te-in": "telugu",
  "te_in": "telugu",
};

export function normalizeLanguage(language) {
  const key = String(language || "english").trim().toLowerCase();
  const canonical = LANG_ALIASES[key] || key;

  if (!SUPPORTED_LANGS.has(canonical)) {
    const error = new Error(`Unsupported TTS language: "${language}"`);
    error.code = "UNSUPPORTED_LANGUAGE";
    throw error;
  }

  return canonical;
}

export async function generateAudio({ text, voiceId, language }) {
  console.log("[TTS ENGINE] Request:", {
    url: TTS_ENGINE_URL,
    textLength: text?.length,
    voiceId,
    language,
  });

  // Throws for unsupported languages instead of silently reading them in English.
  const lang = normalizeLanguage(language);

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

  console.log("[TTS ENGINE] Response:", {
    status: response.status,
    contentType: response.headers.get("content-type"),
    contentLength: response.headers.get("content-length"),
    transferEncoding: response.headers.get("transfer-encoding"),
    responseTime: `${Date.now() - startTime} ms`,
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    const isHtml = (response.headers.get("content-type") || "").includes(
      "text/html"
    );

    // An HTML body means the URL hit the wrong server/route, not the TTS engine.
    const detail = isHtml
      ? `Wrong server or route at ${TTS_ENGINE_URL} (got an HTML error page)`
      : raw.slice(0, 500);

    console.error("[TTS ENGINE] Failed:", {
      status: response.status,
      detail,
    });

    throw new Error(`TTS engine failed (${response.status}): ${detail}`);
  }

  if (!response.body) {
    throw new Error("TTS engine returned no audio stream");
  }

  console.log("[TTS ENGINE] Audio stream received successfully");

  // Callers must collect the whole stream before playing it: the chunks are
  // HTTP byte chunks of one MP3, not independently playable segments.
  return response.body;
}