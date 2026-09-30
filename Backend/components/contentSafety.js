import { openai } from "../config/openai.js";

const MODERATION_MODEL = process.env.OPENAI_MODERATION_MODEL || "omni-moderation-latest";


export const BANDS = ["0-3", "4-7", "8-13", "13-17", "18+"];
const bandIndex = (band) => BANDS.indexOf(band);

// Accepts any phrasing: "0–3 years", "4-7 years", "18+ years", "6 - 8 years"...
// Returns null when unknown (the age has not been chosen yet).
export const ageBand = (age) => {
  const raw = String(age || "").toLowerCase();
  if (!raw.trim()) return null;
  if (/18\s*\+|18\s*plus|\badult/.test(raw)) return "18+";
  const numbers = (raw.match(/\d+/g) || []).map(Number);
  if (!numbers.length) return null;
  const min = Math.min(...numbers);
  if (min >= 18) return "18+";
  if (min >= 13) return "13-17";
  if (min >= 8) return "8-13";
  if (min >= 4) return "4-7";
  return "0-3";
};

// One-line description of what the story may contain at each age.
export const CONTENT_POLICY = {
  "0-3": "Very gentle only. No conflict, villains, danger or fear. Just warm, simple everyday moments.",
  "4-7": "Gentle. A villain or problem may appear, but it is solved by cleverness, kindness or friendship. No fighting is shown, nothing frightening.",
  "8-13": "Adventure and action are welcome. The hero may face monsters and villains (for example a demon lord), show courage, and win a real showdown with magic, skill and teamwork. Keep it non-graphic: no blood, gore, gruesome injury or death.",
  "13-17": "Epic fantasy is welcome. Real stakes, serious battles, sacrifice, loss and darker themes are fine when handled non-graphically: no gore, no gratuitous cruelty, no sexual content.",
  "18+": "Mature storytelling is welcome. Dark fantasy, war, tragedy and morally complex villains are fine when non-graphic. Always excluded: sexual content, graphic gore or torture, glorified self-harm, hate.",
};

export const policyFor = (band) => CONTENT_POLICY[band] || CONTENT_POLICY["8-13"];

/* ------------------------------ local rules ------------------------------ */

// Refused at every age (the OpenAI models would refuse them too).
const HARD_BLOCK_ALL = [
  { kind: "adult", re: /\b(sex(?:y|ual|ually)?|nude|nudes|naked|nudity|porn\w*|erotic\w*|fetish\w*|rape[sd]?|raping|molest\w*|orgy|horny|lingerie|topless|blowjob|genitals?|penis|vagina|masturbat\w*)\b/i },
  { kind: "gore", re: /\b(gore|gory|dismember\w*|behead\w*|disembowel\w*|mutilat\w*)\b/i },
];

// Refused only below 18.
const HARD_BLOCK_MINORS = [
  { kind: "selfharm", re: /\b(suicide|suicidal|self[- ]harm|kill(?:s|ed|ing)?\s+(?:my|him|her|them|it)self)\b/i },
  { kind: "drugs", re: /\b(cocaine|heroin|meth|methamphetamine|marijuana|cannabis|lsd|ecstasy)\b/i },
];

// "bite" is only a problem when aimed at someone. "a bite of cake",
// "bite-sized" and "a bit of" are fine.
const BITE_RE = /(?<!\b(?:a|one|first|last|small|big|tiny|little|quick|another|each|every|few|two|three)\s)\b(bites?|biting|bitten)\b(?![\s-]*(?:of|into|size|sized)\b)/gi;
const BIT_RE = /\b(bit)(\s+(?:him|her|them|me|us|the|his|my|a|an|its)\b)/gi;

// Each rule is softened while the reader is YOUNGER than `allowedFrom`.
// (Unknown age is treated as "8-13" for fantasy conflict, and as young for
// everything else, so nothing risky slips through before the age is known.)
const SOFT = [
  { label: "biting", allowedFrom: "8-13", test: (t) => new RegExp(BITE_RE.source, "i").test(t) || new RegExp(BIT_RE.source, "i").test(t) },
  {
    label: "fighting",
    allowedFrom: "8-13",
    unknownAllowed: true, // keep fantasy conflict until the age is known
    test: (t) => /\b(fight(?:s|ing)?|fought|battle[sd]?|battling|duel\w*|combat|war|attack\w*|defeat\w*|destroy\w*|slay\w*|smite\w*)\b/i.test(t),
  },
  {
    label: "violence",
    allowedFrom: "13-17",
    test: (t) => /\b(punch\w*|slap(?:s|ped|ping)?|stab\w*|shoot(?:s|ing)?|kill(?:s|ed|ing)?|beat(?:s|ing)?\s+up|blood\w*|weapons?|guns?|knife|knives|bombs?|swords?)\b/i.test(t),
  },
  { label: "murder or torture", allowedFrom: "13-17", test: (t) => /\b(murder\w*|massacre\w*|tortur\w*)\b/i.test(t) },
  { label: "alcohol or smoking", allowedFrom: "18+", test: (t) => /\b(beer|wine|vodka|whisk(?:e)?y|alcohol\w*|drunk|cigarettes?|smoking|vape|vaping)\b/i.test(t) },
];

