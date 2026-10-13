import { PRINT_OPTION_GROUPS, normalizePrintOptions } from "./printOptions.js";
const num = (name, fallback) => {
    const raw = process.env[name];
    if (raw === undefined || String(raw).trim() === "") return fallback;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
};

const PAPER_GSM = {
    normal: ["PAPER_GSM_NORMAL", 130],
    laminated: ["PAPER_GSM_LAMINATED", 170],
};
const PAPER_THICKNESS_MM = {
    normal: ["PAPER_THICKNESS_NORMAL_MM", 0.13],
    laminated: ["PAPER_THICKNESS_LAMINATED_MM", 0.17],
};
const COVER_GSM = {
    soft: ["COVER_WEIGHT_SOFT_GSM", 280],
    hard: ["COVER_WEIGHT_HARD_GSM", 1100],
};
const COVER_THICKNESS_MM = {
    soft: ["COVER_THICKNESS_SOFT_MM", 0.3],
    hard: ["COVER_THICKNESS_HARD_MM", 4],
};

const pick = (table, key) => {
    const [name, fallback] = table[key] || Object.values(table)[0];
    return num(name, fallback);
};

// One copy of one book
export const getCopySpec = ({ pageCount = 0, printOptions } = {}) => {
    const options = normalizePrintOptions(printOptions);
    const size = PRINT_OPTION_GROUPS.size.choices[options.size];
    const areaM2 = (size.widthMm * size.heightMm) / 1e6;

    const leaves = Math.max(0, Number(pageCount) || 0) + (options.dedication === "added" ? 0.5 : 0);

    const paperG = leaves * areaM2 * pick(PAPER_GSM, options.pages);
    const coverG = 2 * areaM2 * pick(COVER_GSM, options.cover);
    const giftG = options.giftWrap === "wrapped" ? num("GIFT_WRAP_WEIGHT_G", 40) : 0;

    const thicknessCm =
        (leaves * pick(PAPER_THICKNESS_MM, options.pages) + pick(COVER_THICKNESS_MM, options.cover)) / 10;

    return {
        weightG: paperG + coverG + giftG,
        thicknessCm,
        widthMm: size.widthMm,
        heightMm: size.heightMm,
    };
};

// Everything going out in one parcel: lines = [{ quantity, pageCount, printOptions }]
export const getParcelSpecForLines = (lines = []) => {
    let totalG = 0;
    let stackCm = 0;
    let maxWidthMm = 0;
    let maxHeightMm = 0;

    for (const line of lines) {
        const qty = Math.max(1, Math.floor(Number(line.quantity)) || 1);
        const copy = getCopySpec(line);
        totalG += copy.weightG * qty;
        stackCm += copy.thicknessCm * qty;
        maxWidthMm = Math.max(maxWidthMm, copy.widthMm);
        maxHeightMm = Math.max(maxHeightMm, copy.heightMm);
    }

    const buffer = 1 + num("WEIGHT_BUFFER_PERCENT", 5) / 100;
    const actualKg = Math.ceil(((totalG + num("PACKAGING_WEIGHT_G", 200)) * buffer) / 10) / 100; // up to 0.01 kg

    // the box is never smaller than the biggest book (+ padding), or the .env minimum
    const padding = num("SHIPPING_BOX_PADDING_CM", 2);
    const length = Math.ceil(Math.max(num("SHIPPING_BOX_LENGTH_CM", 28), maxHeightMm / 10 + padding));
    const breadth = Math.ceil(Math.max(num("SHIPPING_BOX_BREADTH_CM", 22), maxWidthMm / 10 + padding));
    const height = Math.max(3, Math.ceil(stackCm + padding));

    const volumetricKg = Math.ceil(((length * breadth * height) / 5000) * 100) / 100;

    return {
        weight: Math.max(actualKg, volumetricKg), // what we quote and ship with
        actualWeight: actualKg,
        volumetricWeight: volumetricKg,
        length,
        breadth,
        height,
    };
};
