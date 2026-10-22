import { openai } from "../config/openai.js";
import { recordTokenUsage } from "../services/tokenUsage.js";

const TRANSLATE_MODEL = process.env.OPENAI_TRANSLATE_MODEL || "gpt-5";
const FALLBACK_MODEL =
  process.env.OPENAI_TRANSLATE_FALLBACK_MODEL || "gpt-5-mini";
const TRANSLATE_EFFORT = process.env.OPENAI_TRANSLATE_EFFORT || "low";
const PROOFREAD_EFFORT = process.env.OPENAI_PROOFREAD_EFFORT || "low";
// Scripts such as Telugu or Hindi are where wrong-but-real-looking words slip
// through, so the checking passes think harder for them.
const CHECK_EFFORT_NON_LATIN = process.env.OPENAI_CHECK_EFFORT_NON_LATIN || "medium";
// Scripts such as Telugu, Hindi or Arabic use many tokens per word, so this is
// much larger than the English story budget.
const MAX_OUTPUT_TOKENS = 32000;

export const isEnglish = (language) => {
  const value = String(language || "").trim();
  return !value || /^english\b/i.test(value);
};

const usesLatinScript = (language) =>
  /^(english|spanish|french|german|italian|portuguese|dutch|turkish|indonesian|malay|swahili|polish|romanian|czech|swedish|norwegian|danish|finnish|vietnamese)\b/i.test(
    String(language || "").trim(),
  );

const callJson = async ({ model, prompt, effort }) => {
  const response = await openai.responses.create({
    model,
    input: prompt,
    max_output_tokens: MAX_OUTPUT_TOKENS,
    reasoning: { effort },
    text: { format: { type: "json_object" } },
  });

  recordTokenUsage("Story translation", response.usage); // counted even if cut off

  if (response.status === "incomplete") {
    throw new Error(
      `Translation was cut off (${response.incomplete_details?.reason || "unknown"})`,
    );
  }
  if (!response.output_text) throw new Error("Translation returned no text");
  return JSON.parse(response.output_text);
};

// Tries the strong model first, then the fallback model.
const runWithFallback = async (args) => {
  const models = [...new Set([TRANSLATE_MODEL, FALLBACK_MODEL])];
  let lastError;
  for (const model of models) {
    try {
      return await callJson({ ...args, model });
    } catch (error) {
      lastError = error;
      console.error(`Story translation with ${model} failed:`, error.message);
    }
  }
  throw lastError;
};

const toPayload = (story) => ({
  title: story.title,
  pages: story.pages.map((p, i) => ({
    pageNumber: i + 1,
    content: String(p.content || ""),
  })),
});

const isValid = (result, expectedPages) =>
  result &&
  String(result.title || "").trim() &&
  Array.isArray(result.pages) &&
  result.pages.length === expectedPages &&
  result.pages.every((p) => String(p?.content || "").trim());

const nameRule = (language, names, pinned = {}) => {
  const list = names.length ? names.join(", ") : "(none)";
  if (usesLatinScript(language)) {
    return `CHARACTER NAMES: ${list}. Keep every name exactly as written (never translate or change a name).`;
  }
  const fixed = names.filter((n) => pinned[n]);
  const fixedText = fixed.length
    ? ` Use EXACTLY these spellings and no others: ${fixed.map((n) => `${n} = ${pinned[n]}`).join("; ")}.`
    : "";
  return (
    `CHARACTER NAMES: ${list}. Write every one of these names in the ${language} script (a natural phonetic spelling), ` +
    `spelled IDENTICALLY every time it appears, on every page and in the title. ` +
    `Never leave a name in English letters and never mix two spellings of the same name.${fixedText}`
  );
};

const hasLatinLetters = (text) => /[A-Za-z]/.test(String(text || ""));

