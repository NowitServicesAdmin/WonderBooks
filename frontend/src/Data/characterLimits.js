// Reference characters allowed in ONE book (client rule):
//   up to 3 people + 1 pet/animal + 1 object = 5 in total.
// A pet or an object never uses up one of the 3 people slots.
// Used by both Manual mode and AI mode (mirrors Backend/config/characterLimits.js).
export const CHARACTER_LIMITS = { person: 3, pet: 1, object: 1 };
export const MAX_REFERENCE_CHARACTERS = 5;

// Manual mode types: "person" | "animal" | "object"
// AI mode types: "Child" | "Friend" | ... | "Pet" | "Object"
export const characterKind = (type) => {
    const t = String(type || "").toLowerCase();
    if (/pet|animal/.test(t)) return "pet";
    if (/object/.test(t)) return "object";
    return "person";
};

export const countByKind = (characters = []) => {
    const counts = { person: 0, pet: 0, object: 0 };
    (characters || []).forEach((c) => {
        counts[characterKind(c?.type)] += 1;
    });
    return counts;
};

export const canAddKind = (characters, kind) =>
    countByKind(characters)[kind] < CHARACTER_LIMITS[kind];