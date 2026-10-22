export const isModerationBlock = (error) =>
  error?.code === "moderation_blocked" ||
  error?.error?.code === "moderation_blocked";

const ANIMAL_WORDS =
  "bear|rabbit|bunny|fox|dog|puppy|cat|kitten|bird|owl|duck|lion|tiger|elephant|monkey|panda|deer|wolf|mouse|squirrel|frog|turtle|pig|sheep|horse|penguin|dragon|bison|buffalo|cow|calf|goat|parrot|parakeet|giraffe|zebra|hippo|rhino|kangaroo|koala|camel|llama|donkey|pony|unicorn|chicken|eagle|swan|goose|lizard|snake|dolphin|whale|hamster";

const SOFTEN_RULES = [
  // "young male bear character" -> "friendly cartoon bear"
  [
    new RegExp(
      `\\byoung\\s+(?:male|female|boy|girl)\\s+(${ANIMAL_WORDS})(\\s+character)?`,
      "gi",
    ),
    "friendly cartoon $1",
  ],
  // template text written for humans, harmful on animals
  [
    /\bconsistent facial structure, body proportions, hair, clothing, and colors\b/gi,
    "consistent look and colors",
  ],
  // physical-contact words -> neutral closeness
  [/\bgently and carefully embracing\b/gi, "standing close beside"],
  [/\b(?:embracing|hugging|cuddling|snuggling)\b/gi, "standing close beside"],
  [
    /\bshare(?:s|d)? a (?:gentle |warm |big )?(?:hug|cuddle)\b/gi,
    "share a happy moment",
  ],
  [/\b(?:hug|hugs|cuddle|cuddles|embrace)\b/gi, "friendly moment"],
  [/\b(?:kiss|kisses|kissing)\b/gi, "smiling at"],
  [/\bkneeling down\b/gi, "bending down"],
  // harm-adjacent words
  [/\b(?:hurt|injured|wounded|bleeding|crying in pain)\b/gi, "tired"],
];

export const SAFETY_SUFFIX = {
  0: "Non-graphic, no blood, no gore, no wounds, no nudity. Suitable for a published storybook.",
  1: "Wholesome, family-friendly, all-ages children's picture-book illustration. A character described as an animal looks like a real animal with fur and animal proportions (no human features); every person stays a human person with a human face and human ears. Any human child is fully dressed in ordinary everyday clothes. Friendly, calm, cheerful mood.",
  2: "Wholesome, family-friendly, all-ages children's picture-book illustration. Friendly storybook characters exactly as described above (a person stays a human person with a human face and human ears, never an animal or a mix of person and animal; only a character described as an animal is drawn as an animal), seen at a distance in a calm outdoor scene, standing or walking side by side, smiling. Everyone is fully dressed. Nothing scary, nothing physical, nothing realistic.",
};

export const MAX_SAFETY_LEVEL = 2;

/**
 * level 0 = original prompt + safe suffix
 * level 1 = soften risky wording
 * level 2 = soften + simplest, most distant composition (and the caller
 *           should also drop reference photos)
 */
export const sanitizeImagePrompt = (prompt = "", level = 0) => {
  let text = String(prompt);

  if (level >= 1) {
    for (const [pattern, replacement] of SOFTEN_RULES) {
      text = text.replace(pattern, replacement);
    }
    text = text.replace(/\s{2,}/g, " ").replace(/\s+([,.])/g, "$1");
  }

  return `${text.trim()}\n\n${SAFETY_SUFFIX[Math.min(level, MAX_SAFETY_LEVEL)]}`;
};

const isBlankField = (value) => {
  const text = String(value || "").trim();
  return !text || /^(none|n\/a|na|not applicable|no|nil|-)\b/i.test(text);
};

export { isBlankField };

const ANIMAL_BODY_WORDS =
  "hoof|hooves|snout|muzzle|paws?|tail|beak|feathers?|whiskers?|horns?|scales|fur|furry";

/**
 * What a character REALLY is. The saved "type" is not reliable: a user can
 * upload a bison photo and leave the type as "Child" (this happened - the
 * bison was drawn as a boy and the picture checker then looked for a child).
 * So the Character Bible's own description (fur, snout, hooves, horns...) and
 * the name are checked too.
 *
 * @returns {{ kind: "person" | "animal" | "object", species: string }}
 */
