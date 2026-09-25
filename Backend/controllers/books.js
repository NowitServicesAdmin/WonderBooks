import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import mongoose from "mongoose";
import book from "../models/book.js";
import { analyzeStory } from "../components/storyAnalyzer.js";
import { generateStory } from "../components/generateStory.js";
import { generateImagePrompt } from "../components/generateImagePrompt.js";
import { generateImage } from "../components/imageGenerator.js";
import { uploadToS3 } from "../services/s3Service.js";
// import { uploadImage, getFromR2 } from "../services/storageService.js";
import {
    uploadImage,
    getStorageImage
} from "../services/storageService.js";
import { getCharacterPhotoReferenceImages } from "../components/characterPhotoReferences.js";

const test_story = {
    title: "Cherry's Jungle Adventure",
    pages: [
        {
            pageNumber: 1,
            content: 'Cherry sits by the edge of the jungle. He draws a blue waterfall on his paper. Puppy curls up at his feet. The red Car sits ready on the grass.'
        },
        {
            pageNumber: 2,
            content: `Cherry holds up his picture. "Let's find this!" he says. Puppy wags and bounces. The red Car waits to be pushed.`
        },
        {
            pageNumber: 3,
            content: 'They walk into the jungle. Big green leaves brush their heads. Little birds sing. The path is soft under their feet.'
        },
        {
            pageNumber: 4,
            content: 'A small stream runs across the path. The red Car gets stuck in the mud. Cherry looks at the water and feels unsure. Puppy splashes and tries to pull.'
        },
        {
            pageNumber: 5,
            content: 'Cherry finds shiny stones on the ground. He draws a little arrow on his paper. The stones make a bright path. They follow the sparkling trail.'
        },
        {
            pageNumber: 6,
            content: 'Rain falls hard. Drops drum on leaves. A big log falls and blocks the way. The red Car is trapped behind the log. Puppy hides close to Cherry.'
        },
        {
            pageNumber: 7,
            content: 'They work together. Puppy digs with his paws. Cherry pushes the red Car with all his hands. Cherry uses a stick and Pry, and the log moves. They cheer together.'
        },
        {
            pageNumber: 8,
            content: 'A loud roar fills the air. The waterfall is near. A dark cave stands before them. Cherry holds his drawing tight. He takes a small brave breath.'
        },
        {
            pageNumber: 9,
            content: 'Cherry steps into the cave first. Puppy stays very close. The red Car rolls beside them. Water sparkles ahead. They walk out and see the bright waterfall.'
        },
        {
            pageNumber: 10,
            content: 'They sit on a warm rock and share pizza. Cherry draws the waterfall again, smiling. Puppy licks his hand. The red Car shines in the sun. They go home feeling proud and close.'
        }
    ]
};

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

// Get canonical character reference images from R2
// const getCharacterReferenceImages = async (
//     characters = [],
//     characterReferences = []
// ) => {
//     const references = [];

//     for (const characterReference of characterReferences) {
//         const lookupValue =
//             String(characterReference || "")
//                 .trim()
//                 .toLowerCase();

//         if (!lookupValue) {
//             continue;
//         }

//         // Match by character ID first
//         // and fall back to character name
//         const character = characters.find(
//             (item) => {
//                 const characterId =
//                     String(item?.id || "")
//                         .trim()
//                         .toLowerCase();

//                 const characterName =
//                     String(item?.name || "")
//                         .trim()
//                         .toLowerCase();

//                 return (
//                     characterId === lookupValue ||
//                     characterName === lookupValue
//                 );
//             }
//         );

//         if (!character) {
//             console.warn(
//                 `Character reference not found for: ${characterReference}`
//             );
//             continue;
//         }

//         if (!character.referenceStorageKey) {
//             console.warn(
//                 `No canonical reference found for character: ${character.name} (${character.id})`
//             );
//             continue;
//         }

//         try {
//             console.log(
//                 `Loading canonical reference for ${character.name} (${character.id})...`
//             );

//             const response =
//                 await getStorageImage(
//                     character.referenceStorageKey
//                 );

//             if (!response?.Body) {
//                 console.warn(
//                     `Empty R2 reference for character: ${character.name}`
//                 );
//                 continue;
//             }

//             const bytes =
//                 await response.Body.transformToByteArray();

//             if (!bytes?.length) {
//                 console.warn(
//                     `Empty reference buffer for character: ${character.name}`
//                 );
//                 continue;
//             }