// The model keeps writing the English "ph" (F sound) with the plain P letter.
// Where the script has a separate letter for it, fix it in code instead of
// hoping the model obeys: the plain letter becomes the aspirated one, but only
// when the name has "ph" and no other "p" (so the mapping is unambiguous).
const PH_FIX = [
  [/^telugu\b/i, "\u0C2A", "\u0C2B"],
  [/^(hindi|marathi)\b/i, "\u092A", "\u092B"],
  [/^kannada\b/i, "\u0CAA", "\u0CAB"],
  [/^malayalam\b/i, "\u0D2A", "\u0D2B"],
  [/^bengali\b/i, "\u09AA", "\u09AB"],
  [/^gujarati\b/i, "\u0AAA", "\u0AAB"],
  [/^punjabi\b/i, "\u0A2A", "\u0A2B"],
];

const fixAspiratedP = (language, name, spelling) => {
  const rule = PH_FIX.find(([re]) => re.test(String(language || "").trim()));
  if (!rule) return spelling;
  const [, plain, aspirated] = rule;
  const lower = String(name || "").toLowerCase();
  const phCount = (lower.match(/ph/g) || []).length;
  const pCount = (lower.match(/p/g) || []).length;
  if (!phCount || phCount !== pCount) return spelling;
  return spelling.split(plain).join(aspirated);
};

// Decides the spelling of each name ONCE, so the translation,
// the proofreading and the checking all use the same letters (for example the
// "f" sound written with the real "f" letter, not a look-alike).
const pinNames = async ({ language, names }) => {
  if (!names.length || usesLatinScript(language)) {
    return { pinned: {}, wrongSpellings: {} };
  }
  try {
    const result = await runWithFallback({
      prompt: `You are a native ${language} writer. Write each English name below in ${language} script exactly as it sounds when spoken, using the standard, correct ${language} letters for every sound (be careful with similar-looking or similar-sounding letters such as p / ph(f), t / th, d / dh, b / bh). Keep it short and natural, the way a ${language} children's book would print the name. In English names the letters "ph" are the F sound (for example Sophia, Philip, Sophai): write them with the ${language} letter used for the F sound in loan words (in Telugu and Hindi that is ఫ / फ), never with the plain P letter.\n\nNAMES: ${JSON.stringify(names)}\n\nReturn ONLY valid JSON, no markdown: {"names": {"EnglishName": "${language} spelling"}}`,
      effort: "low",
    });
    const pinned = {};
    const wrongSpellings = {}; // model spelling -> corrected spelling
    for (const name of names) {
      const value = String(result?.names?.[name] || "").trim();
      if (value && !hasLatinLetters(value)) {
        pinned[name] = fixAspiratedP(language, name, value);
        if (pinned[name] !== value) wrongSpellings[value] = pinned[name];
      }
    }
    return { pinned, wrongSpellings };
  } catch (error) {
    console.warn("Name spelling step failed, continuing without it:", error.message);
    return { pinned: {}, wrongSpellings: {} };
  }
};

const buildTranslatePrompt = ({ story, language, age, names, pinned }) => `
You are a professional children's-book translator and a native ${language} writer.

Translate the English storybook below into ${language}. The reader is a child
(target age group: ${age || "children"}) and a parent will read it aloud, so it
must sound like a story originally written by a good ${language} author.

QUALITY RULES (all mandatory):
1. Meaning first. Every sentence must be clear and make sense in ${language}.
   Do NOT translate word by word. If an English phrase or idiom would sound odd
   or meaningless, say the same idea the way a native speaker naturally would.
2. Keep every event, object, place, feeling and the final lesson exactly as in
   the English text. Do not add, remove or change story events.
3. Spelling and grammar must be perfect: correct spellings, correct word forms,
   correct sentence endings and agreement. Use common, everyday spoken-style
   words that a child of this age knows; avoid rare, bookish or Sanskritised
   words and avoid invented words.
4. Use ONLY ${language} script and normal ${language} punctuation. Do not leave
   English words inside the sentences (no mixed languages).
5. ${nameRule(language, names, pinned)}
6. Keep the sentence flow smooth, with proper full stops (use the normal
   sentence-ending mark of ${language}). Do not turn the text into fragments or
   separate lines.
7. Keep the same number of pages and the same paragraph structure. Paragraphs
   inside a page are separated by a blank line ("\\n\\n"). The length of each
   translated page should stay close to the English page so it fits the page.
8. The title must be a natural, attractive ${language} title that matches the story.

ENGLISH STORY (JSON):
${JSON.stringify(toPayload(story))}

Return ONLY valid JSON in exactly this structure, with no markdown:
{"title": "", "pages": [{"pageNumber": 1, "content": ""}]}
`;

