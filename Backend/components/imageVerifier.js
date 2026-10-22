import OpenAI from "openai";
import sharp from "sharp";
import { recordTokenUsage } from "../services/tokenUsage.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Set IMAGE_VERIFY=off in .env to switch the check off.
const ENABLED =
  String(process.env.IMAGE_VERIFY || "on").toLowerCase() !== "off";
// Big enough that a small prop (a pencil, a key) is still findable. 768 was
// too small: the checker kept "not seeing" objects that were in the picture.
const VERIFY_SIZE = Math.max(
  512,
  Number(process.env.IMAGE_VERIFY_SIZE) || 1024,
);
const VERIFY_MODEL =
  process.env.IMAGE_VERIFY_MODEL || process.env.CHAT_MODEL || "gpt-4.1-mini";

/**
 * Cheap sanity check that a generated picture really is the storybook
 * illustration we asked for - not a random stock picture, a warning sign, a
 * photo of food, an empty scene, etc.
 *
 * It deliberately fails OPEN: if the check itself errors (network, quota) the
 * image is accepted, so this can never block a book by itself.
 *
 * @returns {Promise<{ok: boolean, severity: "none"|"missing"|"unrelated", reason: string}>}
 *   severity "unrelated" = wrong kind of picture (sign, food, random scene): never use it.
 *   severity "missing"   = right kind of picture but a character is absent: usable as a last resort.
 */
export const verifyIllustration = async ({
  buffer,
  scene = "",
  characterNames = [],
  label = "image",
}) => {
  if (!ENABLED || !buffer?.length) {
    return { ok: true, severity: "none", reason: "verification skipped" };
  }

  try {
    const small = await sharp(buffer)
      .resize({
        width: VERIFY_SIZE,
        height: VERIFY_SIZE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 75 })
      .toBuffer();

    const names = characterNames.filter(Boolean);

    const response = await client.chat.completions.create({
      model: VERIFY_MODEL,
      temperature: 0,
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are checking one illustration for a children's picture book. Answer only two questions.

QUESTION 1 - is it a storybook-style illustration at all?
"unrelated" = true ONLY if it is a photo, a sign, an icon, a logo, a poster, a diagram, food, an object on its own, or a subject that has nothing to do with the expected place. Otherwise false.
Expected place (context only, never a reason to reject): ${String(scene).slice(0, 300) || "(not given)"}

QUESTION 2 - for EACH expected character below, is it anywhere in the picture?
${names.length ? names.map((n, i) => `${i + 1}. ${n}`).join("\n") : "(none specified)"}

How to answer question 2:
- FIRST count what you can see: how many people, how many animals, how many objects. Several people may be in the picture and they look different from each other: use the "look" note in the brackets (hair, clothes, fur) only to tell which one is which. If the picture has as many people as the list has people, every person is present.
- The words in brackets say WHAT KIND of thing each one is (a person, an animal or an object). The NAME is only a label: a name may sound like a breed, a place or an ordinary word, so ignore what the name sounds like and look for that KIND of thing.
- An animal or object IS a valid character: never require a human child.
- It counts as present if any part of it is visible: small, partly hidden, held in a hand, glowing, in the background or at the edge. An object may have any colour, size or pattern.
- Mark "present": false ONLY if you truly cannot find it anywhere.
- NEVER judge breed, colours, size, clothes, age, likeness, pose, expression, setting, weather, camera distance, art style, extra objects or story events. None of those matter.

Reply with JSON only:
{"unrelated": false, "reason": "short reason if unrelated", "characters": [{"name": "<name>", "present": true}]}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${small.toString("base64")}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    recordTokenUsage("Image verification", response?.usage);

    const parsed = JSON.parse(response?.choices?.[0]?.message?.content || "{}");

    // The CODE decides the verdict from the per-character answers, so a
    // comment about the setting, a breed or the camera can never reject a
    // picture by itself. A character is only "missing" if the checker says
    // present === false for it.
    const absent = (Array.isArray(parsed.characters) ? parsed.characters : [])
      .filter((c) => c && c.present === false)
      .map((c) => String(c.name || "").trim())
      .filter(Boolean);

    let verdict = "ok";
    let reason = "";

    if (parsed.unrelated === true) {
      verdict = "unrelated";
      reason = String(parsed.reason || "not a storybook illustration of the scene");
    } else if (absent.length) {
      verdict = "missing";
      reason = `${absent.join(", ")} not found in the picture`;
    }

    return {
      ok: verdict === "ok",
      severity: verdict === "ok" ? "none" : verdict,
      reason,
      missingCount: absent.length,
    };
  } catch (error) {
    console.warn(
      `Image verification (${label}) skipped:`,
      error?.message || error,
    );
    return { ok: true, severity: "none", reason: "verification unavailable" };
  }
};