//             references.push({
//                 buffer: Buffer.from(bytes),
//                 contentType: "image/png"
//             });

//             console.log(
//                 `Reference loaded for ${character.name}`
//             );
//         } catch (error) {
//             console.error(
//                 `Failed to load reference for character ${character.name}:`,
//                 error
//             );
//         }
//     }

//     return references.slice(0, 4);
// };

// export const createBook = async (req, res) => {
//     try {
//         const mode = req.body.mode;
//         const message = req.body.message;

//         const storySettings =
//             typeof req.body.storySettings === "string"
//                 ? JSON.parse(req.body.storySettings)
//                 : req.body.storySettings;

//         const characters =
//             typeof req.body.characters === "string"
//                 ? JSON.parse(req.body.characters)
//                 : req.body.characters || [];

//         let storyData;

//         if (mode === "manual") {
//             if (
//                 !storySettings ||
//                 Object.keys(storySettings).length === 0
//             ) {
//                 return res.status(400).json({
//                     success: false,
//                     message:
//                         "Story settings are required for manual mode"
//                 });
//             }

//             storyData = buildStoryDataFromSelections(
//                 storySettings,
//                 characters
//             );

//             console.log(
//                 "Manual mode story data built:",
//                 storyData
//             );
//         } else {
//             if (!message?.trim()) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Story idea is required"
//                 });
//             }

//             console.log(
//                 "Story idea received:",
//                 message
//             );

//             storyData =
//                 await analyzeStory(message);

//             console.log(
//                 "Story analysis completed:",
//                 storyData
//             );
//         }

//         // Generate story
//         // const generatedStory = await generateStory(storyData);

//         const generatedStory = test_story;

//         console.log(
//             "Story generation completed:",
//             generatedStory
//         );

//         if (
//             !generatedStory?.title ||
//             generatedStory.title === "undefined" ||
//             !Array.isArray(generatedStory?.pages) ||
//             generatedStory.pages.length === 0
//         ) {
//             throw new Error(
//                 "Generated story is invalid or contains no pages"
//             );
//         }

//         // Create book first so we have bookId
//         const new_book = await book.create({
//             title: generatedStory.title,
//             mode: mode === "manual"
//                 ? "manual"
//                 : "ai",
//             status: "generating",
//             storyData,
//             pages: generatedStory.pages.map(
//                 (page, index) => ({
//                     position: index + 1,
//                     pageNumber:
//                         page.pageNumber ||
//                         index + 1,
//                     content:
//                         page.content || "",
//                     imageUrl: null,
//                     storageProvider: null,
//                     storageKey: null,
//                     imagePrompt: "",
//                     status: "pending"
//                 })
//             )
//         });

//         const bookId =
//             new_book._id.toString();

//         console.log(
//             "Book created:",
//             bookId
//         );

//         // Upload character photos to private AWS S3
//         const uploadedCharacters =
//             [...storyData.characters];

//         for (const file of req.files || []) {
//             const match =
//                 file.fieldname.match(
//                     /^characterPhoto-(.+)$/
//                 );

//             if (!match) {
//                 console.warn(
//                     "Skipping unknown uploaded file:",
//                     file.fieldname
//                 );
//                 continue;
//             }

//             const characterId =
//                 match[1];

//             const characterIndex =
//                 uploadedCharacters.findIndex(
//                     (character) =>
//                         String(character.id) ===
//                         String(characterId)
//                 );

//             if (characterIndex === -1) {
//                 console.warn(
//                     "Character not found for file:",
//                     file.originalname
//                 );
//                 continue;
//             }

//             const extension =
//                 file.originalname
//                     ?.split(".")
//                     .pop()
//                     ?.toLowerCase() || "jpg";

//             const key =
//                 `characters/${bookId}/${characterId}-${crypto.randomUUID()}.${extension}`;

//             console.log(
//                 `Uploading photo for character ${uploadedCharacters[characterIndex].name}...`
//             );

//             const uploadedPhoto =
//                 await uploadToS3({
//                     key,
//                     buffer: file.buffer,
//                     contentType:
//                         file.mimetype
//                 });

//             uploadedCharacters[
//                 characterIndex
//             ].photoUrl =
//                 uploadedPhoto.url;

//             uploadedCharacters[
//                 characterIndex
//             ].photoStorageProvider =
//                 uploadedPhoto.provider;

//             uploadedCharacters[
//                 characterIndex
//             ].photoStorageKey =
//                 uploadedPhoto.key;

