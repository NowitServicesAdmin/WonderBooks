const SHADOW = <ellipse cx="80" cy="110" rx="46" ry="5" fill="#2b1a6b" opacity="0.12" />;

const GiftWrapArt = () => (
    <>
        {SHADOW}
        <rect x="38" y="54" width="84" height="54" rx="6" fill="#7c4dff" />
        <rect x="38" y="54" width="84" height="12" rx="4" fill="#6a3de8" opacity="0.55" />
        <rect x="32" y="42" width="96" height="18" rx="5" fill="#9b7bff" />
        <rect x="72" y="42" width="16" height="66" fill="#fde68a" />
        <path d="M80 42 C58 14 34 26 52 38 C60 43 74 44 80 42Z" fill="#fbbf24" />
        <path d="M80 42 C102 14 126 26 108 38 C100 43 86 44 80 42Z" fill="#f59e0b" />
        <circle cx="80" cy="42" r="6.5" fill="#f59e0b" />
        {[[50, 80], [58, 96], [104, 78], [112, 94], [96, 100]].map(([x, y]) => (
            <path key={`${x}-${y}`} d={`M${x} ${y - 3} l1.2 2.6 2.8.4 -2 2 .5 2.8 -2.5 -1.3 -2.5 1.3 .5 -2.8 -2 -2 2.8 -.4z`} fill="#fff" opacity="0.9" />
        ))}
    </>
);

const DedicationArt = () => (
    <>
        {SHADOW}
        <g transform="rotate(-7 74 62)">
            <rect x="36" y="14" width="82" height="88" rx="4" fill="#fffdf5" stroke="#e6dcc0" />
            <path d="M48 36h30" stroke="#8b5cf6" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M48 50h56M48 60h50M48 70h56M48 80h34" stroke="#c4b5fd" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M100 86c-4-3-7-5.5-7-8.5a3.8 3.8 0 0 1 7-2 3.8 3.8 0 0 1 7 2c0 3-3 5.5-7 8.5z" fill="#f472b6" />
        </g>
        <g transform="rotate(38 118 78)">
            <rect x="112" y="40" width="10" height="48" rx="2" fill="#8b5cf6" />
            <rect x="112" y="40" width="10" height="7" fill="#c4b5fd" />
            <path d="M112 88h10l-5 13z" fill="#fcd9a8" />
            <path d="M115 95h4l-2 6z" fill="#3b2a9b" />
        </g>
    </>
);

const HardCoverArt = () => (
    <>
        {SHADOW}
        <rect x="50" y="102" width="66" height="6" rx="2" fill="#fff" stroke="#d9d2f5" />
        <rect x="42" y="16" width="76" height="90" rx="4" fill="#3b2a9b" />
        <rect x="42" y="16" width="12" height="90" rx="3" fill="#2a1d78" />
        <rect x="60" y="30" width="48" height="34" rx="3" fill="#fbbf24" />
        <path d="M84 36l3.2 6.6 7.2 1-5.2 5 1.2 7.2-6.4-3.4-6.4 3.4 1.2-7.2-5.2-5 7.2-1z" fill="#fff7d6" />
        <path d="M62 76h44M62 85h30" stroke="#a78bfa" strokeWidth="2.6" strokeLinecap="round" />
    </>
);

const SoftCoverArt = () => (
    <>
        {SHADOW}
        <rect x="42" y="16" width="76" height="90" rx="6" fill="#8b5cf6" />
        <rect x="42" y="16" width="7" height="90" rx="3" fill="#6d46d9" />
        <rect x="58" y="30" width="48" height="34" rx="3" fill="#fde68a" />
        <circle cx="82" cy="47" r="9" fill="#f59e0b" opacity="0.85" />
        <path d="M60 76h44M60 85h30" stroke="#ddd6fe" strokeWidth="2.6" strokeLinecap="round" />
    </>
);

const NormalPagesArt = () => (
    <>
        {SHADOW}
        <rect x="40" y="16" width="64" height="86" rx="3" fill="#fffdf5" stroke="#e6dcc0" />
        <rect x="48" y="26" width="48" height="32" rx="2" fill="#ddd6fe" />
        <path d="M48 70h48M48 79h48M48 88h30" stroke="#c4b5fd" strokeWidth="2.4" strokeLinecap="round" />
    </>
);

const LaminatedArt = () => (
    <>
        <defs>
            <linearGradient id="wb-sheen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
                <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
        </defs>
        {SHADOW}
        <rect x="46" y="22" width="64" height="82" rx="4" fill="#c4b5fd" />
        <rect x="40" y="16" width="64" height="82" rx="4" fill="#a78bfa" />
        <rect x="34" y="10" width="64" height="82" rx="4" fill="#ede9fe" stroke="#c4b5fd" />
        <rect x="42" y="20" width="48" height="34" rx="3" fill="#8b5cf6" opacity="0.85" />
        <path d="M42 66h48M42 75h34" stroke="#a78bfa" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M34 10h30l-24 82H34z" fill="url(#wb-sheen)" opacity="0.7" />
        <path d="M112 30l2.4 5.6 5.6 2.4-5.6 2.4-2.4 5.6-2.4-5.6-5.6-2.4 5.6-2.4z" fill="#fbbf24" />
        <path d="M122 62l1.6 3.6 3.6 1.6-3.6 1.6-1.6 3.6-1.6-3.6-3.6-1.6 3.6-1.6z" fill="#fff" />
    </>
);

// Page-shaped sketch of a size, drawn to scale (label sits on the picture block)
const SizeArt = ({ widthMm, heightMm, label }) => {
    const scale = 0.3;
    const w = widthMm * scale;
    const h = heightMm * scale;
    const x = 80 - w / 2;
    const y = 112 - h;
    const blockH = h * 0.45;
    return (
        <>
            {SHADOW}
            <rect x={x} y={y} width={w} height={h} rx="3" fill="#ede9fe" stroke="#7c4dff" strokeWidth="2" />
            <rect x={x + 7} y={y + 7} width={w - 14} height={blockH} rx="2" fill="#c4b5fd" />
            <text x={80} y={y + 7 + blockH / 2 + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#4c1d95" fontFamily="inherit">
                {label}
            </text>
            <path d={`M${x + 7} ${y + blockH + 17}h${w - 14}M${x + 7} ${y + blockH + 25}h${(w - 14) * 0.65}`} stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
        </>
    );
};

// kind: giftWrap | dedication | cover | pages | <size value: a4, square8, ...>
export const ExtraArt = ({ kind, choice }) => {
    let art;
    switch (kind) {
        case "giftWrap":
            art = <GiftWrapArt />;
            break;
        case "dedication":
            art = <DedicationArt />;
            break;
        case "cover":
            art = choice?.value === "soft" ? <SoftCoverArt /> : <HardCoverArt />;
            break;
        case "pages":
            art = choice?.value === "normal" ? <NormalPagesArt /> : <LaminatedArt />;
            break;
        default:
            art = choice?.widthMm ? (
                <SizeArt widthMm={choice.widthMm} heightMm={choice.heightMm} label={choice.label.replace(/^Square\s*/i, "").replace(/\s+in$/i, "")} />
            ) : null;
    }
    return (
        <svg viewBox="0 0 160 120" className="h-full w-full" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
            {art}
        </svg>
    );
};

export default ExtraArt;