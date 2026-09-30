import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import mongoose from "mongoose";
import book from "../models/book.js";
import { canAccessFeature, getBookUsage } from "../config/subscriptionLimits.js";
import { generateStory } from "../components/generateStory.js";
import { normalizePageLines } from "../components/generatestoryPrompt.js";
import { STORY_OPTION_LABELS as OPTS } from "../config/storyOptions.js";
import { generateImagePrompt } from "../components/generateImagePrompt.js";
import { generateImage } from "../components/imageGenerator.js";
import { uploadToS3 } from "../services/s3Service.js";
// import { uploadImage, getFromR2 } from "../services/storageService.js";
import {
    uploadImage,
    getStorageImage
} from "../services/storageService.js";
import { getCharacterPhotoReferenceImages } from "../components/characterPhotoReferences.js";
import { generateCharacterBible } from "../components/characterBible.js";
import {
    checkStoryText,
    findHardBlock,
    findSoftLabels,
    collectUserText,
    softenStrings,
    softenSelections,
    softenText,
    buildBlockMessage,
    changeNote,
    ageBand,
    policyFor
} from "../components/contentSafety.js";
import { generateCharacterReferences } from "../services/characterReferenceService.js";

// Pages per book. Override with BOOK_PAGE_COUNT in .env for quick test runs
// (e.g. BOOK_PAGE_COUNT=2) without touching code.
const BOOK_PAGE_COUNT = Number(process.env.BOOK_PAGE_COUNT) || 10;

const GENERIC_FAILURE =
    "Something went wrong while creating your book. Please try again - this one wasn't counted against your plan.";

const buildStoryDataFromSelections = (selections = {}, characters = []) => {
    const pick = (key) => selections?.[key]?.label ?? null;

    return {
        age: pick("age"),
        theme: pick("theme"),
        subject: pick("subject"),
        centralMessage: pick("centralmsg"),
        imageStyle: pick("imageStyle"),
        language: pick("language") || "English",
        font: pick("font") || "Rounded & Playful",
        // AI mode: the (enriched) story premise the user chatted about.
        storyIdea: pick("idea") || "",
        characters: (characters || []).map((character) => ({
            id: character.id,
            type: character.type,
            name: character.name,
            gender: character.gender || "",
            age: character.age || "",
            hobbies: character.hobbies || "",
            favouriteFood: character.favouriteFood || "",
            hasPhoto: Boolean(character.hasPhoto),
            photoUrl: null,
            photoStorageProvider: null,
            photoStorageKey: null
        }))
    };
};

const getCharacterReferenceImages = async (
    characters = [],
    characterReferences = []
) => {
    const references = [];

    for (const characterReference of characterReferences) {
        const lookupValue = String(characterReference || "")
            .trim()
            .toLowerCase();

        if (!lookupValue) {
            continue;
        }

        const character = characters.find((item) => {
            const characterId = String(item?.id || "")
                .trim()
                .toLowerCase();

            const characterName = String(item?.name || "")
                .trim()
                .toLowerCase();

            return (
                characterId === lookupValue ||
                characterName === lookupValue
            );
        });

        if (!character) {
            console.warn(
                `Character reference not found for: ${characterReference}`
            );
            continue;
        }

        if (!character.referenceStorageKey) {
            console.warn(
                `No canonical reference found for character: ${character.name} (${character.id})`
            );
            continue;
        }

        try {
            const response = await getStorageImage(
                character.referenceStorageKey
            );

            if (!response?.Body) {
                continue;
            }

            const bytes = await response.Body.transformToByteArray();

            if (!bytes?.length) {
                continue;
            }

            references.push({
                buffer: Buffer.from(bytes),
                contentType: "image/png"
            });
        } catch (error) {
            console.error(
                `Failed to load reference for character ${character.name}:`,
                error
            );
        }
    }

    return references.slice(0, 4);
};

// Generates, uploads and saves the illustration for ONE page. Throws on
// failure so the caller can retry.
const generatePageImage = async ({ bookId, storyData, imageData }) => {
    const { pageNumber, prompt } = imageData;

    await book.updateOne(
        { _id: bookId, "pages.pageNumber": pageNumber },
        {
            $set: {
                "pages.$.status": "generating",
                "pages.$.imagePrompt": prompt
            }
        }
    );

    console.log(`Generating image for page ${pageNumber}...`);

    let pageReferenceImages = await getCharacterReferenceImages(
        storyData.characters,
        imageData.characters || []
    );

    if (!pageReferenceImages.length) {
        pageReferenceImages = await getCharacterPhotoReferenceImages(
            storyData.characters
        );
    }

    console.log(
        `Loaded ${pageReferenceImages.length} character reference image(s) for page ${pageNumber}.`
    );

    const imageBuffer = await generateImage({
        prompt,
        referenceImages: pageReferenceImages,
        width: 768,
        height: 1024
    });

    if (!imageBuffer || !imageBuffer.length) {
        throw new Error(`No image generated for page ${pageNumber}`);
    }

    const uploadedImage = await uploadImage({
        key: `books/${bookId}/page-${pageNumber}.png`,
        buffer: imageBuffer,
        contentType: "image/png"
    });

    const result = await book.updateOne(
        { _id: bookId, "pages.pageNumber": pageNumber },
        {
            $set: {
                "pages.$.imageUrl": uploadedImage.url,
                "pages.$.storageProvider": uploadedImage.provider,
                "pages.$.storageKey": uploadedImage.key,
                "pages.$.status": "completed"
            }
        }
    );

    if (!result.matchedCount) {
        throw new Error(`Page ${pageNumber} was not found on the book`);
    }

    console.log(`Page ${pageNumber} completed using ${uploadedImage.provider}`);
};