//             console.log(
//                 `Character photo uploaded: ${uploadedPhoto.url}`
//             );
//         }

//         // Save character photo URLs and storage information
//         await book.updateOne(
//             { _id: bookId },
//             {
//                 $set: {
//                     "storyData.characters":
//                         uploadedCharacters
//                 }
//             }
//         );

//         // Update local storyData so Character Bible generation
//         // receives the uploaded photo information
//         storyData.characters =
//             uploadedCharacters;

//         console.log(
//             "Character photos saved to MongoDB"
//         );

//         // Generate the canonical Character Bible
//         const characterBible =
//             await generateCharacterBible({
//                 story: generatedStory,
//                 storyData
//             });

//         console.log(
//             "Character Bible generated:",
//             characterBible
//         );

//         // Generate canonical visual references
//         // for every recurring character
//         const charactersWithReferences =
//             await generateCharacterReferences({
//                 bookId,
//                 characters:
//                     characterBible.characters,
//                 imageStyle:
//                     storyData.imageStyle
//             });

//         console.log(
//             "Character references generated"
//         );

//         storyData.characters =
//             charactersWithReferences;

//         // Save complete Character Bible
//         // and reference metadata
//         await book.updateOne(
//             { _id: bookId },
//             {
//                 $set: {
//                     "storyData.characters":
//                         charactersWithReferences
//                 }
//             }
//         );

//         console.log(
//             "Character Bible and references saved to MongoDB"
//         );

//         // Generate image prompts
//         const imagePrompts =
//             await generateImagePrompt(
//                 generatedStory,
//                 storyData
//             );

//         console.log(
//             "Image prompts generated"
//         );

//         if (
//             !imagePrompts?.images ||
//             !Array.isArray(
//                 imagePrompts.images
//             )
//         ) {
//             throw new Error(
//                 "Image prompts were not generated correctly"
//             );
//         }

//         // Save all generated prompts
//         await book.updateOne(
//             { _id: bookId },
//             {
//                 $set: {
//                     imagePrompts:
//                         imagePrompts.images
//                 }
//             }
//         );

//         // Generate page images
//         for (
//             const imageData of
//             imagePrompts.images
//         ) {
//             const pageNumber =
//                 imageData.pageNumber;

//             const prompt =
//                 imageData.prompt;

//             if (
//                 !pageNumber ||
//                 !prompt
//             ) {
//                 console.warn(
//                     "Skipping invalid image prompt:",
//                     imageData
//                 );
//                 continue;
//             }

//             try {
//                 await book.updateOne(
//                     {
//                         _id: bookId,
//                         "pages.pageNumber":
//                             pageNumber
//                     },
//                     {
//                         $set: {
//                             "pages.$.status":
//                                 "generating",
//                             "pages.$.imagePrompt":
//                                 prompt
//                         }
//                     }
//                 );

//                 console.log(
//                     `Generating image for page ${pageNumber}...`
//                 );

//                 // Only send the canonical references
//                 // for characters that appear on this page
//                 const referenceImages =
//                     await getCharacterReferenceImages(
//                         storyData.characters,
//                         imageData.characters || []
//                     );

//                 console.log(
//                     `Page ${pageNumber} character references:`,
//                     imageData.characters || []
//                 );

//                 const imageBuffer =
//                     await generateImage({
//                         prompt,
//                         referenceImages,
//                         width: 768,
//                         height: 1024
//                     });

//                 if (
//                     !imageBuffer ||
//                     !imageBuffer.length
//                 ) {
//                     throw new Error(
//                         `No image generated for page ${pageNumber}`
//                     );
//                 }

//                 console.log(
//                     `Generated image size: ${imageBuffer.length}`
//                 );

//                 const key =
//                     `books/${bookId}/page-${pageNumber}.png`;

//                 const uploadedImage =
//                     await uploadImage({
//                         key,
//                         buffer:
//                             imageBuffer,
//                         contentType:
//                             "image/png"
//                     });

//                 await book.updateOne(
//                     {
//                         _id: bookId,
//                         "pages.pageNumber":
//                             pageNumber
//                     },
//                     {
//                         $set: {
//                             "pages.$.imageUrl":
//                                 uploadedImage.url,
//                             "pages.$.storageProvider":
//                                 uploadedImage.provider,
//                             "pages.$.storageKey":
//                                 uploadedImage.key,
//                             "pages.$.status":
//                                 "completed"
//                         }
//                     }
//                 );

