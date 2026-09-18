import crypto from "crypto";
import { uploadToS3 } from "../services/s3Service.js";
import { analyzeStory } from "../components/storyAnalyzer.js";
import { generateImage } from "../components/imageGenerator.js";
import { generateStory } from "../components/generateStory.js";
import { generateImagePrompt } from "../components/generateImagePrompt.js";
import { uploadImage } from "../services/storageService.js";
import book from "../models/Book.js";
const test_story= {
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
}

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

export const createBook = async (req, res) => {
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

        let storyData;

        if (mode === "manual") {
            if (!storySettings || Object.keys(storySettings).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Story settings are required for manual mode"
                });
            }

            storyData = buildStoryDataFromSelections(
                storySettings,
                characters
            );

            console.log(
                "Manual mode story data built:",
                storyData
            );
        } else {
            if (!message?.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Story idea is required"
                });
            }

            console.log("Story idea received:", message);

            storyData = await analyzeStory(message);

            console.log(
                "Story analysis completed:",
                storyData
            );
        }

        // Generate story
        // const generatedStory = await generateStory(storyData);

        const generatedStory = test_story;

        console.log(
            "Story generation completed:",
            generatedStory
        );

        if (
            !generatedStory?.title ||
            generatedStory.title === "undefined" ||
            !Array.isArray(generatedStory?.pages) ||
            generatedStory.pages.length === 0
        ) {
            throw new Error(
                "Generated story is invalid or contains no pages"
            );
        }

        // Create book first so we have bookId
        const new_book = await book.create({
            title: generatedStory.title,
            mode: mode === "manual" ? "manual" : "ai",
            status: "generating",
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
        });

        const bookId = new_book._id.toString();

        console.log(
            "Book created:",
            bookId
        );

        // Upload character photos to private AWS S3
        const uploadedCharacters = [...storyData.characters];

        for (const file of req.files || []) {
            const match = file.fieldname.match(
                /^characterPhoto-(.+)$/
            );

            if (!match) {
                console.warn(
                    "Skipping unknown uploaded file:",
                    file.fieldname
                );
                continue;
            }

            const characterId = match[1];

            const characterIndex =
                uploadedCharacters.findIndex(
                    (character) =>
                        String(character.id) ===
                        String(characterId)
                );

            if (characterIndex === -1) {
                console.warn(
                    "Character not found for file:",
                    file.originalname
                );
                continue;
            }

            const extension =
                file.originalname
                    ?.split(".")
                    .pop()
                    ?.toLowerCase() || "jpg";

            const key = `characters/${bookId}/${characterId}-${crypto.randomUUID()}.${extension}`;

            console.log(
                `Uploading photo for character ${uploadedCharacters[characterIndex].name}...`
            );

            const uploadedPhoto = await uploadToS3({
                key,
                buffer: file.buffer,
                contentType: file.mimetype
            });

            uploadedCharacters[characterIndex].photoUrl =
                uploadedPhoto.url;

            uploadedCharacters[characterIndex].photoStorageProvider =
                uploadedPhoto.provider;

            uploadedCharacters[characterIndex].photoStorageKey =
                uploadedPhoto.key;

            console.log(
                `Character photo uploaded: ${uploadedPhoto.url}`
            );
        }

        // Save character photo URLs and storage information
        await book.updateOne(
            { _id: bookId },
            {
                $set: {
                    "storyData.characters": uploadedCharacters
                }
            }
        );

        // Update local storyData so image prompt generation
        // receives the uploaded photo information
        storyData.characters = uploadedCharacters;

        console.log(
            "Character photos saved to MongoDB"
        );

        // Generate image prompts
        const imagePrompts =
            await generateImagePrompt(
                generatedStory,
                storyData
            );

        console.log(
            "Image prompts generated"
        );

        if (
            !imagePrompts?.images ||
            !Array.isArray(imagePrompts.images)
        ) {
            throw new Error(
                "Image prompts were not generated correctly"
            );
        }

        // Save all generated prompts
        await book.updateOne(
            { _id: bookId },
            {
                $set: {
                    imagePrompts: imagePrompts.images
                }
            }
        );

        // Generate page images
        for (const imageData of imagePrompts.images) {
            const pageNumber = imageData.pageNumber;
            const prompt = imageData.prompt;

            if (!pageNumber || !prompt) {
                console.warn(
                    "Skipping invalid image prompt:",
                    imageData
                );
                continue;
            }

            try {
                await book.updateOne(
                    {
                        _id: bookId,
                        "pages.pageNumber": pageNumber
                    },
                    {
                        $set: {
                            "pages.$.status": "generating",
                            "pages.$.imagePrompt": prompt
                        }
                    }
                );

                console.log(
                    `Generating image for page ${pageNumber}...`
                );

                const imageBuffer =
                    await generateImage(prompt);

                if (
                    !imageBuffer ||
                    !imageBuffer.length
                ) {
                    throw new Error(
                        `No image generated for page ${pageNumber}`
                    );
                }

                console.log(
                    `Generated image size: ${imageBuffer.length}`
                );

                const key =
                    `books/${bookId}/page-${pageNumber}.png`;

                const uploadedImage =
                    await uploadImage({
                        key,
                        buffer: imageBuffer,
                        contentType: "image/png"
                    });

                await book.updateOne(
                    {
                        _id: bookId,
                        "pages.pageNumber": pageNumber
                    },
                    {
                        $set: {
                            "pages.$.imageUrl":
                                uploadedImage.url,
                            "pages.$.storageProvider":
                                uploadedImage.provider,
                            "pages.$.storageKey":
                                uploadedImage.key,
                            "pages.$.status":
                                "completed"
                        }
                    }
                );

                console.log(
                    `Page ${pageNumber} completed using ${uploadedImage.provider}`
                );
            } catch (pageError) {
                console.error(
                    `Page ${pageNumber} image generation failed:`,
                    pageError
                );

                await book.updateOne(
                    {
                        _id: bookId,
                        "pages.pageNumber": pageNumber
                    },
                    {
                        $set: {
                            "pages.$.status": "failed"
                        }
                    }
                );
            }
        }

        const completedBook =
            await book.findById(bookId).lean();

        const allPagesCompleted =
            completedBook?.pages?.length > 0 &&
            completedBook.pages.every(
                (page) =>
                    page.status === "completed"
            );

        await book.updateOne(
            { _id: bookId },
            {
                $set: {
                    status: allPagesCompleted
                        ? "completed"
                        : "failed"
                }
            }
        );

        console.log(
            `Book ${bookId} status: ${allPagesCompleted ? "completed" : "failed"}`
        );

        return res.json({
            success: true,
            bookId,
            status: allPagesCompleted
                ? "completed"
                : "failed"
        });
    } catch (error) {
        console.error(
            "Create book error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Something went wrong"
        });
    }
};

export const getBookById = async (req, res) => {
    try {
        const { bookId } = req.params;

        const book = await Book.findById(bookId).lean();

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        book.pages = (book.pages || []).sort((a, b) => a.position - b.position);

        return res.json({
            success: true,
            book
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

        const imagePrompts = await generateImagePrompt(generatedStory);

        console.log(imagePrompts, "@imagePrompt");

        const page1Prompt = imagePrompts.images[0].prompt;

        console.log("Generating image for page 1...");

        const imageBuffer = await generateImage(page1Prompt);

        console.log("Generated image size:", imageBuffer.length);

        res.set("Content-Type", "image/png");
        res.send(imageBuffer);
    } catch (error) {
        console.error("Image generation error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate image"
        });
    }
};