import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const OUT = join(SRC, "theme", "dark.generated.css");

const PALETTE = {
  neutralHue: 258, // hue used for white / grey surfaces (soft violet)
  surface: 0.13, // what `white` becomes
  textReference: "#26203f", // background text must stay readable on (WCAG 4.5:1)
};

/* Files whose *inline styles* are left alone (they stay light in dark mode). */
const SKIP_INLINE_FILES = ["WonderAlertModal.jsx", "Auth.jsx"];

/* Anything inside these stays light: the paper book, the login page, alert modals. */
const KEEP_LIGHT = [".wb-keep-light", ".wonder-alert-overlay"];
const NOT_KEEP = `:not(${KEEP_LIGHT.flatMap((c) => [c, `${c} *`]).join(", ")})`;

/* ------------------------------------------------------------------ *
 *  Colour maths
 * ------------------------------------------------------------------ */
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
const rgbToHex = ([r, g, b]) =>
  "#" + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h, s, l };
}

function hslToRgb({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function luminance([r, g, b]) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/* oklch() -> hex, so Tailwind's own palette (red-50, gray-100 ...) can be read from its theme.css */
function oklchToHex(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const enc = (v) => {
    v = clamp(v, 0, 1);
    return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
  };
  return rgbToHex(lin.map(enc));
}

function loadTailwindPalette() {
  const map = { white: "#ffffff", black: "#000000" };
  const file = join(ROOT, "node_modules", "tailwindcss", "theme.css");
  if (!existsSync(file)) return map;
  const css = readFileSync(file, "utf8");
  const re = /--color-([a-z]+-\d{2,3}):\s*oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)/g;
  let m;
  while ((m = re.exec(css))) {
    const L = parseFloat(m[2]);
    map[m[1]] = oklchToHex(L > 1 ? L / 100 : L, parseFloat(m[3]), parseFloat(m[4]));
  }
  return map;
}
const TW = loadTailwindPalette();

/* ------------------------------------------------------------------ *
 *  Light -> dark mapping, per role
 *  returns a hex string, or null when the colour should stay as it is.
 * ------------------------------------------------------------------ */
const isNeutral = (hsl) => hsl.s < 0.12;
const out = (hue, s, l) => rgbToHex(hslToRgb({ h: hue, s: clamp(s, 0, 1), l: clamp(l, 0, 1) }));

function darkBackground(hex) {
  const hsl = rgbToHsl(hexToRgb(hex));
  if (hsl.l < 0.6) return null; // brand purples, navy, strong accents keep their colour
  const neutral = isNeutral(hsl) || hsl.l > 0.985;
  const l = Math.min(0.46, PALETTE.surface + (1 - hsl.l) * 1.05);
  const s = neutral ? 0.25 : Math.min(hsl.s, 0.45) * (l < 0.3 ? 0.7 : 0.55);
  return out(neutral ? PALETTE.neutralHue : hsl.h, s, l);
}

function darkText(hex) {
  const hsl = rgbToHsl(hexToRgb(hex));
  if (hsl.l >= 0.8) return null; // already light: white text on buttons etc.
  const neutral = isNeutral(hsl);
  const hue = neutral ? PALETTE.neutralHue : hsl.h;
  const ref = hexToRgb(PALETTE.textReference);
  // darkest ink -> near white, mid greys -> soft grey-violet
  let l = clamp(1.026 - hsl.l * 0.735, 0.5, 0.95);
  if (!neutral && hsl.s > 0.4 && hsl.l >= 0.3) l = Math.min(l, 0.7); // vivid mid-tones: readable but still colourful
  // dark 'ink' colours become near-white with only a hint of tint; vivid mid-tones (red, green, brand purple) stay colourful
  const ink = hsl.l < 0.3;
  const satFor = () => (neutral ? 0.18 : ink ? Math.min(hsl.s, 0.6) * 0.45 : Math.min(hsl.s, 0.85) * 0.85);
  let rgb = hslToRgb({ h: hue, s: satFor(), l });
  while (contrast(rgb, ref) < 4.6 && l < 0.93) {
    l += 0.01;
    rgb = hslToRgb({ h: hue, s: satFor(), l });
  }
  return rgbToHex(rgb);
}

function darkBorder(hex) {
  const hsl = rgbToHsl(hexToRgb(hex));
  if (hsl.l < 0.55) return null;
  if (hsl.s >= 0.8 && hsl.l < 0.9) return out(hsl.h, 0.55, 0.52); // vivid accent borders stay visible
  const neutral = isNeutral(hsl) || hsl.l > 0.985;
  const l = clamp(0.16 + (1 - hsl.l) * 1.1, 0.2, 0.36);
  return out(neutral ? PALETTE.neutralHue : hsl.h, neutral ? 0.22 : Math.min(hsl.s, 0.3), l);
}

/* ------------------------------------------------------------------ *
 *  Utility table
 * ------------------------------------------------------------------ */
const SIDES = { t: ["border-top-color"], b: ["border-bottom-color"], l: ["border-left-color"], r: ["border-right-color"],
  x: ["border-left-color", "border-right-color"], y: ["border-top-color", "border-bottom-color"],
  s: ["border-inline-start-color"], e: ["border-inline-end-color"] };

function utilityInfo(prefix) {
  if (prefix === "bg") return { props: ["background-color"], map: darkBackground };
  if (prefix === "from") return { props: ["--tw-gradient-from"], map: darkBackground };
  if (prefix === "via") return { props: ["--tw-gradient-via"], map: darkBackground };
  if (prefix === "to") return { props: ["--tw-gradient-to"], map: darkBackground };
  if (prefix === "text") return { props: ["color"], map: darkText };
  if (prefix === "fill") return { props: ["fill"], map: darkText };
  if (prefix === "stroke") return { props: ["stroke"], map: darkText };
  if (prefix === "border") return { props: ["border-color"], map: darkBorder };
  if (prefix.startsWith("border-")) return { props: SIDES[prefix.slice(7)], map: darkBorder };
  if (prefix === "ring") return { props: ["--tw-ring-color"], map: darkBorder };
  if (prefix === "outline") return { props: ["outline-color"], map: darkBorder };
  if (prefix === "divide") return { props: ["border-color"], map: darkBorder, divide: true };
  return null;
}

/* ------------------------------------------------------------------ *
 *  Variants
 * ------------------------------------------------------------------ */
const BREAKPOINTS = { sm: "40rem", md: "48rem", lg: "64rem", xl: "80rem", "2xl": "96rem" };
const PSEUDO = {
  hover: { pseudo: ":hover", rank: 20 },
  focus: { pseudo: ":focus", rank: 40 },
  "focus-within": { pseudo: ":focus-within", rank: 30 },
  "focus-visible": { pseudo: ":focus-visible", rank: 50 },
  active: { pseudo: ":active", rank: 60 },
  disabled: { pseudo: ":disabled", rank: 70 },
  first: { pseudo: ":first-child", rank: 5 },
  last: { pseudo: ":last-child", rank: 5 },
  placeholder: { element: "::placeholder", rank: 3 },
  "group-hover": { group: ":hover", rank: 10 },
};

const cssEscape = (s) => s.replace(/[^a-zA-Z0-9_-]/g, (c) => "\\" + c);

/* ------------------------------------------------------------------ *
 *  Scan sources
 * ------------------------------------------------------------------ */
function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "theme" || name === "assets") continue;
      walk(full, files);
    } else if (/\.(jsx?|tsx?)$/.test(name)) files.push(full);
  }
  return files;
}

