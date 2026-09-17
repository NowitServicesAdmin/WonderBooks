import { openai } from "../config/openai.js";
import { createStoryPrompt } from "../components/storyPrompt.js";
import { analyzeStory } from "../components/storyAnalyzer.js";
import { generateImage } from "../components/imageGenerator.js";
import { generateStory } from "../components/generateStory.js";

// export const createBook = async (req, res) => {
//     try {
//         const { message } = req.body;

//         if (!message?.trim()) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Story idea is required",
//             });
//         }

//         console.log("Story idea received:", message);
//         const prompt = createStoryPrompt(message);

//         const response = await openai.responses.create({
//             model: "gpt-5-mini",
//             input: prompt,
//         });

//         console.log(response.output_text, "@prabhvua")
//         res.json({
//             success: true,
//             data: response.output_text,
//         });
//     } catch (error) {
//         console.log("Create book error:", error);

//         res.status(500).json({
//             success: false,
//             message: "Something went wrong",
//         });
//     }
// };


import { generateImagePrompt } from "../components/generateImagePrompt.js";
const generatedStory = {
    title: 'Anya and Bolt: The Mystery of the Floating Island',
    pages: [
        {
            pageNumber: 1,
            content: "Anya loved asking how things worked. She wore her safety goggles and carried a notebook full of questions. Bolt, her pet robot with glowing LED eyes, beeped happily as they played in the backyard. Suddenly, a soft glow rose above the trees—a small island was floating in the sky! Anya's eyes grew wide. A mystery! she whispered."
        },
        {
            pageNumber: 2,
            content: 'Anya leaned on science. "We need a plan," she said, drawing ideas in her notebook. Bolt opened his gadget chest and showed a folding fan, a grappling arm, and strong balloons. Anya counted how many balloons they might need and talked about lift and balance in simple words. Teamwork began: Anya would be the scientist, Bolt would handle the gadgets.'
        },
        {
            pageNumber: 3,
            content: "They built a sky-lift: a sturdy basket, lots of balloons, and Bolt's hover fan for steady air. Anya tested the lift by adding pebbles and watching how the basket rose or sank. Bolt adjusted a pulley to keep the basket level. They tested again until the basket stayed steady—trial and error mixed with measurement."
        },
        {
            pageNumber: 4,
            content: 'Floating rocks drifted toward the island like stepping stones in the clouds. Each rock had a glowing symbol and a puzzle painted on it. The puzzles were not scary; they were logic and pattern games. "We solve each puzzle to pass," said Anya. Bolt flashed his LED eyes in agreement and extended a small bridge for them to step across.'
        },
        {
            pageNumber: 5,
            content: 'The first rock had a balancing puzzle: three stones on one side and two on the other. Anya used pebbles to show how weight and distance make things tip. She moved a stone closer to the center and the scale evened out. Bolt used his clamp to hold the last piece in place. They cheered when the light turned green and the rock floated them forward.'
        },
        {
            pageNumber: 6,
            content: 'The next puzzle was shapes that must fit together to make a bridge. Anya drew the shapes in her notebook and talked about angles and fitting corners. Bolt unfolded a tiny lever and pulley to move each shape gently. Working together, they slid the pieces into place and the bridge clicked open like a smile.'
        },
        {
            pageNumber: 7,
            content: 'At last they reached the floating island. Glowing plants and friendly cloudbirds peeped at them. The island leaned to one side and its glow was dim. Bolt scanned with a soft humming sound and found scattered glowing crystals that made the island float. Anya knelt and thought: "If the crystals are out of balance, the island will tilt. We can test position and adjust."'
        },
        {
            pageNumber: 8,
            content: "The biggest test was moving the crystals. They needed gentle hands and careful measuring. Anya used string to find the island's center, and Bolt used his magnetic gripper to lift each crystal. Sometimes a crystal made the island wobble, so they tried another spot. They used a simple idea of balance: spread weight evenly around the center. It took patience, and they helped each other the whole time."
        },
        {
            pageNumber: 9,
            content: "When the last crystal clicked into place, the island steadied and glowed bright again. Tiny plants perked up and cloudbirds sang. The sky ecosystem hummed with life because balance was restored. Anya smiled and told Bolt, Our curiosity gave us the questions, and teamwork helped us find answers. Bolt's LEDs blinked like a proud nod."
        },
        {
            pageNumber: 10,
            content: 'Back in the backyard, Anya planted a small glowing seed the island had gifted them. She wrote in her notebook: curiosity + teamwork = solutions. Bolt made a chart of what they had learned about balance, lift, and taking careful measurements. They looked up at the night sky and saw the island twinkle far away. Anya whispered, "More mysteries tomorrow?" Bolt beeped, ready for the next adventure.'
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
            type: character.type,
            name: character.name,
            gender: character.gender,
            age: character.age,
            hobbies: character.hobbies,
            favouriteFood: character.favouriteFood,
            hasPhoto: Boolean(character.photo),
        })),
    };
};

export const createBook = async (req, res) => {
    try {
        const { mode, message, storySettings, characters } = req.body;
        let storyData;

        if (mode === "manual") {
            // ---------- MANUAL MODE ----------
            // Selections already came in structured from the step-by-step UI,
            // so we skip the Gemini analysis step entirely.
            if (!storySettings || Object.keys(storySettings).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Story settings are required for manual mode",
                });
            }

            storyData = buildStoryDataFromSelections(storySettings, characters);

            console.log("Manual mode story data built:", storyData);
        } else {
            // ---------- AI / CHAT MODE (original behaviour) ----------
            if (!message?.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Story idea is required",
                });
            }

            console.log("Story idea received:", message);

            // STEP 1: Gemini analyzes the user's idea
            storyData = await analyzeStory(message);

            console.log("Story analysis completed:", storyData);
        }

        // STEP 2: OpenAI generates the actual story (shared by both modes)
        const generatedStory = await generateStory(storyData);
        console.log(generatedStory, "..GeneratedStory");

        console.log("Story generation completed");

        res.json({
            success: true,
            storyData,
            story: generatedStory,
        });
    } catch (error) {
        console.error("Create book error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const testImagePrompts = async (req, res) => {
    try {
        console.log("Triggering");
        const imagePrompts = await generateImagePrompt(generatedStory);
        console.log(imagePrompts, "@imagePrompt");

        const page1Prompt = imagePrompts.images[1].prompt;

        console.log("Generating image for page 1...");

        const imageBuffer = await generateImage(page1Prompt);

        console.log("Generated image size:", imageBuffer.length);

        res.set("Content-Type", "image/jpeg");
        res.send(imageBuffer);
    } catch (error) {
        console.error("Image generation error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate image"
        });
    }
};