// Runs the whole (slow) generation pipeline AFTER the HTTP response has already
// been sent. The book document (status: "generating") exists before this starts,
// so the "My Books" page can show a loading skeleton and poll until it finishes.
const generateBookInBackground = async ({
    bookId,
    mode,
    message,
    storySettings,
    characters,
    files
}) => {
    try {
        // Manual and AI mode both arrive as chosen settings (AI mode's chat
        // has already worked out age/theme/style/etc. and the story idea), so
        // they share one builder. `mode` only decides how the book is labelled.
        const storyData = buildStoryDataFromSelections(storySettings, characters);

        // AI mode: make sure the idea is on the story even if the settings
        // didn't carry it (the request `message` mirrors it).
        if (!storyData.storyIdea && typeof message === "string") {
            storyData.storyIdea = message.trim();
        }

        storyData.pageCount = BOOK_PAGE_COUNT;

        const generatedStory = await generateStory(storyData);

        console.log("Story generation completed:", generatedStory);

        if (
            !generatedStory?.title ||
            generatedStory.title === "undefined" ||
            !Array.isArray(generatedStory?.pages) ||
            generatedStory.pages.length === 0
        ) {
            throw new Error("Generated story is invalid or contains no pages");
        }

        await book.updateOne(
            { _id: bookId },
            {
                $set: {
                    title: generatedStory.title,
                    storyData,
                    pages: generatedStory.pages.map((page, index) => ({
                        position: index + 1,
                        pageNumber: index + 1, // generateStory already renumbers 1..N
                        content: normalizePageLines(page.content),
                        imageUrl: null,
                        storageProvider: null,
                        storageKey: null,
                        imagePrompt: "",
                        status: "pending"
                    }))
                }
            }
        );

        console.log("Book story saved:", bookId);

        // Upload character photos to private AWS S3
        const uploadedCharacters = [...storyData.characters];

        for (const file of files || []) {
            const match = file.fieldname.match(/^characterPhoto-(.+)$/);

            if (!match) {
                continue;
            }

            const characterId = match[1];

            const characterIndex = uploadedCharacters.findIndex(
                (character) => String(character.id) === String(characterId)
            );

            if (characterIndex === -1) {
                continue;
            }

            const extension =
                file.originalname?.split(".").pop()?.toLowerCase() || "jpg";

            const key = `characters/${bookId}/${characterId}-${crypto.randomUUID()}.${extension}`;

            const uploadedPhoto = await uploadToS3({
                key,
                buffer: file.buffer,
                contentType: file.mimetype
            });

            uploadedCharacters[characterIndex].photoUrl = uploadedPhoto.url;
            uploadedCharacters[characterIndex].photoStorageProvider =
                uploadedPhoto.provider;
            uploadedCharacters[characterIndex].photoStorageKey =
                uploadedPhoto.key;
        }

        await book.updateOne(
            { _id: bookId },
            { $set: { "storyData.characters": uploadedCharacters } }
        );

        storyData.characters = uploadedCharacters;
        let charactersWithReferences = storyData.characters;

        try {
            // Load the REAL uploaded photos so the bible step can look at
            // them instead of guessing appearance blind (this is also
            // where an animal's actual species, e.g. bison vs wolf, gets
            // picked up - there's no separate species field anywhere in
            // the form, so the photo is the only source of truth for it).
            const characterPhotosForBible = await getCharacterPhotoReferenceImages(
                storyData.characters
            );

            const characterBible = await generateCharacterBible({
                story: generatedStory,
                storyData,
                characterPhotos: characterPhotosForBible
            });

            console.log("Character Bible generated:", characterBible);

            // Don't trust the LLM to faithfully echo back hasPhoto/photoStorageKey -
            // re-attach the REAL uploaded-photo info by id/name match so a character
            // with a real photo definitely gets used as its identity source, even if
            // the model dropped or nulled those fields in its JSON output.
            const bibleCharactersWithPhotoInfo = characterBible.characters.map(
                (bibleCharacter) => {
                    const original = storyData.characters.find((character) => {
                        return (
                            String(character.id) === String(bibleCharacter.id) ||
                            String(character.name || "").toLowerCase() ===
                                String(bibleCharacter.name || "").toLowerCase()
                        );
                    });

                    if (!original) {
                        return bibleCharacter;
                    }

                    return {
                        ...bibleCharacter,
                        hasPhoto: Boolean(original.hasPhoto),
                        photoStorageProvider: original.photoStorageProvider || null,
                        photoStorageKey: original.photoStorageKey || null
                    };
                }
            );

            const bibleCharactersWithReferences = await generateCharacterReferences({
                bookId,
                characters: bibleCharactersWithPhotoInfo,
                imageStyle: storyData.imageStyle
            });

            console.log("Canonical character references generated");
            charactersWithReferences = storyData.characters.map((character) => {
                const match = bibleCharactersWithReferences.find((bibleCharacter) => {
                    return (
                        String(bibleCharacter.id) === String(character.id) ||
                        String(bibleCharacter.name || "").toLowerCase() ===
                            String(character.name || "").toLowerCase()
                    );
                });

                if (!match) {
                    return character;
                }

                return {
                    ...character,
                    referenceImageUrl: match.referenceImageUrl,
                    referenceStorageProvider: match.referenceStorageProvider,
                    referenceStorageKey: match.referenceStorageKey
                };
            });

            await book.updateOne(
                { _id: bookId },
                { $set: { "storyData.characters": charactersWithReferences } }
            );

            storyData.characters = charactersWithReferences;

            console.log("Character Bible and canonical references saved to MongoDB");
        } catch (bibleError) {
            // If the bible/reference step fails for any reason, fall back to
            // whatever raw uploaded photos exist rather than failing the whole
            // book - pages just won't have as strong an identity anchor.
            console.error(
                "Character Bible / canonical reference generation failed, falling back to uploaded photos only:",
                bibleError
            );
        }

        const imagePrompts = await generateImagePrompt(generatedStory, storyData);

        console.log("Image prompts generated");

        if (!imagePrompts?.cover?.prompt) {
            throw new Error("Cover prompt was not generated correctly");
        }

        if (!imagePrompts?.images || !Array.isArray(imagePrompts.images)) {
            throw new Error("Image prompts were not generated correctly");
        }

        await book.updateOne(
            { _id: bookId },
            { $set: { imagePrompts: imagePrompts.images } }
        );

        // -----------------------------------------------------------
        // Generate the cover (with reference photo + title overlay)
        // Generate the cover (with reference photo + title overlay)
        // -----------------------------------------------------------
        console.log("Generating cover image...");

        for (let coverAttempt = 1; coverAttempt <= 2; coverAttempt += 1) {
        try {
            let coverReferenceImages = await getCharacterReferenceImages(
                storyData.characters,
                imagePrompts.cover.characters || []
            );

            if (!coverReferenceImages.length) {
                coverReferenceImages = await getCharacterPhotoReferenceImages(
                    storyData.characters
                );
            }

            console.log(
                `Loaded ${coverReferenceImages.length} character reference image(s) for cover.`
            );

            const rawCoverBuffer = await generateImage({
                prompt: imagePrompts.cover.prompt,
                referenceImages: coverReferenceImages,
                width: 768,
                height: 1024
            });
            // The title is NOT baked into the image. The frontend (books.jsx card
            // and BookReader cover) renders it as real text, so baking it in too
            // produced a duplicate / clipped title on the cover.
            const finalCoverBuffer = rawCoverBuffer;

            const coverKey = `books/${bookId}/cover.png`;

            const uploadedCover = await uploadImage({
                key: coverKey,
                buffer: finalCoverBuffer,
                contentType: "image/png"
            });

            await book.updateOne(
                { _id: bookId },
                {
                    $set: {
                        coverImageUrl: uploadedCover.url,
                        coverStorageKey: uploadedCover.key
                    }
                }
            );

            console.log("Cover completed:", uploadedCover.url);
            break;
        } catch (coverError) {
            console.error(`Cover generation failed (attempt ${coverAttempt}/2):`, coverError);
        }
        }

        // -----------------------------------------------------------
        // Generate page images (same reference photo(s) reused)
        // Generate page images (same reference photo(s) reused)
        // -----------------------------------------------------------
        const failedPages = [];

        for (const imageData of imagePrompts.images) {
            if (!imageData?.pageNumber || !imageData?.prompt) {
                console.warn("Skipping invalid image prompt:", imageData);
                continue;
            }

            try {
                await generatePageImage({ bookId, storyData, imageData });
            } catch (pageError) {
                console.error(
                    `Page ${imageData.pageNumber} image generation failed:`,
                    pageError
                );
                failedPages.push(imageData);
            }
        }

        // Second chance for any page that failed (moderation block, timeout,
        // rate limit). A 10-page book has many more chances to hit one of
        // these, and one bad page shouldn't cost the user the whole book.
        for (const imageData of failedPages) {
            console.log(`Retrying image for page ${imageData.pageNumber}...`);

            try {
                await generatePageImage({ bookId, storyData, imageData });
            } catch (retryError) {
                console.error(
                    `Page ${imageData.pageNumber} failed again:`,
                    retryError
                );

                await book.updateOne(
                    { _id: bookId, "pages.pageNumber": imageData.pageNumber },
                    { $set: { "pages.$.status": "failed" } }
                );
            }
        }

        const completedBook = await book.findById(bookId).lean();

        const totalPages = completedBook?.pages?.length || 0;
        const unfinishedPages = (completedBook?.pages || []).filter(
            (page) => page.status !== "completed"
        ).length;
        const allPagesCompleted = totalPages > 0 && unfinishedPages === 0;

        await book.updateOne(
            { _id: bookId },
            {
                $set: allPagesCompleted
                    ? { status: "completed", completedAt: new Date(), failureReason: null }
                    : {
                        status: "failed",
                        failureReason: `${unfinishedPages} of ${totalPages} page illustrations couldn't be created. Please try again - this one wasn't counted against your plan.`
                    }
            }
        );

        console.log(`Book ${bookId} status: ${allPagesCompleted ? "completed" : "failed"}`);

    } catch (error) {
        console.error("Create book error:", error);

        // Never leave the book stuck on "generating" (= endless skeleton).
        await book
            .updateOne(
                { _id: bookId },
                { $set: { status: "failed", failureReason: GENERIC_FAILURE } }
            )
            .catch((updateError) =>
                console.error("Could not mark book as failed:", updateError)
            );
    }
};

