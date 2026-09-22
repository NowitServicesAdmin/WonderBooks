import sharp from "sharp";

// Escapes special XML characters so titles with & < > etc. don't break the SVG.
const escapeXml = (text = "") =>
    text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

/**
 * Composites the book title as real, crisp text onto a generated
 * cover image (which was intentionally generated WITHOUT any text,
 * since AI image models render text unreliably).
 *
 * @param {Buffer} coverBuffer - the raw generated cover image
 * @param {string} title - the book title to render
 * @param {Object} [options]
 * @param {string} [options.fontFamily] - CSS-style font family, e.g. from your font selector
 * @param {string} [options.textColor] - hex color for the title text
 * @param {string} [options.strokeColor] - hex color for the text outline (improves legibility over busy art)
 * @returns {Promise<Buffer>} the final cover image with title text baked in
 */
export const overlayTitleOnCover = async (
    coverBuffer,
    title,
    {
        fontFamily = "Baloo 2, Comic Sans MS, cursive",
        textColor = "#ffffff",
        strokeColor = "#3a2a55"
    } = {}
) => {
    const metadata = await sharp(coverBuffer).metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1536;

    const safeTitle = escapeXml(title || "Untitled Story");

    // Font size scales with image width so this works across
    // different output resolutions (1024x1536, 1024x1024, etc.)
    const fontSize = Math.round(width * 0.09);
    const yPosition = Math.round(height * 0.16); // upper third, matching the prompt's reserved space

    const svgOverlay = `
        <svg width="${width}" height="${height}">
            <style>
                .title {
                    font-family: ${fontFamily};
                    font-size: ${fontSize}px;
                    font-weight: 700;
                    fill: ${textColor};
                    stroke: ${strokeColor};
                    stroke-width: ${Math.max(2, Math.round(fontSize * 0.05))}px;
                    paint-order: stroke;
                    text-anchor: middle;
                }
            </style>
            <text x="50%" y="${yPosition}" class="title">${safeTitle}</text>
        </svg>
    `;

    const finalBuffer = await sharp(coverBuffer)
        .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
        .png()
        .toBuffer();

    return finalBuffer;
};