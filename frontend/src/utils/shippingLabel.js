import logo from "../assets/wonder-books/wonderbook-logo.png";
import { code128Svg } from "./code128";
import { formatDate } from "./adminFormat";
import { displayPhone } from "./phone";

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const MAX_ITEMS_SHOWN = 2;

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

const buildLabelHtml = (order) => {
    const a = order.shippingAddress || {};
    const parcel = order.parcel || { items: [], copies: order.quantity || 1 };
    const sender = order.sender || { name: "Wonder Books" };
    const awb = order.shipping?.awbCode || "";
    const courier = order.shipping?.courier || "";

    // scan code: the courier AWB when there is one, otherwise our order number
    const scanValue = awb || order.orderNumber;
    const barcode = code128Svg(scanValue);

    const orderNumbers = (parcel.items.length ? parcel.items : [{ orderNumber: order.orderNumber }])
        .map((item) => item.orderNumber)
        .filter(Boolean);

    // first order number on one line; the rest are summarised next to the date
    const extraOrders = orderNumbers.length - 1;
    const orderSub = [extraOrders > 0 ? `+${extraOrders} more` : "", formatDate(order.createdAt)]
        .filter(Boolean)
        .join(" · ");

    const shownItems = parcel.items.slice(0, MAX_ITEMS_SHOWN);
    const hiddenItems = parcel.items.length - shownItems.length;

    const itemRows = shownItems
        .map((item) => {
            const spec = [item.coverLabel, item.pagesLabel, item.sizeLabel].filter(Boolean).join(" · ");
            return `<div class="item">
                <div class="item-top"><span class="item-title">${escapeHtml(item.title)}</span><span class="item-qty">× ${item.quantity}</span></div>
                <div class="item-spec">${escapeHtml(spec || "Standard format")}</div>
            </div>`;
        })
        .join("");

    const anyGiftWrap = parcel.items.some((item) => item.giftWrap);
    const anyDedication = parcel.items.some((item) => item.dedication);
    const tags = [
        anyGiftWrap && "Gift wrapped",
        parcel.hasGiftMessage && "Gift note inside",
        anyDedication && "Dedication page",
    ].filter(Boolean);

    const dims =
        parcel.length && parcel.breadth && parcel.height
            ? `${parcel.length} × ${parcel.breadth} × ${parcel.height} cm`
            : "—";
    const weight = parcel.weight ? `${parcel.weight} kg` : "—";
    const payment = String(parcel.paymentMode || "Prepaid");
    const prepaid = /prepaid/i.test(payment);

    const addressLines = [
        [a.line1, a.line2].filter(Boolean).join(", "),
        a.landmark ? `Landmark: ${a.landmark}` : "",
        [a.city, a.state].filter(Boolean).join(", "),
    ].filter(Boolean);
    const foreign = a.country && !/^india$/i.test(a.country);

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Label ${escapeHtml(order.orderNumber)}</title>
<style>
  @page { size: 100mm 150mm; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body {
    width: 100mm; height: 150mm; padding: 2mm;
    font-family: "Segoe UI", "Noto Sans", "Noto Sans Telugu", "Noto Sans Devanagari", Arial, sans-serif;
    color: #000; font-size: 8.5pt; line-height: 1.25;
  }
  .label { width: 100%; height: 100%; border: 0.5mm solid #000; display: flex; flex-direction: column; overflow: hidden; }

  .head, .to, .scan, .grid, .foot { flex: none; }
  .head { display: flex; align-items: center; gap: 2.5mm; padding: 1.5mm 3mm; border-bottom: 0.5mm solid #000; }
  .head img { width: 11mm; height: 11mm; object-fit: contain; }
  .brand { flex: 1; min-width: 0; }
  .brand b { display: block; font-size: 15pt; letter-spacing: 0.2pt; line-height: 1.1; }
  .brand span { font-size: 7pt; color: #333; }
  .badge { text-align: right; font-size: 7pt; line-height: 1.2; }
  .badge strong { display: inline-block; padding: 0.8mm 2mm; border: 0.4mm solid #000; font-size: 9pt; letter-spacing: 0.5pt; }
  .badge.cod strong { background: #000; color: #fff; }

  .to { padding: 2mm 3mm 2.5mm; border-bottom: 0.5mm solid #000; }
  .tag { font-size: 6.5pt; font-weight: 700; letter-spacing: 1pt; color: #444; text-transform: uppercase; }
  .to .name { font-size: 12.5pt; font-weight: 700; line-height: 1.15; margin-top: 0.5mm; }
  .to .addr { font-size: 9pt; margin-top: 0.8mm; }
  .pin-row { display: flex; align-items: center; justify-content: space-between; gap: 3mm; margin-top: 1.8mm; }
  .pin { font-size: 15pt; font-weight: 800; letter-spacing: 1.5pt; border: 0.5mm solid #000; padding: 0.2mm 2.5mm; line-height: 1.2; }
  .phone { font-size: 10.5pt; font-weight: 700; }

  .scan { padding: 1.5mm 3mm 1mm; border-bottom: 0.5mm solid #000; text-align: center; }
  .scan .bars { height: 11mm; }
  .scan .bars svg { width: 100%; height: 100%; display: block; }
  .scan .code { font-family: "Consolas", "Courier New", monospace; font-size: 9.5pt; font-weight: 700; letter-spacing: 1.5pt; margin-top: 0.6mm; }
  .scan .code small { font-family: inherit; font-size: 6.5pt; font-weight: 400; letter-spacing: 0; color: #444; }

  .grid { display: flex; border-bottom: 0.5mm solid #000; }
  .cell:nth-child(1) { flex: 1.2 1 0; }
  .cell:nth-child(2) { flex: 1 1 0; }
  .cell:nth-child(3) { flex: 0.8 1 0; }
  .cell { padding: 1mm 2.5mm; border-right: 0.3mm solid #999; min-width: 0; }
  .cell:last-child { border-right: 0; }
  .cell b { display: block; font-size: 8pt; overflow-wrap: anywhere; }
  .cell small { display: block; font-size: 7pt; color: #333; }

  .contents { padding: 1.5mm 3mm; flex: 1; min-height: 0; overflow: hidden; }
  .item { margin-top: 1mm; }
  .item-top { display: flex; justify-content: space-between; gap: 2mm; font-weight: 700; font-size: 9pt; }
  .item-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .item-qty { flex: none; }
  .item-spec { font-size: 7.5pt; color: #333; }
  .more { margin-top: 1mm; font-size: 7.5pt; font-style: italic; }
  .chips { display: flex; flex-wrap: wrap; gap: 1.2mm; margin-top: 1.8mm; }
  .chip { border: 0.3mm solid #000; padding: 0.4mm 1.8mm; font-size: 7pt; font-weight: 700; border-radius: 1mm; }

  .foot { display: flex; justify-content: space-between; gap: 3mm; padding: 1.2mm 3mm; border-top: 0.5mm solid #000; font-size: 7pt; line-height: 1.25; }
  .foot .from { min-width: 0; }
  .foot .care { text-align: right; flex: none; font-weight: 700; }
</style>
</head>
<body>
<div class="label">
  <div class="head">
    <img src="${logo.startsWith("http") ? logo : new URL(logo, window.location.origin).href}" alt="" />
    <div class="brand"><b>Wonder Books</b><span>Personalised storybooks, printed with love</span></div>
    <div class="badge ${prepaid ? "" : "cod"}">
      <strong>${escapeHtml(payment.toUpperCase())}</strong>
      ${prepaid ? "<br />Do not collect cash" : ""}
    </div>
  </div>

  <div class="to">
    <div class="tag">Deliver to</div>
    <div class="name">${escapeHtml(a.name)}</div>
    <div class="addr">${addressLines.map(escapeHtml).join("<br />")}${foreign ? `<br />${escapeHtml(a.country)}` : ""}</div>
    <div class="pin-row">
      <span class="pin">${escapeHtml(a.postalCode)}</span>
      <span class="phone">${escapeHtml(displayPhone(a) || "")}</span>
    </div>
  </div>

  <div class="scan">
    <div class="bars">${barcode}</div>
    <div class="code">${escapeHtml(scanValue)} <small>${awb ? "AWB" : "ORDER"}</small></div>
  </div>

  <div class="grid">
    <div class="cell"><span class="tag">Order</span><b>${escapeHtml(orderNumbers[0] || "—")}</b><small>${escapeHtml(orderSub)}</small></div>
    <div class="cell"><span class="tag">Courier</span><b>${escapeHtml(courier || "—")}</b></div>
    <div class="cell"><span class="tag">Weight</span><b>${escapeHtml(weight)}</b><small>${escapeHtml(dims)}</small></div>
  </div>

  <div class="contents">
    <div class="tag">Contents (${parcel.copies} ${parcel.copies === 1 ? "copy" : "copies"})</div>
    ${itemRows}
    ${hiddenItems > 0 ? `<div class="more">+ ${hiddenItems} more ${hiddenItems === 1 ? "book" : "books"} in this parcel</div>` : ""}
    ${tags.length ? `<div class="chips">${tags.map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
  </div>

  <div class="foot">
    <div class="from">
      <div class="tag">From</div>
      <b>${escapeHtml(sender.name)}</b>${sender.address ? `<br />${escapeHtml(sender.address)}` : ""}${sender.phone ? `<br />${escapeHtml(sender.phone)}` : ""}
    </div>
    <div class="care">HANDLE WITH CARE<br />Printed book · keep dry</div>
  </div>
</div>
</body>
</html>`;
};

export const printShippingLabel = async (order) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    doc.open();
    doc.write(buildLabelHtml(order));
    doc.close();

    await Promise.all([waitForImages(doc), doc.fonts?.ready?.catch(() => {})]);

    const cleanup = () => iframe.remove();
    iframe.contentWindow.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(cleanup, 5 * 60 * 1000); // safety net if afterprint never fires

    iframe.contentWindow.focus();
    iframe.contentWindow.print();
};