export const createBook = async (req, res) => {
    let bookId;

    try {
        // Plan limit (basic 1 / gold 5 / premium 10 books). Checked before
        // anything is created so a blocked request costs nothing.
        const access = await canAccessFeature({ userId: req.userId, component: "book" });
        if (!access.allowed) {
            return res.status(403).json({
                success: false,
                code: access.reason,
                message: access.message,
                limit: access.limit,
                currentUsage: access.currentUsage,
                remaining: access.remaining
            });
        }

        const mode = req.body.mode;
        const message = req.body.message;

        if (mode !== "manual" && mode !== "ai") {
            return res.status(400).json({
                success: false,
                message: 'Mode must be "manual" or "ai"'
            });
        }

        const storySettings =
            typeof req.body.storySettings === "string"
                ? JSON.parse(req.body.storySettings)
                : req.body.storySettings;

        const characters =
            typeof req.body.characters === "string"
                ? JSON.parse(req.body.characters)
                : req.body.characters || [];

        if (!storySettings || Object.keys(storySettings).length === 0) {
            return res.status(400).json({
                success: false,
                message: `Story settings are required for ${mode} mode`
            });
        }

        // AI mode: the chat has already produced the full settings; the story
        // idea lives in storySettings.idea (a bare `message` isn't enough).
        if (mode === "ai") {
            const idea = storySettings.idea?.label ?? storySettings.idea;

            if (typeof idea !== "string" || !idea.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Story idea is required"
                });
            }
        }

        // Content safety net (the AI chat already checks every message).
        // Runs BEFORE the placeholder exists, so a blocked request never
        // uses up one of the user's plan books.
        const createAge = storySettings?.age?.label || storySettings?.age || null;
        const createSafety = await checkStoryText(
            collectUserText({ message, storySettings, characters }),
            { age: createAge }
        );

        if (createSafety.verdict === "block") {
            return res.status(422).json({
                success: false,
                code: "CONTENT_NOT_ALLOWED",
                message: createSafety.message
            });
        }

        // Create the book right away as a placeholder so it shows up in
        // "My Books" (as a loading skeleton) while the story + images are made.
        const placeholder = await book.create({
            user: req.userId,
            title: "Untitled Story",
            mode,
            status: "generating",
            pages: []
        });

        const usageNow = await getBookUsage(req.userId, access.startDate);
        if (usageNow > access.limit) {
            await book.deleteOne({ _id: placeholder._id });
            return res.status(403).json({
                success: false,
                code: "LIMIT_REACHED",
                message: `You've used all ${access.limit} book${access.limit === 1 ? "" : "s"} in your plan. Upgrade to create more.`,
                limit: access.limit,
                currentUsage: access.limit,
                remaining: 0
            });
        }

        bookId = placeholder._id.toString();

        // Respond immediately - the client navigates to /books and polls.
        res.status(202).json({
            success: true,
            bookId,
            status: "generating"
        });

        // Fire and forget. Errors are handled inside the worker.
        generateBookInBackground({
            bookId,
            mode,
            message: typeof message === "string" ? softenText(message, createAge) : message,
            storySettings: softenSelections(storySettings, createAge),
            characters: (characters || []).map((c) => softenStrings(c, createAge)),
            files: req.files || []
        });
    } catch (error) {
        console.error("Create book error:", error);

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: error.message || "Something went wrong"
            });
        }
    }
};


