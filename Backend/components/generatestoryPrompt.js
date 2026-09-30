// Buckets any age-group string (however it's phrased across the different
// creation flows, e.g. "0–3 years", "4-7 years", "9-12 years", "18+ years")
// into the five bands the product defines, and returns the exact
const CONTENT_BY_BAND = {
    "0-3 years": "Very gentle only. No conflict, villains, danger or fear. Warm, simple everyday moments.",
    "4-7 years": "Gentle. A villain or problem may appear but is solved by cleverness, kindness or friendship. Do not show fighting. Nothing frightening.",
    "8-13 years": "Adventure and action are welcome. The hero may face monsters and villains and win a real showdown through courage, magic, skill and teamwork. Keep it non-graphic: no blood, gore, gruesome injury or death.",
    "13-17 years": "Epic fantasy is welcome. Real stakes, serious battles, sacrifice, loss and darker themes are fine when handled non-graphically.",
    "18+ years": "Mature storytelling is welcome. Dark fantasy, war, tragedy and morally complex villains are fine when handled non-graphically.",
};

const contentRuleFor = (band) => CONTENT_BY_BAND[band] || CONTENT_BY_BAND["8-13 years"];

// Each page is written as flowing paragraph(s) - never as separate lines or
// points. Length is measured in how many lines of text the page fills. A short
// page (few lines) is a single paragraph; a longer page (many lines) is split
// into 2-3 paragraphs separated by a blank line.
const LENGTH_SPECS = {
    "0-3 years": { minLines: 3, maxLines: 4, minWords: 12, maxWords: 20, paras: "ONE paragraph" },
    "4-7 years": { minLines: 4, maxLines: 6, minWords: 25, maxWords: 40, paras: "ONE paragraph" },
    "8-13 years": { minLines: 8, maxLines: 9, minWords: 60, maxWords: 75, paras: "1 or 2 short paragraphs" },
    "13-17 years": { minLines: 10, maxLines: 14, minWords: 120, maxWords: 180, paras: "2 paragraphs" },
    "18+ years": { minLines: 20, maxLines: 28, minWords: 250, maxWords: 350, paras: "2 to 3 paragraphs" },
};

const buildLengthRule = (band) => {
    const spec = LENGTH_SPECS[band];
    return {
        band,
        ...spec,
        rule:
            `Each page's content MUST fill about ${spec.minLines} to ${spec.maxLines} lines of text ` +
            `(roughly ${spec.minWords}-${spec.maxWords} words), written as ${spec.paras} ` +
            `of natural flowing prose. Do not break it into separate lines or points.`
    };
};

const getAgeLengthRule = (age) => {
    const raw = String(age || "").toLowerCase();
    const isAdult = /18\s*\+|18\s*plus|\badult/.test(raw);
    const numbers = (raw.match(/\d+/g) || []).map(Number);
    const min = numbers.length ? Math.min(...numbers) : 5;

    if (isAdult || min >= 18) return buildLengthRule("18+ years");
    if (min >= 13) return buildLengthRule("13-17 years");
    if (min >= 8) return buildLengthRule("8-13 years");
    if (min >= 4) return buildLengthRule("4-7 years");
    return buildLengthRule("0-3 years");
};

// Safety net used after generation: keep real paragraph breaks (blank line)
// but merge any single line breaks the model added into normal spaces.
export const normalizePageLines = (content) =>
    String(content || "")
        .replace(/\r/g, "")
        .split(/\n\s*\n/)
        .map((para) => para.split("\n").map((l) => l.trim()).filter(Boolean).join(" "))
        .filter(Boolean)
        .join("\n\n");

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

${storyData.storyIdea ? `Story Idea (the user's own premise - build the story around this):
${storyData.storyIdea}

` : ""}Theme:
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

This applies to EVERY page, not just the first or last.

IMPORTANT - PARAGRAPHS, NOT POINTS:
- Write each page as smooth, connected paragraph(s) of normal storybook prose.
- Use complete, natural sentences and END EVERY SENTENCE WITH PROPER PUNCTUATION
  (a full stop "." or "?" or "!"). Keep the full stops.
- Do NOT write fragments, poetry, rhyming verse, or short chopped phrases.
- Do NOT put each sentence on its own line, and do NOT use bullet points or lists.
- The length is measured in LINES OF TEXT on the page (${ageLength.minLines}-${ageLength.maxLines} lines,
  about ${ageLength.minWords}-${ageLength.maxWords} words), NOT in number of sentences.
  Use as many or as few sentences as needed to fill that space naturally.
- Number of paragraphs for this age group: ${ageLength.paras}.
  A page with only a few lines is a single paragraph. Only longer pages are split into
  more paragraphs. When a page has more than one paragraph, separate the paragraphs with
  a blank line (two line breaks, "\\n\\n") inside the "content" string. Never use a single
  line break inside a paragraph.

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

CONTENT RULES FOR THIS AGE GROUP (${ageLength.band}) (mandatory):

${contentRuleFor(ageLength.band)}

Keep the user's premise and characters. Only adjust the intensity to the
age group above. Never add more mature content than the age group allows,
and never water the story down below what the age group allows.

At every age, leave out: sexual content, graphic gore or torture, and hate.

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
9a. Each page's "content" must follow the PAGE LENGTH rule above (${ageLength.band}: about ${ageLength.minLines}-${ageLength.maxLines} lines of text, ${ageLength.minWords}-${ageLength.maxWords} words, ${ageLength.paras})
9b. Each page's "content" must be flowing paragraph(s) with normal sentence punctuation (full stops kept) - no bullet points, no lists, no one-sentence-per-line. Use "\\n\\n" only to separate paragraphs, and only when this age group allows more than one paragraph.
10. Return valid JSON only.
11. Do not use markdown.
12. Do not wrap the JSON in code fences.
13. Do not add text before or after the JSON.
`;
};