const buildProofreadPrompt = ({ english, translated, language, names, pinned }) => `
You are a meticulous ${language} editor and proofreader (native speaker) checking
a children's storybook that was translated from English.

Check the ${language} text page by page against the English original and FIX:
- every spelling mistake, wrong word form, grammar or agreement error,
- any sentence that is unclear, unnatural or does not make sense, or that does
  not match the meaning of the English page (rewrite it naturally, same meaning),
- any English word or other-script word left inside the text,
- character names: ${nameRule(language, names, pinned)}
- missing sentence-ending punctuation.

This is the LAST check, and an earlier editor may have changed words and
introduced new mistakes (for example a look-alike word that is a different
noun). Compare every word with the meaning of the English page again.
Every sentence must be short and clear (about 15 words or fewer): split any
long or tangled sentence into two or three short sentences, and fix
agreement of every word (for example "అందరు" must be "అందరూ" in Telugu).

Do NOT change what happens in the story, do not shorten or lengthen pages
noticeably, keep the same number of pages, and keep paragraph breaks ("\\n\\n").
If a sentence is already correct and natural, leave it exactly as it is.

ENGLISH ORIGINAL (JSON):
${JSON.stringify(toPayload(english))}

${language} TRANSLATION TO CHECK (JSON):
${JSON.stringify(toPayload(translated))}

Return ONLY the corrected ${language} version as valid JSON in exactly this
structure, with no markdown and no comments:
{"title": "", "pages": [{"pageNumber": 1, "content": ""}]}
`;

// Last pass: hunts for words that LOOK correct but mean something else (for
// example "vanished" where "magic" was meant), and checks the title most
// carefully because it is the first thing a parent reads.
const buildWordCheckPrompt = ({ english, translated, language, names, pinned }) => `
You are a strict native ${language} language examiner checking a children's
storybook that was translated from English. Another editor already fixed
spelling. Your job is different: find WORDS THAT ARE SPELLED CORRECTLY BUT ARE
THE WRONG WORD for the meaning (a different word that only looks or sounds
similar, a word with an opposite or unrelated meaning, a bookish word a child
would not know), and sentences a ${language} speaker would find odd.

Go through the TITLE first, then every page, word by word. For every word
or phrase you are not 100% sure means exactly what the English means, decide
what the English meant and replace it with the common, natural ${language}
word. Also make sure:
- the English meaning of every sentence is preserved, nothing added or removed,
- the title means the same as the English title and is a natural phrase,
- ${nameRule(language, names, pinned)}
- no description of hair, clothes or looks is awkwardly translated (rewrite it simply if it is),
- the same page count and the same paragraph breaks ("\\n\\n").
Change a word ONLY when it is clearly wrong or means something different from the English. If a common, valid, natural word already fits the meaning, keep it: never swap it for a rarer, more formal or more bookish word, and never change the title just to make it sound different. Never invent a new word. Words a child hears every day beat clever words.
- every sentence must be short and simple (about 15 words or fewer). A long or tangled sentence, or one with several "because / and / while" parts, must be rewritten as two or three short, clear sentences with the same meaning.
- use EVERYDAY words a young child hears at home. Replace formal, bookish or Sanskrit-heavy words (for example తిరస్కృతుడు, ప్రకాశమైన) with the simple spoken word or a short phrase (for example "అందరూ దూరం పెట్టిన వాడు", "మెరిసే").
- do NOT change the ending of a word just to sound different: a rope is తాడు, so "like a rope" is తాడులా (తాడిలా would mean "like a palm tree"). Check every changed word keeps the noun the English meant.
Leave every sentence that is already correct exactly as it is.

ENGLISH ORIGINAL (JSON):
${JSON.stringify(toPayload(english))}

${language} TEXT TO CHECK (JSON):
${JSON.stringify(toPayload(translated))}

Return ONLY valid JSON, no markdown, in exactly this structure ("issues" lists
each wrong word you changed, empty list if none):
{"title": "", "pages": [{"pageNumber": 1, "content": ""}], "issues": [{"where": "title or page number", "wrong": "", "fixed": "", "why": "(say in English what the English word meant and what the wrong word actually means)"}]}
`;

