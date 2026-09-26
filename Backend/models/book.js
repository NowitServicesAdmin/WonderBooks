import mongoose from "mongoose";

const CharacterSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true
        },

        type: {
            type: String,
            required: true
        },

        name: {
            type: String,
            required: true
        },

        gender: {
            type: String,
            default: ""
        },

        age: {
            type: String,
            default: ""
        },

        hobbies: {
            type: String,
            default: ""
        },

        favouriteFood: {
            type: String,
            default: ""
        },

        hasPhoto: {
            type: Boolean,
            default: false
        },

        photoUrl: {
            type: String,
            default: null
        },

        photoStorageProvider: {
            type: String,
            enum: ["s3", null],
            default: null
        },

        photoStorageKey: {
            type: String,
            default: null
        }
    },
    {
        _id: false
    }
);

const BookPageSchema = new mongoose.Schema(
    {
        position: {
            type: Number,
            required: true
        },

        pageNumber: {
            type: Number,
            required: true
        },

        content: {
            type: String,
            default: ""
        },

        imageUrl: {
            type: String,
            default: null
        },

        storageProvider: {
            type: String,
            enum: ["r2", "s3", null],
            default: null
        },

        storageKey: {
            type: String,
            default: null
        },

        imagePrompt: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: [
                "pending",
                "generating",
                "completed",
                "failed"
            ],
            default: "pending"
        }
    },
    {
        _id: true
    }
);

const BookSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },

        mode: {
            type: String,
            enum: ["manual", "ai"],
            required: true
        },

        status: {
            type: String,
            enum: [
                "generating",
                "completed",
                "failed"
            ],
            default: "generating"
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
            default: null
        },

        coverImageUrl: {
            type: String,
            default: null
        },

        coverStorageKey: {
            type: String,
            default: null
        },

        storyData: {
            storyIdea: {
                type: String,
                default: null
            },

            age: {
                type: String,
                default: null
            },

            theme: {
                type: String,
                default: null
            },

            subject: {
                type: String,
                default: null
            },

            centralMessage: {
                type: String,
                default: null
            },

            imageStyle: {
                type: String,
                default: null
            },

            language: {
                type: String,
                default: "English"
            },

            font: {
                type: String,
                default: "Rounded & Playful"
            },

            characters: {
                type: [CharacterSchema],
                default: []
            }
        },

        pages: {
            type: [BookPageSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Book", BookSchema);