export const getMyBooks = async (req, res) => {
    try {
        // If the server restarted mid-generation the book would stay on
        // "generating" forever. Anything older than this is treated as failed.
        const STALE_MS = 45 * 60 * 1000;
        await book.updateMany(
            {
                user: req.userId,
                status: "generating",
                createdAt: { $lt: new Date(Date.now() - STALE_MS) }
            },
            {
                $set: {
                    status: "failed",
                    failureReason:
                        "Creating this book took too long and was stopped. Please try again - this one wasn't counted against your plan."
                }
            }
        );

        // Failed books are never listed. Instead the user is told once, via
        // an alert, why it failed (`failures` below); the client then calls
        // acknowledgeFailures so the alert isn't shown again.
        const failedBooks = await book
            .find({ user: req.userId, status: "failed", failureAcknowledged: false })
            .select("title failureReason")
            .sort({ createdAt: 1 })
            .lean();

        const books = await book
            .find({ user: req.userId, status: { $ne: "failed" } })
            .select("title mode status coverImageUrl storyData.theme storyData.characters.name pages.status createdAt updatedAt completedAt")
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            success: true,
            failures: failedBooks.map((b) => ({
                _id: b._id,
                title: b.title,
                reason: b.failureReason || GENERIC_FAILURE
            })),
            books: books.map((b) => {
                const pages = b.pages || [];
                return {
                    _id: b._id,
                    title: b.title,
                    mode: b.mode,
                    status: b.status,
                    coverImageUrl: b.coverImageUrl || null,
                    theme: b.storyData?.theme || null,
                    createdFor: b.storyData?.characters?.[0]?.name || null,
                    pageCount: pages.length,
                    completedPages: pages.filter((p) => p.status === "completed").length,
                    createdAt: b.createdAt,
                    updatedAt: b.updatedAt,
                    completedAt: b.completedAt || null
                };
            })
        });
    } catch (error) {
        console.error("Get my books error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch books"
        });
    }
};