const COLOR = String.raw`(?:\[#[0-9a-fA-F]{3,8}\]|white|black|[a-z]+-\d{2,3})`;
const TOKEN = new RegExp(
  String.raw`(?<=^|[\s"'\`{])((?:[a-z0-9-]+:)*)(!?)(bg|text|border(?:-[tblrxyse])?|from|via|to|ring|outline|fill|stroke|divide)-(${COLOR})(?:\/(\d{1,3}|\[[\d.]+\]))?(?=$|[\s"'\`}])`,
  "g"
);

const files = walk(SRC);
const classTokens = new Map(); // full token -> parsed
const warnings = new Map();
const warn = (msg) => warnings.set(msg, (warnings.get(msg) || 0) + 1);
const inlineHex = new Set();

for (const file of files) {
  const text = readFileSync(file, "utf8");

  for (const m of text.matchAll(TOKEN)) {
    const [token, variantStr, important, prefix, value, alphaRaw] = m;
    if (classTokens.has(token)) continue;
    classTokens.set(token, { token, variantStr, important, prefix, value, alphaRaw });
  }

  if (!SKIP_INLINE_FILES.some((f) => file.endsWith(f))) {
    // hex colours written as plain strings (inline styles / style objects), not Tailwind [#hex] values
    for (const m of text.matchAll(/(?<![\[\w&])#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z])/g)) {
      inlineHex.add("#" + m[1].toLowerCase());
    }
  }
}

/* ------------------------------------------------------------------ *
 *  Build class rules
 * ------------------------------------------------------------------ */
const buckets = new Map(); // media -> [{rank, css}]
const addRule = (media, rank, css) => {
  if (!buckets.has(media)) buckets.set(media, []);
  buckets.get(media).push({ rank, css });
};

let classRules = 0;
for (const { token, variantStr, important, prefix, value, alphaRaw } of classTokens.values()) {
  const info = utilityInfo(prefix);
  if (!info) continue;

  // resolve the colour
  let hex;
  if (value.startsWith("[")) hex = value.slice(1, -1).toLowerCase();
  else if (TW[value]) hex = TW[value];
  else { warn(`unknown colour "${value}" (skipped)`); continue; }
  if (hex.length === 5 || hex.length === 9) hex = hex.slice(0, -(hex.length === 5 ? 1 : 2)); // drop hex alpha
  if (hex.length === 4) hex = "#" + [...hex.slice(1)].map((c) => c + c).join("");

  const dark = info.map(hex);
  if (!dark) continue;

  let alpha = null;
  if (alphaRaw) alpha = alphaRaw.startsWith("[") ? parseFloat(alphaRaw.slice(1, -1)) : parseInt(alphaRaw, 10) / 100;
  const color = alpha == null || alpha >= 1
    ? dark
    : `rgb(${hexToRgb(dark).join(" ")} / ${+alpha.toFixed(3)})`;

  // variants
  const variants = variantStr ? variantStr.slice(0, -1).split(":") : [];
  let media = null, pseudos = "", element = "", groupPrefix = "", rank = 0, skip = false;
  for (const v of variants) {
    if (BREAKPOINTS[v]) media = BREAKPOINTS[v];
    else if (PSEUDO[v]) {
      const p = PSEUDO[v];
      if (p.pseudo) pseudos += p.pseudo;
      if (p.element) element = p.element;
      if (p.group) groupPrefix = `.group${p.group} `;
      rank += p.rank;
    } else { warn(`variant "${v}:" is not supported (skipped)`); skip = true; }
  }
  if (skip) continue;

  const cls = `.${cssEscape(token)}`;
  const decl = info.props.map((p) => `${p}:${color}${important ? " !important" : ""}`).join(";");
  const selector = info.divide
    ? `html.dark ${groupPrefix}${cls} > :not(:last-child)${pseudos}${NOT_KEEP}`
    : `html.dark ${groupPrefix}${cls}${pseudos}${NOT_KEEP}${element}`;
  addRule(media, rank, `${selector}{${decl}}`);
  classRules++;
}

/* ------------------------------------------------------------------ *
 *  Build inline-style rules (style="color: rgb(...)")
 *  Browsers serialise inline colours as rgb(r, g, b), so that is what we match.
 * ------------------------------------------------------------------ */
const inlineRules = [];
const INLINE_PROPS = [
  { css: "background-color", match: ["background-color", "background"], map: darkBackground },
  { css: "color", match: ["color"], map: darkText },
  { css: "border-color", match: ["border-color"], map: darkBorder },
];
for (const hex of [...inlineHex].sort()) {
  const rgbStr = hexToRgb(hex.length === 4 ? "#" + [...hex.slice(1)].map((c) => c + c).join("") : hex).join(", ");
  for (const { css, match, map } of INLINE_PROPS) {
    const dark = map(hex.length === 4 ? "#" + [...hex.slice(1)].map((c) => c + c).join("") : hex);
    if (!dark) continue;
    const sels = match.flatMap((prop) => [
      `[style^="${prop}: rgb(${rgbStr})"]`,
      `[style*="; ${prop}: rgb(${rgbStr})"]`,
    ]);
    inlineRules.push(`html.dark :is(${sels.join(", ")})${NOT_KEEP}{${css}:${dark} !important}`);
  }
}

/* ------------------------------------------------------------------ *
 *  Write
 * ------------------------------------------------------------------ */
const order = [null, ...Object.values(BREAKPOINTS)];
const chunks = [];
for (const media of order) {
  const rules = (buckets.get(media) || []).sort((a, b) => a.rank - b.rank).map((r) => r.css);
  if (!rules.length) continue;
  chunks.push(media ? `@media (min-width:${media}){\n${rules.join("\n")}\n}` : rules.join("\n"));
}

const banner = `/* AUTO-GENERATED by scripts/generate-dark-theme.mjs - do not edit by hand.
 * ${classRules} class overrides + ${inlineRules.length} inline-style overrides.
 * Regenerate with: npm run theme
 * Hand-written dark styles live in dark.css */\n`;

writeFileSync(OUT, `${banner}\n/* ---- Tailwind colour classes ---- */\n${chunks.join("\n")}\n\n/* ---- Inline style colours ---- */\n${inlineRules.join("\n")}\n`);

console.log(`[dark-theme] ${classRules} class rules, ${inlineRules.length} inline rules -> ${relative(ROOT, OUT)}`);
for (const [msg, n] of warnings) console.log(`[dark-theme] warning: ${msg} x${n}`);
