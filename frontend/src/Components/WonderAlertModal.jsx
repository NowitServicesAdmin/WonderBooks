import { useEffect, useId } from "react";
import {
    FiX,
    FiCheck,
    FiArrowLeft,
    FiArrowRight,
    FiLogOut,
    FiRefreshCw,
    FiTrash2,
    FiSave,
} from "react-icons/fi";
import { FaCrown, FaPaperPlane, FaCheckCircle, FaStar } from "react-icons/fa";

import successImage from "../assets/wonder-books/success.png";
import errorImage from "../assets/wonder-books/error.png";
import confirmImage from "../assets/wonder-books/confirm.png";
import dangerImage from "../assets/wonder-books/danger.png";
import logoutImage from "../assets/wonder-books/logout.png";
import unsavedImage from "../assets/wonder-books/unsaved.png";
import upgradeImage from "../assets/wonder-books/upgrade.png";
import infoImage from "../assets/wonder-books/info.png";
import verificationImage from "../assets/wonder-books/verification.png";
import expiredImage from "../assets/wonder-books/expired.png";
import restrictedImage from "../assets/wonder-books/restricted.png";
import offlineImage from "../assets/wonder-books/offline.png";

const FONT_LINK_ID = "wonder-alert-fonts";

if (typeof document !== "undefined" && !document.getElementById(FONT_LINK_ID)) {
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
        "https://fonts.googleapis.com/css2?family=Kalam:wght@400&family=Nunito:wght@500;600;700;800&display=swap";
    document.head.appendChild(link);
}

const UI_FONT = '"Nunito", Inter, ui-sans-serif, system-ui, "Segoe UI", sans-serif';
const QUOTE_FONT = '"Kalam", "Segoe Script", "Bradley Hand", "Comic Sans MS", cursive';

const COLORS = {
    brand: "#2f0fd8", // "Wonder Books" label
    titleViolet: "#3a12d6", // Hooray! / No Internet
    titleIndigo: "#2a0ab5", // Goodbye / Are you sure / Unsaved ...
    titleCrimson: "#e0114f", // Oops! / Delete / Session Expired
    message: "#4b4a8a",
    quote: "#7038e8",
    badge: "#dcd8fb",
};

const BUTTON_STYLES = {
    violet: {
        background: "linear-gradient(180deg, #7443f0 0%, #5f2fdd 100%)",
        boxShadow: "0 6px 14px rgba(95,47,221,0.28), inset 0 1px 0 rgba(255,255,255,0.22)",
    },
    red: {
        background: "linear-gradient(180deg, #f45a57 0%, #e93b3b 100%)",
        boxShadow: "0 6px 14px rgba(233,59,59,0.28), inset 0 1px 0 rgba(255,255,255,0.22)",
    },
    orange: {
        background: "linear-gradient(180deg, #ffa62b 0%, #fb8c12 100%)",
        boxShadow: "0 6px 14px rgba(251,140,18,0.30), inset 0 1px 0 rgba(255,255,255,0.28)",
    },
};

const cq = (value, min) => `max(${min}px, ${value}cqw)`;