// The user has seen the failure alert for these books - don't show it again.
export const acknowledgeFailures = async (req, res) => {
    try {
        const ids = (Array.isArray(req.body?.ids) ? req.body.ids : [])
            .filter((id) => mongoose.isValidObjectId(id));

        if (ids.length > 0) {
            await book.updateMany(
                { _id: { $in: ids }, user: req.userId, status: "failed" },
                { $set: { failureAcknowledged: true } }
            );
        }

        return res.json({ success: true });
    } catch (error) {
        console.error("Acknowledge failures error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update"
        });
    }
};

export const getBookById = async (req, res) => {
    try {
        const { bookId } = req.params;

        if (!mongoose.isValidObjectId(bookId)) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        const found = await book.findOne({ _id: bookId, user: req.userId }).lean();

        if (!found) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        // Only send what the reader UI needs (no prompts, storage keys or private photo URLs).
        return res.json({
            success: true,
            book: {
                _id: found._id,
                title: found.title,
                status: found.status,
                coverImageUrl: found.coverImageUrl || null,
                storyData: {
                    theme: found.storyData?.theme || null,
                    age: found.storyData?.age || null,
                    subject: found.storyData?.subject || null,
                    centralMessage: found.storyData?.centralMessage || null,
                    storyIdea: found.storyData?.storyIdea || null,
                    language: found.storyData?.language || "English",
                    font: found.storyData?.font || null,
                    characters: (found.storyData?.characters || []).map((c) => ({
                        id: c.id,
                        name: c.name,
                        type: c.type
                    }))
                },
                pages: (found.pages || [])
                    .sort((a, b) => a.position - b.position)
                    .map((p) => ({
                        _id: p._id,
                        pageNumber: p.pageNumber,
                        content: normalizePageLines(p.content),
                        imageUrl: p.imageUrl,
                        status: p.status
                    })),
                createdAt: found.createdAt,
                updatedAt: found.updatedAt
            }
        });
    } catch (error) {
        console.error("Get book error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch book"
        });
    }
};
export const testImagePrompts = async (req, res) => {
    try {
        console.log("Triggering");

        // const imagePrompts = await generateImagePrompt(generatedStory);

        // console.log(imagePrompts, "@imagePrompt");

        // const page1Prompt = imagePrompts.images[0].prompt;

        console.log("Generating image for page 1...");

        // const imageBuffer = await generateImage(page1Prompt);

        // console.log("Generated image size:", imageBuffer.length);

        // res.set("Content-Type", "image/png");
        // res.send(imageBuffer);
    } catch (error) {
        console.error("Image generation error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate image"
        });
    }
};


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.CHAT_MODEL || "gpt-4.1-mini";

