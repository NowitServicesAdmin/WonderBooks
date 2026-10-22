import { AsyncLocalStorage } from "async_hooks";

const storage = new AsyncLocalStorage();

export const runWithTokenTracking = (bookId, fn) =>
  storage.run(
    {
      bookId: String(bookId),
      startedAt: Date.now(),
      printed: false,
      categories: new Map(), // category -> { calls, input, output, total }
    },
    fn,
  );

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// Gemini, OpenAI Responses/Images (input_tokens) and OpenAI Chat
// (prompt_tokens) all name their numbers differently.
const normalizeUsage = (usage) => {
  if (!usage || typeof usage !== "object") return null;

  let input;
  let output;
  let total;

  if (usage.totalTokenCount !== undefined || usage.promptTokenCount !== undefined) {
    // Gemini. totalTokenCount already includes "thinking" tokens.
    input = num(usage.promptTokenCount) + num(usage.toolUsePromptTokenCount);
    total = num(usage.totalTokenCount);
    output = total ? Math.max(0, total - input) : num(usage.candidatesTokenCount) + num(usage.thoughtsTokenCount);
  } else {
    input = num(usage.input_tokens ?? usage.prompt_tokens);
    output = num(usage.output_tokens ?? usage.completion_tokens);
    total = num(usage.total_tokens);
  }

  if (!total) total = input + output;
  if (!total) return null;

  return { input, output, total };
};

/** Adds the usage of one finished AI call to the current book (if any). */
export const recordTokenUsage = (category, usage) => {
  const tracker = storage.getStore();
  const normalized = normalizeUsage(usage);
  if (!tracker || !normalized) return;

  const entry = tracker.categories.get(category) || {
    calls: 0,
    input: 0,
    output: 0,
    total: 0,
  };
  entry.calls += 1;
  entry.input += normalized.input;
  entry.output += normalized.output;
  entry.total += normalized.total;
  tracker.categories.set(category, entry);
};

const fmt = (n) => n.toLocaleString("en-US");

/**
 * Prints the whole-book total (once per book run). Safe to call several times.
 * @param {string} outcome e.g. "completed" or "failed"
 */
export const logBookTokenUsage = (outcome = "") => {
  const tracker = storage.getStore();
  if (!tracker || tracker.printed) return;
  tracker.printed = true;

  let calls = 0;
  let input = 0;
  let output = 0;
  let total = 0;
  for (const entry of tracker.categories.values()) {
    calls += entry.calls;
    input += entry.input;
    output += entry.output;
    total += entry.total;
  }

  const seconds = Math.round((Date.now() - tracker.startedAt) / 1000);
  const lines = [
    `===== TOKEN USAGE - Book ${tracker.bookId}${outcome ? ` (${outcome})` : ""} =====`,
  ];

  for (const [category, entry] of tracker.categories) {
    lines.push(
      `  ${category.padEnd(28)} ${String(entry.calls).padStart(3)} call(s) | input ${fmt(entry.input).padStart(9)} | output ${fmt(entry.output).padStart(9)} | total ${fmt(entry.total).padStart(9)}`,
    );
  }

  lines.push(
    `  ${"TOTAL (whole book)".padEnd(28)} ${String(calls).padStart(3)} call(s) | input ${fmt(input).padStart(9)} | output ${fmt(output).padStart(9)} | total ${fmt(total).padStart(9)}`,
    `  Total tokens for the complete book: ${fmt(total)} (generated in ${seconds}s this run)`,
    "=".repeat(60),
  );

  console.log(lines.join("\n"));
};