const alertConfig = {
    success: {
        image: successImage,
        art: { w: 127.2, l: -23.7, t: -16.3 },
        ratio: 1.94,
        titleColor: COLORS.titleViolet,
        titleSize: 6.0,
        msgSize: 2.85,
        textWidth: 47,
        quoteGap: 3.3,
        actions: { left: 24, width: 52 },
        buttonStyle: "violet",
        buttonIcon: <FaPaperPlane />,
        buttonText: "Great!",
    },
    error: {
        image: errorImage,
        art: { w: 108.4, l: -6.8, t: -7.0 },
        ratio: 1.93,
        titleColor: COLORS.titleCrimson,
        titleSize: 5.6,
        msgSize: 2.75,
        textWidth: 51,
        quoteGap: 3.0,
        actions: { left: 18.6, width: 63.3 },
        buttonStyle: "red",
        buttonIcon: <FiRefreshCw />,
        buttonText: "Try Again",
    },
    confirm: {
        image: confirmImage,
        art: { w: 126.0, l: -19.8, t: -18.4 },
        ratio: 1.95,
        titleColor: COLORS.titleIndigo,
        titleSize: 4.9,
        msgSize: 2.8,
        textWidth: 51,
        quoteGap: 5.0,
        actions: { left: 22.2, width: 55.6 },
        buttonStyle: "orange",
        buttonIcon: <FiTrash2 />,
        buttonText: "Proceed",
    },
    danger: {
        image: dangerImage,
        art: { w: 113.8, l: -10.8, t: -10.4 },
        ratio: 1.9,
        titleColor: COLORS.titleCrimson,
        titleSize: 4.85,
        msgSize: 2.65,
        textWidth: 52,
        quoteGap: 4.8,
        actions: { left: 17.5, width: 67 },
        buttonStyle: "red",
        buttonIcon: <FiTrash2 />,
        buttonText: "Delete",
    },
    logout: {
        image: logoutImage,
        art: { w: 97.5, l: 2.5, t: -8 },
        artBackground: "#ece2fb",
        ratio: 1.9,
        titleColor: COLORS.titleIndigo,
        titleSize: 5.2,
        msgSize: 2.95,
        textWidth: 51,
        quoteGap: 4.2,
        actions: { left: 23.8, width: 52.9 },
        buttonStyle: "violet",
        buttonIcon: <FiLogOut />,
        buttonText: "Log out",
    },
    unsaved: {
        image: unsavedImage,
        art: { w: 105.0, l: -3.4, t: -1.6 },
        ratio: 1.9,
        titleColor: COLORS.titleIndigo,
        titleSize: 5.0,
        msgSize: 2.95,
        textWidth: 53,
        btnSize: 2.7,
        quoteGap: 6.8,
        actions: { left: 5.1, width: 87.5 },
        buttonStyle: "violet",
        buttonIcon: <FiSave />,
        buttonText: "Save",
    },
    upgrade: {
        image: upgradeImage,
        art: { w: 103.2, l: -1.6, t: -21.3 },
        ratio: 2.29,
        compact: true,
        titleGap: 0.2,
        btnHeight: 6.9,
        primaryGrow: 1.35,
        titleColor: COLORS.titleIndigo,
        titleSize: 3.6,
        msgSize: 2.3,
        textWidth: 49,
        btnSize: 2.4,
        quoteGap: 3.0,
        actions: { left: 32.8, width: 62 },
        floatActions: true,
        buttonStyle: "violet",
        buttonIcon: <FaCrown style={{ color: "#ffc21a" }} />,
        buttonText: "Upgrade Now",
    },
    info: {
        image: infoImage,
        art: { w: 112.5, l: -10.9, t: -26.2 },
        ratio: 2.19,
        compact: true,
        titleColor: COLORS.titleIndigo,
        titleSize: 4.3,
        msgSize: 2.67,
        textWidth: 51,
        quoteGap: 0,
        actions: { left: 42.5, width: 53.5 },
        buttonStyle: "violet",
        buttonIcon: <FiCheck />,
        buttonText: "Got it",
    },
    verification: {
        image: verificationImage,
        art: { w: 103.2, l: -1.6, t: -18.1 },
        ratio: 2.25,
        compact: true,
        titleColor: COLORS.titleIndigo,
        titleSize: 3.93,
        msgSize: 2.5,
        textWidth: 55,
        btnSize: 2.7,
        quoteGap: 1.8,
        actions: { left: 24.5, width: 72.7 },
        buttonStyle: "violet",
        buttonIcon: <FaCheckCircle />,
        buttonText: "Okay",
    },
    expired: {
        image: expiredImage,
        art: { w: 103.7, l: -2.1, t: -13.1 },
        ratio: 2.36,
        compact: true,
        titleColor: COLORS.titleCrimson,
        titleSize: 4.1,
        msgSize: 2.6,
        textWidth: 54,
        quoteGap: -0.7,
        actions: { left: 36.3, width: 30.5 },
        buttonStyle: "violet",
        buttonIcon: <FiArrowRight />,
        buttonText: "Log In",
    },
    restricted: {
        image: restrictedImage,
        art: { w: 104.6, l: -3.0, t: -17.6 },
        ratio: 2.35,
        compact: true,
        titleColor: COLORS.titleIndigo,
        titleSize: 4.33,
        msgSize: 2.72,
        textWidth: 52,
        quoteGap: -2.7,
        actions: { left: 47, width: 37.6 },
        buttonStyle: "violet",
        buttonIcon: <FiArrowLeft />,
        buttonText: "Go Back",
    },
    offline: {
        image: offlineImage,
        art: { w: 108.4, l: -6.8, t: -20.2 },
        ratio: 2.37,
        compact: true,
        titleColor: COLORS.titleViolet,
        titleSize: 3.98,
        msgSize: 2.69,
        textWidth: 51,
        quoteGap: -1.0,
        actions: { left: 52.4, width: 42 },
        buttonStyle: "violet",
        buttonIcon: <FiRefreshCw />,
        buttonText: "Try Again",
    },
};