const callLLM = async ({ system, messages }) => {
    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            { role: "system", content: system },
            ...messages.map((m) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content
            }))
        ],
        response_format: { type: "json_object" } // enforces valid JSON output, no markdown fences
    });

    return response.choices[0]?.message?.content ?? "";
};

/* ------------------------------------------------------------------ */
/* Allowed values — keep in sync with what your pipeline understands   */
/* ------------------------------------------------------------------ */

const ALLOWED = {
    age: OPTS.age,
    theme: OPTS.theme,
    imageStyle: OPTS.imageStyle,
    language: OPTS.language,
    font: OPTS.font,
    characterType: ["Child", "Parent", "Grandparent", "Sibling", "Friend", "Pet", "Object"]
};

const DEFAULTS = {
    age: "4–7 years",
    theme: "Adventure",
    imageStyle: OPTS.imageStyle[1], // Watercolour
    language: "English",
    font: "Rounded & Playful"
};

// subject and central message are picked from the chosen theme's own list,
// exactly like Manual mode.
const subjectsFor = (theme) => OPTS.subjectByTheme[theme] || [];
const messagesFor = (theme) => OPTS.centralmsgByTheme[theme] || [];

const MAX_QUESTIONS = 2;

/* ------------------------------------------------------------------ */
/* Prompt                                                              */
/* ------------------------------------------------------------------ */

const buildSystemPrompt = ({ state, questionsAsked, safetyNotice = "" }) => `
You are Bookie, a warm, playful assistant inside a children's picture-book app.
People type rough, casual ideas like "we are going on a road trip". Turn that into a complete story brief
silently, and talk like a friendly person, not a form.

WHAT TO DO
1. From the user's words, infer and fill: idea, theme, subject, centralmsg, imageStyle, language, font, age, characters.
   - "idea": enrich their rough input into a charming 2-3 sentence story premise (settings, mood, a small
     problem or surprise). Keep their facts (names, places, who is travelling).
   - theme: EXACTLY one of the allowed themes below (pick the closest fit, e.g. a road trip -> "Family").
   - subject: EXACTLY one of the subjects listed under the chosen theme. centralmsg: EXACTLY one of the central
     messages listed under the chosen theme. Pick the closest fit to the user's idea.
   - imageStyle, language, font, age must be EXACTLY one of the allowed values below, or null if unknown.
   - language: the language the user writes in if supported, else "English".
   - If the user names a drawing look ("watercolour", "3D", "sketch"), a language or a lettering style, use it.
   - Extra people or pets they mention (mom, dog, grandma) become characters.
2. Never ask for something you can reasonably infer or choose yourself.
3. The ONLY things you may ask about, and only if missing: who the story is for (age group) and the hero's name.
   Ask at most ONE question per reply. One friendly sentence can cover both.
4. Questions asked so far: ${questionsAsked}. If that is ${MAX_QUESTIONS} or more, do NOT ask anything.
   Make sensible assumptions and finish.
5. When you have enough, set "ready": true and reply with a short, excited recap of the enhanced story
   (2-3 sentences, mention the hero). Tell them they can type any change or press Create.
6. If the user asks for a change, update the brief, keep "ready": true, and briefly confirm what changed.
7. Keep everything already in the current brief unless the user changes it.
8. Reply style: 1-3 short sentences, warm, no lists, no headings. Never mention fields, settings, JSON or forms.
   Reply in the user's language.
9. "chips": 0-3 short tappable suggestions ONLY when you ask a question (e.g. age groups). Otherwise [].
10. CONTENT BY AGE. Keep the user's premise. Do NOT water it down. Only adjust what the age below requires:
   - 0–3 years: ${policyFor("0-3")}
   - 4–7 years: ${policyFor("4-7")}
   - 8–13 years: ${policyFor("8-13")}
   - 13–17 years: ${policyFor("13-17")}
   - 18+ years: ${policyFor("18+")}
   A hero fighting a demon lord to bring peace is a normal fantasy premise: keep it for 8+ and just describe it
   without blood or gore. Only for 0–7 turn it into outwitting or befriending. If the age is not known yet, keep the
   premise as the user wrote it and ask the age question. Never say you "made it gentle" unless you really removed something.
   Always leave out, at every age: sexual content, graphic gore or torture, hate.
${safetyNotice}

ALLOWED VALUES
age: ${JSON.stringify(ALLOWED.age)}
theme: ${JSON.stringify(ALLOWED.theme)}
subject (by theme): ${JSON.stringify(OPTS.subjectByTheme)}
centralmsg (by theme): ${JSON.stringify(OPTS.centralmsgByTheme)}
imageStyle: ${JSON.stringify(ALLOWED.imageStyle)}
language: ${JSON.stringify(ALLOWED.language)}
font: ${JSON.stringify(ALLOWED.font)}
character type: ${JSON.stringify(ALLOWED.characterType)}

CURRENT BRIEF
${JSON.stringify(state)}

OUTPUT: return ONLY a JSON object, no markdown, in exactly this shape:
{
  "reply": string,
  "storySettings": {
    "idea": string, "theme": string, "subject": string, "centralmsg": string,
    "imageStyle": string|null, "language": string|null, "font": string|null, "age": string|null
  },
  "characters": [
    { "id": string|null, "type": string, "name": string, "gender": string, "age": string, "hobbies": string, "favouriteFood": string }
  ],
  "ready": boolean,
  "chips": string[]
}
Use "" for unknown character details. The first character is the hero.
`.trim();

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const str = (v, max = 400) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";

