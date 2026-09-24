/**
 * Print / PDF export for a stored book.
 *
 * Mirrors the on-screen book: every page becomes two A4 sheets, an illustration
 * sheet and a story-text sheet, starting with the cover (illustration + title).
 * The closing "The End" page is left out.
 */
import { getBookImageBlob } from "../services/bookService";

const RTL_LANGUAGES = new Set(["Arabic"]);
const NO_SPACE_LANGUAGES = new Set(["Chinese", "Japanese"]); // wrap between characters
const FONT_STACK = 'Georgia, "Noto Serif", "Times New Roman", serif';

const exportPages = (pages) => pages.filter((p) => p.kind !== "end");

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const safeFileName = (title) =>
  (
    String(title || "")
      .replace(/[\\/:*?"<>|]+/g, "")
      .trim() || "wonder-book"
  ).slice(0, 80);

/* ============================== PRINT ============================== */

const waitForImages = (doc) =>
  Promise.all(
    Array.from(doc.images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) return resolve();
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        }),
    ),
  );

export const printBook = async ({ title, pages, language }) => {
  const rtl = RTL_LANGUAGES.has(language);

  const body = exportPages(pages)
    .map((page) => {
      const image = page.image
        ? `<img src="${escapeHtml(page.image)}" alt="" />`
        : "";
      const text =
        page.kind === "cover"
          ? `<h1>${escapeHtml(page.heading)}</h1><p class="sub">${escapeHtml(page.sub)}</p>`
          : `<p class="story">${escapeHtml(page.text)}</p>`;
      return (
        `<section class="sheet"><div class="art">${image}</div></section>` +
        `<section class="sheet"><div class="copy">${text}</div></section>`
      );
    })
    .join("");

  const html = `<!doctype html>
<html dir="${rtl ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  /* margin 0 also removes the browser's own header/footer (date, URL, page numbers) */
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: ${FONT_STACK}; color: #3c3860; }
  .sheet { width: 210mm; height: 296mm; padding: 14mm; break-after: page; page-break-after: always; overflow: hidden; }
  .sheet:last-child { break-after: auto; page-break-after: auto; }
  .art { width: 100%; height: 100%; overflow: hidden; border-radius: 8mm; background: #f5f2ff; }
  .art img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .copy { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 8mm; }
  .story { margin: 0; font-size: 22pt; line-height: 1.55; }
  h1 { margin: 0; font-size: 38pt; line-height: 1.2; color: #29254d; }
  .sub { margin: 5mm 0 0; font-size: 15pt; color: #9893a8; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style>
</head>
<body>${body}</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  doc.open();
  doc.write(html);
  doc.close();

  await waitForImages(doc);

  const cleanup = () => iframe.remove();
  iframe.contentWindow.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(cleanup, 5 * 60 * 1000); // safety net if afterprint never fires

  iframe.contentWindow.focus();
  iframe.contentWindow.print();
};

/* ============================== PDF ============================== */

const PDF_W = 1240; // A4 at 150 dpi
const PDF_H = 1754;
const MARGIN = 110;

// Images come through the API (not straight from the storage bucket) so no CORS setup is needed.
const loadBitmap = async (bookId, page) => {
  if (!page.image || page.imageKey == null) return null;
  try {
    return await createImageBitmap(await getBookImageBlob(bookId, page.imageKey));
  } catch {
    const error = new Error("IMAGE_FAILED");
    error.code = "IMAGE_FAILED";
    throw error;
  }
};

const wrapLines = (ctx, text, maxWidth, noSpaces) => {
  const tokens = noSpaces
    ? Array.from(text.replace(/\s+/g, ""))
    : text.split(/\s+/).filter(Boolean);
  const glue = noSpaces ? "" : " ";
  const lines = [];
  let line = "";
  for (const token of tokens) {
    const attempt = line ? line + glue + token : token;
    if (line && ctx.measureText(attempt).width > maxWidth) {
      lines.push(line);
      line = token;
    } else {
      line = attempt;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const newSheet = () => {
  const canvas = document.createElement("canvas");
  canvas.width = PDF_W;
  canvas.height = PDF_H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PDF_W, PDF_H);
  return { canvas, ctx };
};

// Illustration sheet: the picture fills the page inside the margin, corners rounded.
const renderImageSheet = (bitmap) => {
  const { canvas, ctx } = newSheet();
  const x = MARGIN / 2;
  const y = MARGIN / 2;
  const w = PDF_W - MARGIN;
  const h = PDF_H - MARGIN;

  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 50);
  else ctx.rect(x, y, w, h);
  ctx.clip();
  if (bitmap) {
    const scale = Math.max(w / bitmap.width, h / bitmap.height);
    const sw = w / scale;
    const sh = h / scale;
    ctx.drawImage(
      bitmap,
      (bitmap.width - sw) / 2,
      (bitmap.height - sh) / 2,
      sw,
      sh,
      x,
      y,
      w,
      h,
    );
  } else {
    ctx.fillStyle = "#f5f2ff";
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
  return canvas;
};

// Text sheet: cover title, or the story text at the largest size that fits.
const renderTextSheet = (page, { rtl, noSpaces }) => {
  const { canvas, ctx } = newSheet();
  const boxW = PDF_W - MARGIN * 2;
  const boxH = PDF_H - MARGIN * 2;

  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  if (page.kind === "cover") {
    ctx.fillStyle = "#29254d";
    ctx.font = `bold 84px ${FONT_STACK}`;
    const lines = wrapLines(ctx, page.heading || "", boxW, noSpaces);
    const gap = 30;
    const totalH = lines.length * 104 + gap + 44;
    let y = MARGIN + Math.max(0, (boxH - totalH) / 2);
    lines.forEach((line) => {
      ctx.fillText(line, PDF_W / 2, y);
      y += 104;
    });
    ctx.fillStyle = "#9893a8";
    ctx.font = `40px ${FONT_STACK}`;
    ctx.fillText(page.sub || "", PDF_W / 2, y + gap);
    return canvas;
  }

  ctx.fillStyle = "#3c3860";
  let size = 56;
  let lines = [];
  for (; size >= 18; size -= 2) {
    ctx.font = `${size}px ${FONT_STACK}`;
    lines = wrapLines(ctx, page.text || "", boxW, noSpaces);
    if (lines.length * size * 1.55 <= boxH) break;
  }
  const lineH = size * 1.55;
  let y = MARGIN + Math.max(0, (boxH - lines.length * lineH) / 2);
  lines.forEach((line) => {
    ctx.fillText(line, PDF_W / 2, y);
    y += lineH;
  });
  return canvas;
};

export const downloadBookPdf = async ({ bookId, title, pages, language }) => {
  const list = exportPages(pages);
  const opts = {
    rtl: RTL_LANGUAGES.has(language),
    noSpaces: NO_SPACE_LANGUAGES.has(language),
  };

  const [{ jsPDF }, bitmaps] = await Promise.all([
    import("jspdf"),
    Promise.all(list.map((p) => loadBitmap(bookId, p))),
  ]);

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  pdf.setProperties({ title: title || "Wonder Book" });

  let first = true;
  const addSheet = (canvas) => {
    if (!first) pdf.addPage();
    first = false;
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.92),
      "JPEG",
      0,
      0,
      210,
      297,
      undefined,
      "FAST",
    );
  };

  list.forEach((page, index) => {
    addSheet(renderImageSheet(bitmaps[index]));
    addSheet(renderTextSheet(page, opts));
  });

  pdf.save(`${safeFileName(title)}.pdf`);
};
