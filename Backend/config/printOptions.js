export const PRINT_OPTION_GROUPS = {
    cover: {
        label: "Cover",
        default: "soft",
        choices: {
            soft: {
                code: "S",
                label: "Soft cover",
                description: "Flexible paperback cover. Light and easy to carry.",
                price: 0,
            },
            hard: {
                code: "H",
                label: "Hard cover",
                description: "Sturdy board cover that lasts for years.",
                price: 50,
            },
        },
    },

    pages: {
        label: "Page finish",
        default: "normal",
        choices: {
            normal: {
                code: "N",
                label: "Normal pages",
                description: "Standard matte paper.",
                price: 0,
            },
            laminated: {
                code: "L",
                label: "Laminated pages",
                description: "Glossy, tear and spill resistant. Great for little hands.",
                price: 100,
            },
        },
    },

    size: {
        label: "Size",
        default: "a5",
        choices: {
            a5: {
                code: "5",
                label: "A5",
                description: "Compact portrait book.",
                widthMm: 148,
                heightMm: 210,
                price: 0,
            },
            a4: {
                code: "4",
                label: "A4",
                description: "Large portrait book. Pictures really stand out.",
                widthMm: 210,
                heightMm: 297,
                price: 75,
            },
            square8: {
                code: "8",
                label: "Square 8 × 8 in",
                description: "Classic square picture-book shape.",
                widthMm: 203,
                heightMm: 203,
                price: 50,
            },
        },
    },
};

const GROUP_KEYS = Object.keys(PRINT_OPTION_GROUPS);

export const getDefaultPrintOptions = () =>
    Object.fromEntries(GROUP_KEYS.map((key) => [key, PRINT_OPTION_GROUPS[key].default]));

const isValidChoice = (group, value) =>
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(PRINT_OPTION_GROUPS[group].choices, value);


export const parsePrintOptions = (input) => {
    const options = getDefaultPrintOptions();
    if (input === undefined || input === null) return { options };

    if (typeof input !== "object" || Array.isArray(input)) {
        return { error: "Print options are invalid" };
    }

    for (const group of GROUP_KEYS) {
        const value = input[group];
        if (value === undefined || value === null || value === "") continue;
        if (!isValidChoice(group, value)) {
            return { error: `"${value}" isn't an available ${PRINT_OPTION_GROUPS[group].label.toLowerCase()} option` };
        }
        options[group] = value;
    }
    return { options };
};


export const normalizePrintOptions = (input) => {
    const options = getDefaultPrintOptions();
    if (!input || typeof input !== "object") return options;
    for (const group of GROUP_KEYS) {
        if (isValidChoice(group, input[group])) options[group] = input[group];
    }
    return options;
};

// Extra rupees per copy for the chosen options
export const getPrintOptionsPrice = (input) => {
    const options = normalizePrintOptions(input);
    return GROUP_KEYS.reduce(
        (sum, group) => sum + (PRINT_OPTION_GROUPS[group].choices[options[group]].price || 0),
        0,
    );
};

export const describePrintOptions = (input) => {
    const options = normalizePrintOptions(input);
    return GROUP_KEYS.map((group) => {
        const choice = PRINT_OPTION_GROUPS[group].choices[options[group]];
        return choice.widthMm
            ? `${choice.label} (${choice.widthMm} × ${choice.heightMm} mm)`
            : choice.label;
    });
};


export const snapshotPrintOptions = (input) => {
    const options = normalizePrintOptions(input);
    const cover = PRINT_OPTION_GROUPS.cover.choices[options.cover];
    const pages = PRINT_OPTION_GROUPS.pages.choices[options.pages];
    const size = PRINT_OPTION_GROUPS.size.choices[options.size];
    return {
        cover: options.cover,
        coverLabel: cover.label,
        pages: options.pages,
        pagesLabel: pages.label,
        size: options.size,
        sizeLabel: size.label,
        widthMm: size.widthMm || 0,
        heightMm: size.heightMm || 0,
        extraPrice: getPrintOptionsPrice(options),
    };
};

export const encodePrintOptions = (input) => {
    const options = normalizePrintOptions(input);
    return GROUP_KEYS.map((group) => PRINT_OPTION_GROUPS[group].choices[options[group]].code).join("");
};

export const decodePrintOptions = (code) => {
    const options = getDefaultPrintOptions();
    const text = String(code || "");
    GROUP_KEYS.forEach((group, index) => {
        const match = Object.entries(PRINT_OPTION_GROUPS[group].choices).find(
            ([, choice]) => choice.code === text[index],
        );
        if (match) options[group] = match[0];
    });
    return options;
};

export const getPublicPrintOptions = () => ({
    groups: GROUP_KEYS.map((key) => ({
        key,
        label: PRINT_OPTION_GROUPS[key].label,
        default: PRINT_OPTION_GROUPS[key].default,
        choices: Object.entries(PRINT_OPTION_GROUPS[key].choices).map(([value, choice]) => ({
            value,
            label: choice.label,
            description: choice.description,
            widthMm: choice.widthMm || null,
            heightMm: choice.heightMm || null,
            price: choice.price || 0,
        })),
    })),
});