const oneOf = (v, list) => {
    const s = str(v, 80).toLowerCase();
    return list.find((item) => item.toLowerCase() === s) || null;
};

const normalizeMessages = (messages) => {
    const out = [];

    for (const m of (Array.isArray(messages) ? messages : []).slice(-24)) {
        const role = m?.role === "assistant" ? "assistant" : "user";
        const content = str(m?.content, 2000);
        if (!content) continue;

        if (out.length === 0 && role !== "user") continue;

        const last = out[out.length - 1];
        if (last && last.role === role) {
            last.content += `\n${content}`;
        } else {
            out.push({ role, content });
        }
    }
    return out;
};

const parseJson = (raw) => {
    const cleaned = String(raw || "")
        .replace(/```json|```/g, "")
        .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON in model reply");

    return JSON.parse(cleaned.slice(start, end + 1));
};

const sanitizeCharacters = (list, previous = []) => {
    const usedIds = new Set();

    return (Array.isArray(list) ? list : [])
        .filter((c) => str(c?.name))
        .slice(0, 6)
        .map((c, index) => {
            const name = str(c.name, 60);

            // keep existing ids so uploaded photos stay attached
            const prev =
                previous.find((p) => p.id && p.id === c.id) ||
                previous.find((p) => p.name?.toLowerCase() === name.toLowerCase());

            let id = prev?.id || str(c.id, 40);
            if (!id || usedIds.has(id)) {
                id = `c${crypto.randomUUID().slice(0, 8)}`;
            }
            usedIds.add(id);

            return {
                id,
                type: oneOf(c.type, ALLOWED.characterType) || (index === 0 ? "Child" : "Friend"),
                name,
                gender: str(c.gender, 20),
                age: str(c.age, 20),
                hobbies: str(c.hobbies, 120),
                favouriteFood: str(c.favouriteFood, 120)
            };
        });
};

const sanitizeSettings = (s = {}) => {
    const theme = oneOf(s.theme, ALLOWED.theme);
    return {
        idea: str(s.idea, 1200),
        theme,
        subject: oneOf(s.subject, subjectsFor(theme)),
        centralmsg: oneOf(s.centralmsg, messagesFor(theme)),
        imageStyle: oneOf(s.imageStyle, ALLOWED.imageStyle),
        language: oneOf(s.language, ALLOWED.language),
        font: oneOf(s.font, ALLOWED.font),
        age: oneOf(s.age, ALLOWED.age)
    };
};

