export const LANDING_LANGUAGES = [
    { flag: "US", code: "EN", gt: "en", label: "English" },
    { flag: "ES", code: "ES", gt: "es", label: "Spanish" },
    { flag: "FR", code: "FR", gt: "fr", label: "French" },
    { flag: "SA", code: "AR", gt: "ar", label: "Arabic" },
    { flag: "PT", code: "PT", gt: "pt", label: "Portuguese" },
    { flag: "DE", code: "DE", gt: "de", label: "German" },
    { flag: "IN", code: "HI", gt: "hi", label: "Hindi" },
    { flag: "JP", code: "JA", gt: "ja", label: "Japanese" },
    { flag: "RU", code: "RU", gt: "ru", label: "Russian" },
    { flag: "CN", code: "ZH", gt: "zh-CN", label: "Chinese" },
];

const STORAGE_KEY = "wb_landing_lang";
const ELEMENT_ID = "wb_gt_element";
const SCRIPT_ID = "wb_gt_script";
const STYLE_ID = "wb_gt_style";

const gtOf = (code) => LANDING_LANGUAGES.find((l) => l.code === code)?.gt || "en";

export const getSavedLanguage = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return LANDING_LANGUAGES.some((l) => l.code === saved) ? saved : "EN";
    } catch {
        return "EN";
    }
};

const saveLanguage = (code) => {
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
};
const cookieDomains = () => {
    const host = window.location.hostname;
    const domains = [""]; // host-only cookie
    if (host && host !== "localhost" && !/^[\d.]+$/.test(host)) domains.push(`; domain=${host}`, `; domain=.${host}`);
    return domains;
};
const setCookie = (gt) => {
    cookieDomains().forEach((d) => { document.cookie = `googtrans=/en/${gt}; path=/${d}`; });
};
const clearCookie = () => {
    const past = "expires=Thu, 01 Jan 1970 00:00:00 UTC";
    cookieDomains().forEach((d) => { document.cookie = `googtrans=; ${past}; path=/${d}`; });
};

const injectStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        body { top: 0 !important; position: static !important; }
        #${ELEMENT_ID} { display: none !important; }
        iframe.goog-te-banner-frame, .goog-te-banner-frame, .goog-te-ftab, .goog-te-ftab-frame,
        iframe.goog-te-balloon-frame, .goog-te-balloon-frame, .goog-te-spinner-pos, .goog-te-gadget-icon,
        #goog-gt-tt, .goog-tooltip, .goog-tooltip:hover, iframe[id^=":"] {
            display: none !important; visibility: hidden !important; opacity: 0 !important;
            pointer-events: none !important; height: 0 !important; width: 0 !important;
        }
        .goog-text-highlight { background: none !important; box-shadow: none !important; }
        html.translated-ltr br.wb-br, html.translated-rtl br.wb-br { display: none; }
        html.translated-ltr font, html.translated-rtl font { background: none !important; box-shadow: none !important; }
    `;
    document.head.appendChild(style);
};

const installDomGuards = () => {
    const rc = Node.prototype.removeChild;
    const ib = Node.prototype.insertBefore;
    Node.prototype.removeChild = function (child) {
        if (child.parentNode !== this) return child;
        return rc.apply(this, arguments);
    };
    Node.prototype.insertBefore = function (node, ref) {
        if (ref && ref.parentNode !== this) return node;
        return ib.apply(this, arguments);
    };
    return () => {
        Node.prototype.removeChild = rc;
        Node.prototype.insertBefore = ib;
    };
};

const getCombo = () => document.querySelector("select.goog-te-combo");
const isTranslated = () => {
    const cl = document.documentElement.classList;
    return cl.contains("translated-ltr") || cl.contains("translated-rtl");
};

const initWidget = () => {
    if (document.getElementById(ELEMENT_ID) && getCombo()) return;
    let holder = document.getElementById(ELEMENT_ID);
    if (!holder) {
        holder = document.createElement("div");
        holder.id = ELEMENT_ID;
        holder.className = "notranslate";
        holder.style.display = "none";
        document.body.appendChild(holder);
    }
    if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
            {
                pageLanguage: "en",
                includedLanguages: LANDING_LANGUAGES.map((l) => l.gt).join(","),
                autoDisplay: false,
            },
            ELEMENT_ID
        );
    }
};

const loadScript = () => {
    window.googleTranslateElementInit = initWidget;
    if (window.google?.translate?.TranslateElement) return initWidget();
    if (document.getElementById(SCRIPT_ID)) return undefined;
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(s);
    return undefined;
};

const setCombo = (value) => {
    const combo = getCombo();
    if (!combo) return false;
    if (combo.value === value) {
        combo.value = "";
    }
    combo.value = value;
    combo.dispatchEvent(new Event("change"));
    return true;
};

const waitForCombo = (timeout = 10000) =>
    new Promise((resolve) => {
        if (getCombo()) return resolve(getCombo());
        const started = Date.now();
        const timer = window.setInterval(() => {
            const combo = getCombo();
            if (combo || Date.now() - started > timeout) {
                window.clearInterval(timer);
                resolve(combo || null);
            }
        }, 150);
        return undefined;
    });

let changeToken = 0; 
export const startLandingTranslate = (code) => {
    injectStyle();
    const removeGuards = installDomGuards();
    const gt = gtOf(code);

    if (gt !== "en") setCookie(gt); 
    loadScript();
    if (gt !== "en") setCombo(gt); 

    return () => {
        changeToken += 1;
        clearCookie();
        setCombo("en"); 
        document.documentElement.classList.remove("translated-ltr", "translated-rtl");
        document.documentElement.removeAttribute("dir");
        document.documentElement.setAttribute("lang", "en");
        document.body.style.top = "";
        removeGuards();
    };
};

export const changeLandingLanguage = async (code) => {
    saveLanguage(code);
    const gt = gtOf(code);
    const token = ++changeToken;

    if (gt === "en") clearCookie();
    else setCookie(gt);

    const combo = await waitForCombo();
    if (token !== changeToken) return; // user already picked something else

    // Widget never became ready (offline / blocked): a reload lets it read the cookie on init.
    if (!combo) { window.location.reload(); return; }

    setCombo(gt);

    window.setTimeout(() => {
        if (token !== changeToken) return;
        const ok = gt === "en" ? !isTranslated() : isTranslated();
        if (ok) return;
        setCombo(gt);
        window.setTimeout(() => {
            if (token !== changeToken) return;
            const ok2 = gt === "en" ? !isTranslated() : isTranslated();
            if (!ok2) window.location.reload();
        }, 1500);
    }, 1200);
};