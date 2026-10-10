import OpenAI from "openai";
import sharp from "sharp";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Set IMAGE_VERIFY=off in .env to switch the check off.
const ENABLED =
  String(process.env.IMAGE_VERIFY || "on").toLowerCase() !== "off";
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
        width: 768,
        height: 768,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 75 })
      .toBuffer();

    const names = characterNames.filter(Boolean);

    const response = await client.chat.completions.create({
      model: VERIFY_MODEL,
      temperature: 0,
      max_tokens: 120,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are checking one illustration for a children's picture book.

Expected scene: ${String(scene).slice(0, 450) || "(not given)"}
Expected characters: ${names.length ? names.join(", ") : "(none specified)"}
(Each expected character is a person, an animal or an object, exactly as described in its brackets. An animal or object character IS a valid character: judge whether it is present by that description and never require a human child. Do NOT judge hair color, fur color, clothes, age or exact likeness: those can differ slightly and are fine. Only check that each character is there.)

Choose ONE verdict:
- "unrelated": it is not a storybook-style illustration (a photo, a sign, an icon, a logo, a poster, a diagram, food, an object on its own) OR it shows a subject that has nothing to do with the expected scene.
- "missing": it is a fine storybook illustration of roughly the right scene, but one or more of the expected characters is clearly not in the picture at all. Choose this ONLY if you cannot find a named character anywhere in the picture. Where a character stands (inside or outside, left or right, next to whom) never matters.
- "ok": everything else. Be lenient: do NOT reject for exact pose, glow, lighting, expression, clothes, small details, or art style. Only the presence of each expected character matters.

Reply with JSON only: {"verdict": "ok" | "missing" | "unrelated", "reason": "short reason"}`,
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

    const parsed = JSON.parse(response?.choices?.[0]?.message?.content || "{}");
    const verdict = ["ok", "missing", "unrelated"].includes(parsed.verdict)
      ? parsed.verdict
      : "ok";

    return {
      ok: verdict === "ok",
      severity: verdict === "ok" ? "none" : verdict,
      reason: String(parsed.reason || ""),
    };
  } catch (error) {
    console.warn(
      `Image verification (${label}) skipped:`,
      error?.message || error,
    );
    return { ok: true, severity: "none", reason: "verification unavailable" };
  }
};