//                 console.log(
//                     `Page ${pageNumber} completed using ${uploadedImage.provider}`
//                 );
//             } catch (pageError) {
//                 console.error(
//                     `Page ${pageNumber} image generation failed:`,
//                     pageError
//                 );

//                 await book.updateOne(
//                     {
//                         _id: bookId,
//                         "pages.pageNumber":
//                             pageNumber
//                     },
//                     {
//                         $set: {
//                             "pages.$.status":
//                                 "failed"
//                         }
//                     }
//                 );
//             }
//         }

//         const completedBook =
//             await book.findById(
//                 bookId
//             ).lean();

//         const allPagesCompleted =
//             completedBook?.pages?.length > 0 &&
//             completedBook.pages.every(
//                 (page) =>
//                     page.status ===
//                     "completed"
//             );

//         await book.updateOne(
//             { _id: bookId },
//             {
//                 $set: {
//                     status:
//                         allPagesCompleted
//                             ? "completed"
//                             : "failed"
//                 }
//             }
//         );

//         console.log(
//             `Book ${bookId} status: ${allPagesCompleted ? "completed" : "failed"}`
//         );

//         return res.json({
//             success: true,
//             bookId,
//             status:
//                 allPagesCompleted
//                     ? "completed"
//                     : "failed"
//         });
//     } catch (error) {
//         console.error(
//             "Create book error:",
//             error
//         );

//         return res.status(500).json({
//             success: false,
//             message:
//                 error.message ||
//                 "Something went wrong"
//         });
//     }
// };

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
        let storyData;

        if (mode === "manual") {
            storyData = buildStoryDataFromSelections(storySettings, characters);
        } else {
            storyData = await analyzeStory(message);
            storyData.storyIdea = message.trim();
        }

        // TEST MODE: run a short 2-page story instead of the full flow.
        // Remove this block once you're ready to generate real books.
        storyData.pageCount = 2;

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
                        pageNumber: page.pageNumber || index + 1,
                        content: page.content || "",
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

        const referenceImages = await getCharacterPhotoReferenceImages(
            storyData.characters
        );

        console.log(
            `Loaded ${referenceImages.length} character reference photo(s) for generation.`
        );

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

        try {
            const rawCoverBuffer = await generateImage({
                prompt: imagePrompts.cover.prompt,
                referenceImages,
                referenceImages,
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
        } catch (coverError) {
            console.error("Cover generation failed:", coverError);
        }

        // -----------------------------------------------------------
        // Generate page images (same reference photo(s) reused)
        // Generate page images (same reference photo(s) reused)
        // -----------------------------------------------------------
        for (const imageData of imagePrompts.images) {
            const pageNumber = imageData.pageNumber;
            const prompt = imageData.prompt;

            if (!pageNumber || !prompt) {
                console.warn("Skipping invalid image prompt:", imageData);
                continue;
            }

            try {
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

                const imageBuffer = await generateImage({
                    prompt,
                    referenceImages,
                    width: 768,
                    height: 1024
                });

                if (!imageBuffer || !imageBuffer.length) {
                    throw new Error(`No image generated for page ${pageNumber}`);
                }

                const key = `books/${bookId}/page-${pageNumber}.png`;

                const uploadedImage = await uploadImage({
                    key,
                    buffer: imageBuffer,
                    contentType: "image/png"
                });

                await book.updateOne(
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

                console.log(`Page ${pageNumber} completed using ${uploadedImage.provider}`);
            } catch (pageError) {
                console.error(`Page ${pageNumber} image generation failed:`, pageError);

                await book.updateOne(
                    { _id: bookId, "pages.pageNumber": pageNumber },
                    { $set: { "pages.$.status": "failed" } }
                );
            }
        }

        const completedBook = await book.findById(bookId).lean();

        const allPagesCompleted =
            completedBook?.pages?.length > 0 &&
            completedBook.pages.every((page) => page.status === "completed");

        await book.updateOne(
            { _id: bookId },
            { $set: { status: allPagesCompleted ? "completed" : "failed" } }
        );

        console.log(`Book ${bookId} status: ${allPagesCompleted ? "completed" : "failed"}`);

    } catch (error) {
        console.error("Create book error:", error);

        // Never leave the book stuck on "generating" (= endless skeleton).
        await book
            .updateOne({ _id: bookId }, { $set: { status: "failed" } })
            .catch((updateError) =>
                console.error("Could not mark book as failed:", updateError)
            );
    }
};

export const createBook = async (req, res) => {
    let bookId;

    try {
        const mode = req.body.mode;
        const message = req.body.message;

        const storySettings =
            typeof req.body.storySettings === "string"
                ? JSON.parse(req.body.storySettings)
                : req.body.storySettings;

        const characters =
            typeof req.body.characters === "string"
                ? JSON.parse(req.body.characters)
                : req.body.characters || [];

        if (mode === "manual") {
            if (!storySettings || Object.keys(storySettings).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Story settings are required for manual mode"
                });
            }
        } else if (!message?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Story idea is required"
            });
        }

        // Create the book right away as a placeholder so it shows up in
        // "My Books" (as a loading skeleton) while the story + images are made.
        const placeholder = await book.create({
            user: req.userId,
            title: "Untitled Story",
            mode: mode === "manual" ? "manual" : "ai",
            status: "generating",
            pages: []
        });

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
            message,
            storySettings,
            characters,
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
            { $set: { status: "failed" } }
        );

        const books = await book
            .find({ user: req.userId })
            .select("title mode status coverImageUrl storyData.theme storyData.characters.name pages.status createdAt updatedAt")
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            success: true,
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
                    updatedAt: b.updatedAt
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
                        content: p.content,
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
    age: ["0-2 years", "3-5 years", "6-8 years", "9-12 years"],
    imageStyle: ["Watercolor", "Cartoon", "3D animated", "Pencil sketch", "Flat vector"],
    language: ["English", "Hindi", "Spanish", "French", "German"],
    font: ["Rounded & Playful", "Classic Storybook", "Clean & Simple", "Handwritten"],
    characterType: ["Child", "Parent", "Grandparent", "Sibling", "Friend", "Pet"]
};