const PAD_X = 4.2; // horizontal card padding in cqw

/* Splits a quote into the two short lines used by the design.
   Use "\n" in the quote to choose the break yourself.                       */
const splitQuote = (text) => {
    if (!text) return [];
    if (text.includes("\n")) return text.split("\n").map((line) => line.trim()).filter(Boolean);
    if (text.length < 20) return [text];

    const words = text.split(" ");
    let best = { index: 1, score: Infinity };
    let offset = 0;
    for (let i = 0; i < words.length - 1; i += 1) {
        offset += words[i].length + (i > 0 ? 1 : 0);
        const fraction = offset / text.length;
        const endsWithPunctuation = /[,.;:]$/.test(words[i]);
        const score = Math.abs(fraction - 0.42) - (endsWithPunctuation && fraction > 0.25 ? 0.2 : 0);
        if (score < best.score) best = { index: i + 1, score };
    }
    return [words.slice(0, best.index).join(" "), words.slice(best.index).join(" ")];
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
const WonderAlertModal = ({
    isOpen,
    onClose,
    type = "success",
    title,
    message,
    quote, // one line of text; use "\n" to choose where it breaks
    checklist, // string[] — renders a checkmark feature list (used by "upgrade")
    primaryText,
    secondaryText,
    tertiaryText, // leftmost extra button, e.g. "Discard" alongside "Cancel" + "Save"
    onPrimary,
    onSecondary,
    onTertiary,
    showClose = true,
    children,
}) => {
    const config = alertConfig[type] || alertConfig.success;
    const titleId = useId();

    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose?.();
            }
        };

        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const finalPrimaryText = primaryText || config.buttonText;
    const buttonCount = 1 + Number(Boolean(secondaryText)) + Number(Boolean(tertiaryText));
    const quoteLines = splitQuote(quote);

    // Keep the button row wide enough when a caller adds extra buttons.
    const actionsWidth = Math.max(config.actions.width, buttonCount * 26);
    const actionsLeft = Math.min(config.actions.left, 100 - PAD_X - actionsWidth);

    const compact = Boolean(config.compact);
    const btnHeight = config.btnHeight || (compact ? 7.7 : 8.3);
    const primaryGrow = config.primaryGrow || 1.15;
    const btnFont = config.btnSize || 3.0;
    const padTop = 2.4;
    const padBottom = compact ? 2.3 : 3.0;

    const secondaryButtonStyle = {
        height: cq(btnHeight, 38),
        fontSize: cq(btnFont, 13),
        borderRadius: cq(2.0, 10),
        color: "#1b1372",
        background: "linear-gradient(180deg, #f8f5ff 0%, #efeafd 100%)",
        border: "1.5px solid #c8c0f3",
        boxShadow: "0 2px 6px rgba(120,100,220,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
    };

    const primaryButtonStyle = {
        height: cq(btnHeight, 38),
        fontSize: cq(btnFont, 13),
        borderRadius: cq(2.0, 10),
        gap: "2.2cqw",
        flexGrow: primaryGrow,
        ...BUTTON_STYLES[config.buttonStyle],
    };

    const iconStyle = { fontSize: cq(btnFont + 0.6, 16) };

    const renderSecondary = (text, handler) => (
        <button
            type="button"
            onClick={handler || onClose}
            className="flex min-w-0 flex-1 basis-0 cursor-pointer items-center justify-center whitespace-nowrap px-2 font-extrabold transition-all hover:-translate-y-px hover:brightness-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 active:translate-y-0 active:scale-[0.98]"
            style={secondaryButtonStyle}
        >
            {text}
        </button>
    );

    return (
        <div
            className="wonder-alert-overlay fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-[#2a2360]/50 p-4 backdrop-blur-[5px]"
            onClick={onClose}
        >
            {/* Local keyframes + reduced-motion handling */}
            <style>{`
                @keyframes wonderAlertOverlayIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes wonderAlertCardIn {
                    from { opacity: 0; transform: translateY(10px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .wonder-alert-overlay { animation: wonderAlertOverlayIn 180ms ease-out; }
                .wonder-alert-card { animation: wonderAlertCardIn 260ms cubic-bezier(0.2, 0.9, 0.3, 1.1); }
                @media (prefers-reduced-motion: reduce) {
                    .wonder-alert-overlay, .wonder-alert-card { animation: none; }
                }
            `}</style>

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onClick={(event) => event.stopPropagation()}
                className="wonder-alert-card relative m-auto flex min-h-[300px] w-full max-w-[480px] flex-col rounded-[22px] border border-white/80 bg-[#f4f0ff] shadow-[0_24px_70px_rgba(37,19,112,0.32)] sm:min-h-auto sm:aspect-(--ar)"
                style={{
                    containerType: "inline-size",
                    fontFamily: UI_FONT,
                    "--ar": config.ratio,
                    "--tw": `${config.textWidth}cqw`,
                    "--al": `${actionsLeft - PAD_X}cqw`, // in-flow button row (inside the padding)
                    "--alf": `${actionsLeft}cqw`, // floating button row (measured from the card edge)
                    "--aw": `${actionsWidth}cqw`,
                    "--qg": `${config.quoteGap}cqw`,
                    "--pb": `${padBottom}cqw`,
                }}
            >
                {/* ---------- Artwork (clipped to the rounded card) ---------- */}
                <div
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
                    style={{ backgroundColor: config.artBackground || "#efe9fd" }}
                    aria-hidden="true"
                >
                    {/* Small screens: simply cover the (taller) card */}
                    <div
                        className="absolute sm:hidden"
                        style={{
                            inset: "-1.6%",
                            backgroundImage: `url(${config.image})`,
                            backgroundSize: "cover",
                            backgroundPosition: "right center",
                            backgroundRepeat: "no-repeat",
                        }}
                    />

                    {/* >= sm: placed exactly like the design.
                        Sized and offset in % so it scales with the card. */}
                    <img
                        src={config.image}
                        alt=""
                        draggable={false}
                        className="absolute hidden max-w-none select-none sm:block"
                        style={{
                            width: `${config.art.w}%`,
                            left: `${config.art.l}%`,
                            top: `${config.art.t}%`,
                            height: "auto",
                        }}
                    />

                    {/* Soft white fade so the text side stays clean */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/55 to-white/15 sm:hidden" />
                    <div
                        className="absolute inset-0 hidden sm:block"
                        style={{
                            background:
                                "linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.90) 28%, rgba(255,255,255,0.62) 42%, rgba(255,255,255,0.20) 55%, rgba(255,255,255,0.06) 68%, rgba(255,255,255,0.06) 100%)",
                        }}
                    />
                </div>

                {/* ---------- Content ---------- */}
                <div
                    className="relative z-10 flex flex-1 flex-col"
                    style={{ padding: `${padTop}cqw ${PAD_X}cqw ${padBottom}cqw` }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between" style={{ marginRight: "-0.8cqw" }}>
                        <div className="flex items-center" style={{ gap: "1.5cqw" }}>
                            <span
                                className="flex items-center justify-center"
                                style={{
                                    width: cq(5.4, 26),
                                    height: cq(5.4, 26),
                                    borderRadius: cq(1.7, 8),
                                    background: COLORS.badge,
                                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
                                }}
                            >
                                <FaStar
                                    style={{
                                        width: "62%",
                                        height: "62%",
                                        color: "#ffb81f",
                                        filter: "drop-shadow(0 1px 0 rgba(224,120,0,0.55))",
                                    }}
                                />
                            </span>
                            <span
                                className="font-extrabold tracking-tight"
                                style={{ fontSize: cq(2.75, 13), color: COLORS.brand }}
                            >
                                Wonder Books
                            </span>
                        </div>

                        {showClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close"
                                className="flex cursor-pointer items-center justify-center rounded-full bg-white/55 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-violet-500"
                                style={{ width: cq(5.8, 28), height: cq(5.8, 28), color: "#4b3fb0" }}
                            >
                                <FiX style={{ width: "52%", height: "52%" }} strokeWidth={1.7} />
                            </button>
                        )}
                    </div>

                    {/* Title, message, custom content, checklist */}
                    <div style={{ marginTop: `${config.titleGap ?? (compact ? 1.4 : 2.6)}cqw` }}>
                        <h2
                            id={titleId}
                            className="m-0 font-extrabold"
                            style={{
                                fontSize: cq(config.titleSize, 19),
                                lineHeight: 1.1,
                                letterSpacing: "-0.01em",
                                color: config.titleColor,
                            }}
                        >
                            {title}
                        </h2>

                        {message && (
                            <p
                                className="m-0 max-w-full whitespace-pre-line font-medium sm:max-w-(--tw)"
                                style={{
                                    marginTop: compact ? "0.7cqw" : "1cqw",
                                    fontSize: cq(config.msgSize, 13),
                                    lineHeight: compact ? 1.3 : 1.4,
                                    color: COLORS.message,
                                }}
                            >
                                {message}
                            </p>
                        )}

                        {children}

                        {checklist && checklist.length > 0 && (
                            <ul
                                className="m-0 list-none p-0"
                                style={{ marginTop: "0.9cqw", display: "grid", gap: "1cqw" }}
                            >
                                {checklist.map((item, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center font-medium"
                                        style={{
                                            gap: "1.7cqw",
                                            fontSize: cq(2.25, 12),
                                            lineHeight: 1.3,
                                            color: COLORS.message,
                                        }}
                                    >
                                        <span
                                            className="flex flex-shrink-0 items-center justify-center rounded-full text-white"
                                            style={{
                                                width: cq(2.9, 15),
                                                height: cq(2.9, 15),
                                                background: "linear-gradient(180deg, #7a4bf2 0%, #5a2fe0 100%)",
                                            }}
                                        >
                                            <FiCheck style={{ width: "66%", height: "66%" }} strokeWidth={3.4} />
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Quote + actions are anchored to the bottom of the card */}
                    <div className="mt-auto">
                        {quoteLines.length > 0 && (
                            <p
                                className="mb-3 mt-3 sm:mb-(--qg) sm:mt-[2cqw]"
                                style={{
                                    fontFamily: QUOTE_FONT,
                                    fontStyle: "italic",
                                    fontSize: cq(2.55, 12),
                                    lineHeight: compact ? 1.25 : 1.3,
                                    color: COLORS.quote,
                                    transform: "rotate(-2.2deg)",
                                    transformOrigin: "left center",
                                }}
                            >
                                {quoteLines.map((line, index) => (
                                    <span
                                        key={index}
                                        className="block"
                                        style={{ paddingLeft: index === 0 ? 0 : "2cqw" }}
                                    >
                                        {index === 0 && "“"}
                                        {line}
                                        {index === quoteLines.length - 1 && "”"}
                                    </span>
                                ))}
                            </p>
                        )}

                        <div
                            className={`flex gap-[2.5cqw] ${
                                config.floatActions
                                    ? "mt-4 sm:absolute sm:bottom-(--pb) sm:left-(--alf) sm:mt-0 sm:w-(--aw)"
                                    : "mt-4 sm:ml-(--al) sm:mt-0 sm:w-(--aw)"
                            }`}
                        >
                            {tertiaryText && renderSecondary(tertiaryText, onTertiary)}
                            {secondaryText && renderSecondary(secondaryText, onSecondary)}

                            <button
                                type="button"
                                onClick={onPrimary}
                                className="flex min-w-0 basis-0 cursor-pointer items-center justify-center whitespace-nowrap px-2 font-extrabold text-white transition-all hover:-translate-y-px hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 active:translate-y-0 active:scale-[0.98]"
                                style={primaryButtonStyle}
                            >
                                <span className="flex flex-shrink-0 items-center" style={iconStyle}>
                                    {config.buttonIcon}
                                </span>
                                {finalPrimaryText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WonderAlertModal;