export const chatBook = async (req, res) => {
    try {
        const messages = normalizeMessages(req.body?.messages);

        if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
            return res.status(400).json({
                success: false,
                message: "A user message is required"
            });
        }

        const prevSettings = sanitizeSettings(req.body?.state?.storySettings);

        // ---- content safety (AI mode) -------------------------------------
        // Latest message: full check (local rules + OpenAI moderation).
        // Earlier messages: cheap local re-check only.
        const userTexts = messages.filter((m) => m.role === "user").map((m) => m.content);
        const latestText = userTexts[userTexts.length - 1];
        const knownAge = prevSettings.age;
        const earlierHardBlock = userTexts
            .slice(0, -1)
            .map((t) => findHardBlock(t, knownAge))
            .find(Boolean);
        const safety = await checkStoryText(latestText, { age: knownAge });

        if (safety.verdict === "block" || earlierHardBlock) {
            return res.status(422).json({
                success: false,
                code: "CONTENT_NOT_ALLOWED",
                message: safety.message || buildBlockMessage(earlierHardBlock)
            });
        }

        const softLabels = [
            ...new Set([...userTexts.flatMap((t) => findSoftLabels(t, knownAge)), ...safety.softLabels])
        ];
        const safetyNotice = softLabels.length
            ? `\nSAFETY NOTICE: the user's messages mention ${softLabels.join(", ")}, which is not suitable for this reader's age. Keep only that OUT of idea, theme, subject, centralmsg, characters and your recap, and swap it for a friendlier alternative. Keep everything else the user asked for.`
            : `\nAGE POLICY IN FORCE: ${knownAge ? policyFor(ageBand(knownAge)) : "age not chosen yet, keep the premise as written."}`;

        const prevCharacters = sanitizeCharacters(req.body?.state?.characters);

        const questionsAsked = messages.filter(
            (m) => m.role === "assistant" && m.content.includes("?")
        ).length;

        const raw = await callLLM({
            system: buildSystemPrompt({
                state: { storySettings: prevSettings, characters: prevCharacters },
                questionsAsked,
                safetyNotice
            }),
            messages
        });

        let parsed;
        try {
            parsed = parseJson(raw);
        } catch {
            return res.json({
                success: true,
                reply: "Sorry, I got a bit muddled. Could you tell me your story idea once more?",
                state: { storySettings: prevSettings, characters: prevCharacters },
                ready: false,
                chips: []
            });
        }

        const storySettings = sanitizeSettings(parsed.storySettings);
        const finalAge = storySettings.age || prevSettings.age;
        for (const key of Object.keys(storySettings)) {
            if (typeof storySettings[key] === "string") {
                storySettings[key] = softenText(storySettings[key], finalAge);
            }
        }
        const characters = sanitizeCharacters(parsed.characters, prevCharacters).map((c) =>
            softenStrings(c, finalAge)
        );

        // keep earlier values when the model returns null
        for (const key of Object.keys(storySettings)) {
            if (!storySettings[key] && prevSettings[key]) {
                storySettings[key] = prevSettings[key];
            }
        }

        // fill the things we never ask the user about
        storySettings.theme ||= DEFAULTS.theme;
        // subject / central message must belong to the chosen theme
        if (!subjectsFor(storySettings.theme).includes(storySettings.subject)) {
            storySettings.subject = subjectsFor(storySettings.theme)[0] || "";
        }
        if (!messagesFor(storySettings.theme).includes(storySettings.centralmsg)) {
            storySettings.centralmsg = messagesFor(storySettings.theme)[0] || "";
        }
        storySettings.imageStyle ||= DEFAULTS.imageStyle;
        storySettings.language ||= DEFAULTS.language;
        storySettings.font ||= DEFAULTS.font;

        // the two things we may ask about; stop asking after MAX_QUESTIONS
        const stillMissing = !storySettings.age || characters.length === 0;

        if (stillMissing && questionsAsked >= MAX_QUESTIONS) {
            storySettings.age ||= DEFAULTS.age;
            if (characters.length === 0) {
                characters.push({
                    id: `c${crypto.randomUUID().slice(0, 8)}`,
                    type: "Child",
                    name: "Buddy",
                    gender: "",
                    age: "",
                    hobbies: "",
                    favouriteFood: ""
                });
            }
        }

        const ready =
            Boolean(parsed.ready) &&
            Boolean(storySettings.age) &&
            characters.length > 0 &&
            Boolean(storySettings.idea);

        const chips = (Array.isArray(parsed.chips) ? parsed.chips : [])
            .map((c) => str(c, 40))
            .filter(Boolean)
            .slice(0, 3);

        let replyText = softenText(str(parsed.reply, 900), finalAge) || "Tell me more about your story!";

        // Tell the user, once, when something in their latest message was swapped out.
        if (safety.softLabels.length) {
            replyText = `${changeNote(safety.softLabels)} ${replyText}`;
        }

        return res.json({
            success: true,
            reply: replyText,
            state: { storySettings, characters },
            ready,
            chips: ready ? [] : chips
        });
    } catch (error) {
        console.error("Book chat error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Something went wrong"
        });
    }
};

export const getBookImage = async (req, res) => {
    try {
        const { bookId, index } = req.params;

        if (!mongoose.isValidObjectId(bookId)) {
            return res.status(404).json({ success: false, message: "Book not found" });
        }

        const found = await book
            .findOne({ _id: bookId, user: req.userId })
            .select("coverImageUrl pages.position pages.imageUrl")
            .lean();

        if (!found) {
            return res.status(404).json({ success: false, message: "Book not found" });
        }

        let url = null;
        if (index === "cover") {
            url = found.coverImageUrl;
        } else {
            const sorted = [...(found.pages || [])].sort((a, b) => a.position - b.position);
            url = sorted[Number(index)]?.imageUrl;
        }

        if (!url) {
            return res.status(404).json({ success: false, message: "Image not found" });
        }

        const upstream = await fetch(url);
        if (!upstream.ok) {
            return res.status(502).json({ success: false, message: "Could not load image" });
        }

        res.set("Content-Type", upstream.headers.get("content-type") || "image/png");
        res.set("Cache-Control", "private, max-age=3600");
        return res.send(Buffer.from(await upstream.arrayBuffer()));
    } catch (error) {
        console.error("Get book image error:", error);

        return res.status(500).json({ success: false, message: "Failed to load image" });
    }
};