const DEFAULTS = {
    age: "3-5 years",
    theme: "Adventure",
    subject: "Family",
    centralmsg: "Be kind",
    imageStyle: "Watercolor",
    language: "English",
    font: "Rounded & Playful"
};

const MAX_QUESTIONS = 2;

/* ------------------------------------------------------------------ */
/* Prompt                                                              */
/* ------------------------------------------------------------------ */

const buildSystemPrompt = ({ state, questionsAsked }) => `
You are Bookie, a warm, playful assistant inside a children's picture-book app.
People type rough, casual ideas like "we are going on a road trip". Turn that into a complete story brief
silently, and talk like a friendly person, not a form.

WHAT TO DO
1. From the user's words, infer and fill: idea, theme, subject, centralmsg, imageStyle, language, font, age, characters.
   - "idea": enrich their rough input into a charming 2-3 sentence story premise (settings, mood, a small
     problem or surprise). Keep their facts (names, places, who is travelling).
   - theme / subject / centralmsg: short free-text labels (1-4 words), e.g. "Adventure", "Family road trip", "Togetherness".
   - imageStyle, language, font, age must be EXACTLY one of the allowed values below, or null if unknown.
   - language: the language the user writes in if supported, else "English".
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

ALLOWED VALUES
age: ${JSON.stringify(ALLOWED.age)}
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

const sanitizeSettings = (s = {}) => ({
    idea: str(s.idea, 1200),
    theme: str(s.theme, 60),
    subject: str(s.subject, 80),
    centralmsg: str(s.centralmsg, 80),
    imageStyle: oneOf(s.imageStyle, ALLOWED.imageStyle),
    language: oneOf(s.language, ALLOWED.language),
    font: oneOf(s.font, ALLOWED.font),
    age: oneOf(s.age, ALLOWED.age)
});

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
        const prevCharacters = sanitizeCharacters(req.body?.state?.characters);

        const questionsAsked = messages.filter(
            (m) => m.role === "assistant" && m.content.includes("?")
        ).length;

        const raw = await callLLM({
            system: buildSystemPrompt({
                state: { storySettings: prevSettings, characters: prevCharacters },
                questionsAsked
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
        const characters = sanitizeCharacters(parsed.characters, prevCharacters);

        // keep earlier values when the model returns null
        for (const key of Object.keys(storySettings)) {
            if (!storySettings[key] && prevSettings[key]) {
                storySettings[key] = prevSettings[key];
            }
        }

        // fill the things we never ask the user about
        storySettings.theme ||= DEFAULTS.theme;
        storySettings.subject ||= DEFAULTS.subject;
        storySettings.centralmsg ||= DEFAULTS.centralmsg;
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

        return res.json({
            success: true,
            reply: str(parsed.reply, 900) || "Tell me more about your story!",
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
