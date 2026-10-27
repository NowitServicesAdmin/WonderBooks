import {User} from "../models/user.js";

const clean = (v) => (typeof v === "string" ? v.trim() : "");

// Returns null when child mode is off or there is nothing to use.
export const getChildProfile = async (userId) => {
    const user = await User.findById(userId)
        .select("childMode ageGroup chid_fav_chars about_child")
        .lean();

    if (!user) return null;
    console.log(user,"user triggered @j in child ")

    // Same rule as Settings: "on" only counts when a PIN exists.
    const cm = user.childMode;
    const enabled =
        cm && typeof cm === "object" ? Boolean(cm.enabled && cm.hasPin) : false;
    if (!enabled) return null;

    const favoriteCharacters = Array.isArray(user.chid_fav_chars)
        ? user.chid_fav_chars.map(clean).filter(Boolean)
        : [];
    const about = clean(user.about_child);

    if (!favoriteCharacters.length && !about) return null;

    return { ageGroup: clean(user.ageGroup), favoriteCharacters, about };
};

// Text block for the story prompt and the image-prompt writer.
export const childContextText = (profile) => {
    if (!profile) return "";

    const lines = [];
    if (profile.favoriteCharacters?.length) {
        lines.push(
            `- Favorite kinds of characters: ${profile.favoriteCharacters.join(", ")}.`
        );
    }
    if (profile.about) {
        lines.push(`- About the child (interests / theme): ${profile.about}`);
    }

    return `
==================================================
CHILD READER PROFILE (personalise the book with this)
==================================================
${lines.join("\n")}

How to use it:
- Weave the favorite character kinds into the story as friendly characters or a clear theme (for example "Princess" = a kind princess or a royal setting appears). They are themes, not new main characters: never replace or rename the characters the parent chose.
- Weave the interests from "about the child" into the setting, objects or events (for example "Loves roses" = a rose garden, a rose as a gift or a clue).
- This must appear on several pages, not just one, and must fit the story idea naturally.
- Never name or describe the real child, and never state the child's age in the text.
`;
};