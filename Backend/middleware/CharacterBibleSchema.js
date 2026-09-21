const CharacterBibleSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        type: {
            type: String,
            enum: ["person", "pet", "object"],
            required: true
        },
        name: { type: String, required: true },

        identity: {
            gender: { type: String, default: "" },
            age: { type: String, default: "" }
        },

        appearance: {
            hair: { type: String, default: "" },
            eyes: { type: String, default: "" },
            skinTone: { type: String, default: "" },
            body: { type: String, default: "" },
            fur: { type: String, default: "" },
            markings: { type: String, default: "" }
        },

        clothing: {
            top: { type: String, default: "" },
            bottom: { type: String, default: "" },
            shoes: { type: String, default: "" },
            accessories: { type: String, default: "" }
        },

        colors: {
            primary: { type: String, default: "" },
            secondary: { type: String, default: "" },
            accent: { type: String, default: "" }
        },

        personality: {
            type: [String],
            default: []
        },

        signatureDetails: {
            type: [String],
            default: []
        },

        hasPhoto: { type: Boolean, default: false },

        photoUrl: { type: String, default: null },
        photoStorageProvider: { type: String, default: null },
        photoStorageKey: { type: String, default: null },

        referenceImageUrl: { type: String, default: null },
        referenceStorageProvider: { type: String, default: null },
        referenceStorageKey: { type: String, default: null }
    },
    { _id: false }
);