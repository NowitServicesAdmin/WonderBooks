// Buckets any age-group string (however it's phrased across the different
// creation flows, e.g. "0–3 years", "4-7 years", "9-12 years", "18+ years")
// into the five bands the product defines, and returns the exact
// per-page length rule for that band.
const getAgeLengthRule = (age) => {
    const raw = String(age || "").toLowerCase();
    const isAdult = /18\s*\+|18\s*plus|\badult/.test(raw);
    const numbers = (raw.match(/\d+/g) || []).map(Number);
    const min = numbers.length ? Math.min(...numbers) : 5;

    if (isAdult || min >= 18) {
        return {
            band: "18+ years",
            rule: "Each page's content MUST be a full page of text: roughly 20-28 sentences (approximately 250-350 words). Use rich, fully developed prose."
        };
    }

    if (min >= 13) {
        return {
            band: "13-17 years",
            rule: "Each page's content MUST be about half a page of text: roughly 10-14 sentences (approximately 120-180 words)."
        };
    }

    if (min >= 8) {
        return {
            band: "8-13 years",
            rule: "Each page's content MUST be exactly 8 to 9 sentences/lines. Not fewer than 8, not more than 9."
        };
    }

    if (min >= 4) {
        return {
            band: "4-7 years",
            rule: "Each page's content MUST be exactly 4 to 6 short sentences/lines. Not fewer than 4, not more than 6."
        };
    }

    return {
        band: "0-3 years",
        rule: "Each page's content MUST be exactly 3 to 4 very short, simple sentences/lines. Not fewer than 3, not more than 4."
    };
};

export const generateStoryPrompt = (storyData) => {
    const pageCount = Number(storyData.pageCount) || 10;
    const ageLength = getAgeLengthRule(storyData.age);

    return `
You are a professional children's storybook writer for WonderBook.

Create a complete, original, engaging story based strictly on the information provided below.

The story must feel like a real published storybook written specifically for the target reader.

STORY INFORMATION:

Target Age Group:
${storyData.age}

Theme:
${storyData.theme}

Subject / Adventure:
${storyData.subject}

Central Message:
${storyData.centralMessage}

Illustration Style:
${storyData.imageStyle}

Language:
${storyData.language}

Characters:
${storyData.characters
        .map(
            (character) => `
Character Type: ${character.type}
Name: ${character.name}
Gender: ${character.gender || "Not specified"}
Age: ${character.age || "Not specified"}
Hobbies: ${character.hobbies || "Not specified"}
Favourite Food: ${character.favouriteFood || "Not specified"}
`
        )
        .join("\n")}

IMPORTANT CHARACTER REQUIREMENTS:

1. Use the provided characters as the main characters of the story.
2. Do not rename the characters.
3. Do not change their basic characteristics.
4. Keep their personalities and relationships consistent throughout the story.
5. Use their hobbies and interests naturally when appropriate.
6. Do not repeatedly mention character information unnaturally.
7. Do not introduce unnecessary main characters.
8. If a character is an animal, treat the character naturally as an animal while preserving the provided name and characteristics.
9. If a character is an object or toy, make it meaningful to the story without changing its identity.

AGE-APPROPRIATE WRITING:

The target age group is:
${storyData.age}

Adapt the entire story to this age group.

For younger children:

- Use simple and familiar vocabulary.
- Use short and clear sentences.
- Keep paragraphs short.
- Use simple dialogue.
- Keep emotions easy to understand.
- Make the adventure imaginative and visually interesting.
- Avoid difficult concepts and unnecessarily complicated words.

For ages 8–12:

- Use moderately descriptive language.
- Introduce stronger challenges and mysteries.
- Allow more developed character relationships.
- Use more varied vocabulary while remaining age appropriate.

For teenagers and older readers:

- Use more sophisticated vocabulary.
- Allow deeper emotional development.
- Use more complex conflicts and character decisions.
- Avoid overly childish language.

STORY STRUCTURE:

Create a complete story with a clear arc appropriate to its length:

1. A strong opening.
2. An interesting inciting event.
3. A clear adventure or problem.
4. Rising challenges (proportional to the number of pages).
5. A meaningful setback or turning point.
6. A satisfying climax.
7. A meaningful resolution.
8. A natural demonstration of the central message.

For a very short story (2-4 pages), compress this arc so each page
still represents a distinct, illustratable moment: e.g. page 1 sets
up the character and problem, later pages build tension, and the
final page resolves it with the central message.

CENTRAL MESSAGE:

The central message is:

${storyData.centralMessage}

Do not repeatedly state the moral.

Instead, demonstrate the message naturally through the characters' actions, decisions, mistakes, cooperation, and resolution.

THEME:

The story should strongly reflect:

${storyData.theme}

SUBJECT:

The main subject/adventure should be:

${storyData.subject}

Do not drift into an unrelated storyline.

STORYTELLING REQUIREMENTS:

1. Write a complete story, not an outline.
2. Do not write an educational article.
3. Do not make the story sound like an AI explanation.
4. Use natural storytelling.
5. Include dialogue where appropriate.
6. Include emotions and reactions.
7. Include wonder, curiosity, challenge, surprise, and discovery.
8. Keep the story visually interesting for later illustration.
9. Avoid repetitive scenes.
10. Every page must move the story forward.
11. Do not solve the main problem immediately (unless the page count is too short to allow for a slower build).
12. Maintain character consistency.
13. Do not introduce unrelated events.
14. Do not mention AI.
15. Do not include explanations outside the story.

PAGE REQUIREMENTS:

Generate exactly ${pageCount} pages.

Each page must contain one meaningful story moment or scene.

The pages must form one continuous story with a beginning, middle, and end.

PAGE LENGTH (STRICT — target age band: ${ageLength.band}):

${ageLength.rule}

This length rule applies to EVERY page, not just the first or last.
Do not let any page fall noticeably short of or exceed this range.
Count sentences/lines as you write each page and adjust before
moving to the next one.

ILLUSTRATION-FRIENDLY REQUIREMENTS:

Every page should describe events that can clearly be illustrated.

Avoid putting many unrelated events into one page.

Each page should contain a visually identifiable scene.

Do not include text, captions, signs, written words, or speech bubbles inside the future illustrations.

LANGUAGE:

Write the story in:
${storyData.language}

OUTPUT REQUIREMENTS:

Return ONLY valid JSON.

Use exactly this structure:

{
    "title": "",
    "pages": [
        {
            "pageNumber": 1,
            "content": ""
        }
    ]
}

Rules:

1. The title must be original.
2. The title should ideally contain 2-6 words.
3. The title must relate to the actual story.
4. Do not use "Untitled".
5. Do not use "Story" as filler.
6. Do not use the theme name alone as the title.
7. Generate exactly ${pageCount} pages.
8. Page numbers must be 1 through ${pageCount}.
9. Each page must contain meaningful story content.
9a. Each page's "content" must follow the PAGE LENGTH rule above (${ageLength.band}: ${ageLength.rule})
10. Return valid JSON only.
11. Do not use markdown.
12. Do not wrap the JSON in code fences.
13. Do not add text before or after the JSON.
`;
};