// A crown with horns, a horned helmet, a fur-trimmed cloak or a tail-coat is
// something a PERSON WEARS, not a sign the character is an animal. (This
// misread a person in a horned crown as an animal in three test books: the
// story called her "his animal friend" and she was drawn as a cat / fox.)
// So any clause that talks about something worn is ignored for the animal check.
const WORN_WORDS =
  "crown|crowns|tiara|circlet|diadem|headpiece|head piece|headband|helmet|hat|cap|hood|cloak|cape|coat|jacket|armou?r|costume|outfit|clothes|clothing|collar|belt|boots?|gloves?|scarf|mask|headdress|ornament|accessor(?:y|ies)|jewel(?:s|ry|lery)|worn|wearing|wears";

const withoutWornClauses = (text = "") =>
  String(text)
    .split(/[.;,]|\band\b/i)
    .filter((part) => !new RegExp(`\\b(${WORN_WORDS})\\b`, "i").test(part))
    .join(" ");

const loggedKinds = new Set();

export const inferCharacterKind = (character = {}) => {
  const result = inferCharacterKindUnlogged(character);
  const key = `${character.id || character.name}:${result.kind}`;
  if (!loggedKinds.has(key)) {
    loggedKinds.add(key);
    console.log(
      `Character kind: ${character.name || character.id} (saved type "${character.type || ""}") is treated as ${result.kind}${result.species ? ` (${result.species})` : ""}.`,
    );
  }
  return result;
};

const inferCharacterKindUnlogged = (character = {}) => {
  const type = String(character.type || "");

  if (/object/i.test(type)) {
    return { kind: "object", species: "" };
  }

  const look = character.appearance || {};
  const details = Array.isArray(character.signatureDetails)
    ? character.signatureDetails
    : [];
  const bodyText = withoutWornClauses(
    [look.body, look.fur, look.markings, look.skinTone, ...details]
      .filter((value) => !isBlankField(value))
      .join(". "),
  );
  const speciesText = [character.name, bodyText].filter(Boolean).join(" ");

  const speciesMatch = speciesText.match(
    new RegExp(`\\b(${ANIMAL_WORDS})\\b`, "i"),
  );
  // One animal-body word alone ("a horn", "a tail") is not enough: people
  // wear horned crowns and tailcoats. Two different ones (horns + hooves) are.
  const bodyHits = new Set(
    (
      bodyText.match(new RegExp(`\\b(${ANIMAL_BODY_WORDS})\\b`, "gi")) || []
    ).map((word) => word.toLowerCase().replace(/s$/, "")),
  );
  const bodyHint = bodyHits.size >= 2;
  const hasFur = !isBlankField(look.fur);

  const animal =
    /pet|animal/i.test(type) || Boolean(speciesMatch) || hasFur || bodyHint;

  return animal
    ? {
        kind: "animal",
        species: speciesMatch ? speciesMatch[1].toLowerCase() : "",
      }
    : { kind: "person", species: "" };
};

// Used by generateImagePrompt.js to build the Character Bible rule.
export const isAnimalOrObjectCharacter = (character = {}) =>
  inferCharacterKind(character).kind !== "person";


export const stripLiteralText = (value = "") =>
  String(value)
    .replace(
      /(^|[\s(:,;])(['"\u201C\u2018])([^'"\u201D\u2019]{1,40})(['"\u201D\u2019])(?=[\s.,;:)]|$)/g,
      "$1a plain symbol with no letters",
    )
    .replace(/\s{2,}/g, " ")
    .trim();

// A few words about how each character looks, so the picture checker can tell
// the characters apart (three people look alike to it otherwise and it says one
// is "missing" when it is not). Used only to FIND the character, never to judge it.
const lookCue = (character = {}, kind) => {
  const look = character.appearance || {};
  const clothes = character.clothing || {};
  const pick = (...values) =>
    values
      .filter((v) => !isBlankField(v))
      .map((v) => String(v).trim().replace(/\.$/, ""))
      .join(", ");
  const cue =
    kind === "person"
      ? pick(look.hair, clothes.top)
      : kind === "animal"
        ? pick(look.fur, look.body)
        : pick(look.body, character.colors?.primary);
  return cue.slice(0, 140);
};

export const describeCharacterForCheck = (character = {}) => {
  const { kind, species } = inferCharacterKind(character);

  const what =
    kind === "animal"
      ? `${species ? `a ${species}` : "an animal"} - an animal character, NOT a human`
      : kind === "object"
        ? "an object, not a person"
        : "a person";
  const cue = lookCue(character, kind);

  return `${character.name || "character"} (${what}${cue ? `; look: ${cue}` : ""})`;
};