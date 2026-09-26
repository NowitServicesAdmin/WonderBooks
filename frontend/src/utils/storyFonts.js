export const FONT_FAMILY_MAP = {
    "rounded & playful": '"Baloo 2", "Comic Sans MS", cursive',
    "classic storybook": 'Georgia, "Times New Roman", serif',
    "handwritten": '"Segoe Script", "Bradley Hand", cursive',
    "clean & modern": '"Poppins", "Helvetica Neue", Arial, sans-serif',
    "clean & simple": '"Poppins", "Helvetica Neue", Arial, sans-serif',
    "bubbly & bold": '"Fredoka One", "Baloo 2", cursive',
    "whimsical": '"Chewy", "Comic Sans MS", cursive',
    "elegant script": '"Dancing Script", "Segoe Script", cursive',
    "typewriter": '"Courier New", Courier, monospace'
};

export const DEFAULT_FONT_FAMILY = FONT_FAMILY_MAP["classic storybook"];

export const getStoryFontFamily = (font) => {
    const key = String(font || "").trim().toLowerCase();
    return FONT_FAMILY_MAP[key] || DEFAULT_FONT_FAMILY;
};

export const GOOGLE_FONTS_HREF =
    "https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700&family=Fredoka+One&family=Chewy&family=Dancing+Script:wght@400;600;700&family=Poppins:wght@400;600;700&display=swap";

const WEB_FONT_LOAD_NAMES = {
    "rounded & playful": ["Baloo 2"],
    "bubbly & bold": ["Fredoka One", "Baloo 2"],
    "whimsical": ["Chewy"],
    "elegant script": ["Dancing Script"],
    "clean & modern": ["Poppins"],
    "clean & simple": ["Poppins"]
};

export const getWebFontLoadNames = (font) => {
    const key = String(font || "").trim().toLowerCase();
    return WEB_FONT_LOAD_NAMES[key] || [];
};