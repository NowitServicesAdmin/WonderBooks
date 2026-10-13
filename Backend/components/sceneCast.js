import { inferCharacterKind } from "./promptSafety.js";

const escapeRegExp = (value = "") =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// True when the character is written in the text. The saved name can be longer
// than the name the story uses ("Leo Maxwell" in the character form, "Leo" in the
// story), so the full name AND the first name both count.
export const isNamedIn = (text = "", character = {}) => {
    const full = String(character?.name || "").trim();
    if (!full) return false;
    const first = full.split(/\s+/)[0];
    const candidates = [full, first].filter((n) => n && n.length >= 2);
    const body = String(text);
    return candidates.some((n) =>
        new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(n)}(?=$|[^\\p{L}\\p{N}])`, "iu").test(body),
    );
};

const findIn = (characters = [], lookup) => {
    const value = String(lookup?.name || lookup?.id || lookup || "")
        .trim()
        .toLowerCase();
    if (!value) return null;
    return (
        characters.find(
            (c) =>
                String(c?.id || "").trim().toLowerCase() === value ||
                String(c?.name || "").trim().toLowerCase() === value,
        ) || null
    );
};

const kindRank = (character) => {
    const { kind } = inferCharacterKind(character);
    return kind === "person" ? 0 : kind === "animal" ? 1 : 2;
};

/**
 * WHO is drawn on one page.
 *
 * The image-prompt model (Gemini) used to decide this alone, and it often left
 * out a character the page text names (page text: "Leo, Swathi, Kali and Silly
 * hold Umbrella" -> picture without Kali). So the CODE now guarantees:
 *   1. every character whose name is written in the page text is in the picture,
 *   2. characters the model added (for "they", "everyone", "the friends") stay,
 *   3. if there are more than `max`, named characters win over the model's extras,
 *      and people win over the pet, and the pet over the object.
 * The result keeps the roster order (hero first) so the order is the same on
 * every page.
 */
export const pickPageCast = ({
    characters = [],
    pageText = "",
    modelList = [],
    max = 5,
}) => {
    const fromModel = [];
    for (const entry of Array.isArray(modelList) ? modelList : []) {
        const match = findIn(characters, entry);
        if (match && !fromModel.includes(match)) fromModel.push(match);
    }

    const named = characters.filter((c) => isNamedIn(pageText, c));
    const extras = fromModel.filter((c) => !named.includes(c));

    const byPriority = (a, b) => kindRank(a) - kindRank(b);
    const chosen = [
        ...[...named].sort(byPriority),
        ...[...extras].sort(byPriority),
    ].slice(0, Math.max(1, max));

    return characters.filter((c) => chosen.includes(c));
};


export const orderReferencesForCall = (refs = []) => {
    const rank = (ref) => {
        const type = String(ref?.characterType || "");
        if (/object/i.test(type)) return 2;
        if (/pet|animal/i.test(type)) return 1;
        return 0;
    };
    return refs
        .map((ref, index) => ({ ref, index }))
        .sort((a, b) => rank(a.ref) - rank(b.ref) || a.index - b.index)
        .map(({ ref }) => ref);
};