const isYoungerThan = (band, allowedFrom, unknownAsAllowed = false) => {
  const effective = band || (unknownAsAllowed ? "18+" : "0-3");
  return bandIndex(effective) < bandIndex(allowedFrom);
};

export const findHardBlock = (text = "", age = null) => {
  const s = String(text);
  const band = ageBand(age);
  const rules = [...HARD_BLOCK_ALL, ...(band === "18+" ? [] : HARD_BLOCK_MINORS)];
  return rules.find(({ re }) => re.test(s))?.kind || null;
};

// Labels that must be toned down for this reader.
export const findSoftLabels = (text = "", age = null) => {
  const s = String(text);
  const band = ageBand(age);
  return SOFT.filter(({ test, allowedFrom, unknownAllowed }) => isYoungerThan(band, allowedFrom, unknownAllowed) && test(s)).map(({ label }) => label);
};

const matchCase = (original, replacement) =>
  original[0] === original[0].toUpperCase() ? replacement[0].toUpperCase() + replacement.slice(1) : replacement;

// Backstop swap for "biting" only (safe to replace blindly). Everything else
// depends on context, so the chat model rewrites it using the age policy.
export const softenText = (text = "", age = null) => {
  if (!isYoungerThan(ageBand(age), "8-13")) return String(text);
  return String(text)
    .replace(BITE_RE, (m, w) => {
      const lw = w.toLowerCase();
      const out = lw === "biting" ? "nuzzling" : lw === "bitten" ? "nuzzled" : lw === "bites" ? "nuzzles" : "nuzzle";
      return matchCase(m, out);
    })
    .replace(BIT_RE, (m, w, rest) => `${matchCase(w, "nuzzled")}${rest}`);
};

export const softenStrings = (obj = {}, age = null) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, typeof v === "string" ? softenText(v, age) : v]));

// storySettings from the form look like { theme: { label: "Adventure" } }.
export const softenSelections = (selections = {}, age = null) =>
  Object.fromEntries(
    Object.entries(selections || {}).map(([k, v]) => [
      k,
      v && typeof v === "object" && typeof v.label === "string" ? { ...v, label: softenText(v.label, age) } : v,
    ])
  );

// Every free-text thing the user can influence.
export const collectUserText = ({ message, storySettings, characters } = {}) => {
  const parts = [];
  if (typeof message === "string") parts.push(message);

  for (const v of Object.values(storySettings || {})) {
    if (typeof v === "string") parts.push(v);
    else if (v && typeof v.label === "string") parts.push(v.label);
  }

  for (const c of characters || []) {
    for (const key of ["name", "hobbies", "favouriteFood"]) {
      if (typeof c?.[key] === "string") parts.push(c[key]);
    }
  }

  return parts.filter(Boolean).join("\n");
};

/* ------------------------------ user messages ---------------------------- */

const BLOCK_WHAT = {
  adult: "sexual or adult content",
  gore: "graphic gore",
  selfharm: "self-harm",
  drugs: "drug use",
  hate: "hateful or threatening content",
  illicit: "instructions for illegal or dangerous activities",
};

export const buildBlockMessage = (kind = "adult") =>
  `I can't create this book because it includes ${BLOCK_WHAT[kind] || BLOCK_WHAT.adult}. ` +
  `WonderBooks writes and illustrates stories with OpenAI's models, and OpenAI's safety rules don't allow this kind of content, so it can't be generated at any age setting. ` +
  `Your story can still have adventure, battles and dark themes without it. Try rewording that part.`;

export const changeNote = (labels = []) =>
  `To keep the story suitable for this age group, I left out ${labels.join(" and ")}.`;

// moderation category -> our kind (checked in this order)
const API_BLOCK = [
  ["sexual/minors", "adult"],
  ["sexual", "adult"],
  ["violence/graphic", "gore"],
  ["self-harm/intent", "selfharm"],
  ["self-harm/instructions", "selfharm"],
  ["hate/threatening", "hate"],
  ["harassment/threatening", "hate"],
  ["illicit/violent", "illicit"],
];

const runModeration = async (text) => {
  try {
    const res = await openai.moderations.create({ model: MODERATION_MODEL, input: text });
    return res?.results?.[0] || null;
  } catch (error) {
    console.error("Moderation check failed (continuing with local rules only):", error?.message || error);
    return null;
  }
};

/**
 * @param {string} text
 * @param {{age?: string}} [options]
 * @returns {Promise<{verdict: "ok"|"soften"|"block", kind?: string, message?: string, softLabels: string[]}>}
 */
export const checkStoryText = async (text = "", { age = null } = {}) => {
  const clean = String(text || "").trim();
  if (!clean) return { verdict: "ok", softLabels: [] };

  const localKind = findHardBlock(clean, age);
  if (localKind) {
    return { verdict: "block", kind: localKind, message: buildBlockMessage(localKind), softLabels: [] };
  }

  // Ordinary "violence" / "harassment" flags are NOT used to soften: fantasy
  // fights trigger them constantly. Only the categories above hard-block.
  const result = await runModeration(clean);
  if (result) {
    const hit = API_BLOCK.find(([category]) => result.categories?.[category]);
    if (hit) {
      return { verdict: "block", kind: hit[1], message: buildBlockMessage(hit[1]), softLabels: [] };
    }
  }

  const softLabels = findSoftLabels(clean, age);
  return { verdict: softLabels.length ? "soften" : "ok", softLabels };
};