/**
 * Translates an English story ({ title, pages:[{pageNumber, content}] }) into
 * `storyData.language`, then proofreads it. Never throws: if a step fails the
 * best version so far (or, at worst, the English story) is returned.
 */
export const translateStory = async (englishStory, storyData) => {
  const language = String(storyData.language || "").trim();
  const expectedPages = englishStory.pages.length;
  const names = (storyData.characters || [])
    .map((c) => String(c?.name || "").trim())
    .filter(Boolean);

  let translated = null;
  const { pinned, wrongSpellings } = await pinNames({ language, names });
  const checkEffort = usesLatinScript(language)
    ? PROOFREAD_EFFORT
    : CHECK_EFFORT_NON_LATIN;

  try {
    const result = await runWithFallback({
      prompt: buildTranslatePrompt({
        story: englishStory,
        language,
        age: storyData.age,
        names,
        pinned,
      }),
      effort: TRANSLATE_EFFORT,
    });
    if (!isValid(result, expectedPages)) {
      throw new Error(
        "Translated story is invalid or has the wrong page count",
      );
    }
    translated = result;
  } catch (error) {
    console.error(
      "Story translation failed, keeping the English story:",
      error.message,
    );
    return englishStory;
  }

  try {
    const checked = await runWithFallback({
      prompt: buildWordCheckPrompt({
        english: englishStory,
        translated,
        language,
        names,
        pinned,
      }),
      effort: checkEffort,
    });
    if (isValid(checked, expectedPages)) {
      translated = checked;
      const issues = Array.isArray(checked.issues) ? checked.issues : [];
      if (issues.length) {
        console.log(
          `Word check fixed ${issues.length} wrong word(s):`,
          JSON.stringify(issues),
        );
      }
    } else {
      console.warn("Word check result invalid, keeping the proofread text.");
    }
  } catch (error) {
    console.error(
      "Word check failed, keeping the proofread text:",
      error.message,
    );
  }

  try {
    const proofread = await runWithFallback({
      prompt: buildProofreadPrompt({
        english: englishStory,
        translated,
        language,
        names,
        pinned,
      }),
      effort: checkEffort,
    });
    if (isValid(proofread, expectedPages)) translated = proofread;
    else
      console.warn(
        "Proofread result invalid, using the unproofed translation.",
      );
  } catch (error) {
    console.error(
      "Story proofreading failed, using the unproofed translation:",
      error.message,
    );
  }

  // Words the model keeps inventing that are not real words (checked by hand).
  const KNOWN_BAD_WORDS = /^telugu\b/i.test(language)
    ? { "\u0C2C\u0C3F\u0C17\u0C3F\u0C17\u0C3E": "\u0C17\u0C1F\u0C4D\u0C1F\u0C3F\u0C17\u0C3E" } // బిగిగా -> గట్టిగా
    : {};

  // Last, in code: make sure the corrected name spelling is the one printed,
  // whatever the model wrote on its own in the text.
  const fixNames = (text) =>
    Object.entries({ ...wrongSpellings, ...KNOWN_BAD_WORDS }).reduce(
      (out, [wrong, right]) => out.split(wrong).join(right),
      String(text || ""),
    );

  return {
    ...englishStory,
    title: fixNames(translated.title),
    pages: translated.pages.map((p, index) => ({
      ...p,
      content: fixNames(p.content),
      pageNumber: index + 1,
    })),
  };
};