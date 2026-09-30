
export const isModerationBlock = (error) =>
  error?.code === "moderation_blocked" ||
  error?.error?.code === "moderation_blocked";

const ANIMAL_WORDS =
  "bear|rabbit|bunny|fox|dog|puppy|cat|kitten|bird|owl|duck|lion|tiger|elephant|monkey|panda|deer|wolf|mouse|squirrel|frog|turtle|pig|sheep|horse|penguin|dragon";

const SOFTEN_RULES = [
  // "young male bear character" -> "friendly cartoon bear"
  [new RegExp(`\\byoung\\s+(?:male|female|boy|girl)\\s+(${ANIMAL_WORDS})(\\s+character)?`, "gi"), "friendly cartoon $1"],
  // template text written for humans, harmful on animals
  [/\bconsistent facial structure, body proportions, hair, clothing, and colors\b/gi, "consistent look and colors"],
  // physical-contact words -> neutral closeness
  [/\bgently and carefully embracing\b/gi, "standing close beside"],
  [/\b(?:embracing|hugging|cuddling|snuggling)\b/gi, "standing close beside"],
  [/\bshare(?:s|d)? a (?:gentle |warm |big )?(?:hug|cuddle)\b/gi, "share a happy moment"],
  [/\b(?:hug|hugs|cuddle|cuddles|embrace)\b/gi, "friendly moment"],
  [/\b(?:kiss|kisses|kissing)\b/gi, "smiling at"],
  [/\bkneeling down\b/gi, "bending down"],
  // harm-adjacent words
  [/\b(?:hurt|injured|wounded|bleeding|crying in pain)\b/gi, "tired"],
];

export const SAFETY_SUFFIX = {
  0: "Non-graphic, no blood, no gore, no wounds, no nudity. Suitable for a published storybook.",
  1: "Wholesome, family-friendly, all-ages children's picture-book illustration. Animal characters look like real animals with fur and animal proportions (no human features). Any human child is fully dressed in ordinary everyday clothes. Friendly, calm, cheerful mood.",
  2: "Wholesome, family-friendly, all-ages children's picture-book illustration. Cute cartoon animals or simple friendly characters only, seen at a distance in a calm outdoor scene, standing or walking side by side, smiling. Everyone is fully dressed. Nothing scary, nothing physical, nothing realistic.",
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

// Used by generateImagePrompt.js to build the Character Bible rule.
export const isAnimalOrObjectCharacter = (character = {}) =>
  /pet|object|animal/i.test(character.type || "") ||
  new RegExp(`\\b(${ANIMAL_WORDS})\\b`, "i").test(character.name || "");