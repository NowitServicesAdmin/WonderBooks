// Reference characters allowed in ONE book (client rule):
//   up to 3 people + 1 pet + 1 object = 5 in total.
// A pet or an object never uses up one of the 3 people slots, even when
// the user supplies them. Same rule for manual and AI mode.
export const CHARACTER_LIMITS = { person: 3, pet: 1, object: 1 };
export const MAX_REFERENCE_CHARACTERS = 5;

// Manual mode sends type "person" | "animal" | "object".
// AI mode uses "Child" | "Parent" | ... | "Pet" | "Object".
export const characterKind = (type) => {
    const t = String(type || "").toLowerCase();
    if (/pet|animal/.test(t)) return "pet";
    if (/object/.test(t)) return "object";
    return "person";
};

export const countByKind = (characters = []) => {
    const counts = { person: 0, pet: 0, object: 0 };
    for (const c of characters || []) counts[characterKind(c?.type)] += 1;
    return counts;
};

// First `limit` of each kind survive, original order kept (hero stays first).
export const limitCharacters = (characters = []) => {
    const used = { person: 0, pet: 0, object: 0 };
    return (characters || []).filter((c) => {
        const kind = characterKind(c?.type);
        if (used[kind] >= CHARACTER_LIMITS[kind]) return false;
        used[kind] += 1;
        return true;
    });
};

export const exceedsCharacterLimits = (characters = []) => {
    const counts = countByKind(characters);
    return Object.keys(CHARACTER_LIMITS).some((k) => counts[k] > CHARACTER_LIMITS[k]);
};

export const CHARACTER_LIMIT_MESSAGE =
    "A book can have up to 3 characters, 1 pet and 1 object.";