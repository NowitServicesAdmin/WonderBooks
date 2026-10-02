import gemini, { geminiBackup } from "../config/gemini.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// What kind of failure was it? (decides whether retrying can help)
//  quota   - 429 / RESOURCE_EXHAUSTED: retrying the SAME model only burns more quota
//  busy    - 503 / overloaded: transient, a short wait usually fixes it
//  network - fetch failed / ECONNRESET / timeouts: transient, nothing wrong with the request
//  other   - bad request, model not found, etc.
export const classifyGeminiError = (error) => {
    const status = Number(error?.status || error?.code);
    const text = [
        error?.message,
        error?.cause?.code,
        error?.cause?.message,
        typeof error?.code === "string" ? error.code : ""
    ].join(" ");

    if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(text)) return "quota";
    if (status === 500 || status === 503 || /UNAVAILABLE|overloaded|high demand/i.test(text)) return "busy";
    if (/fetch failed|ECONNRESET|ETIMEDOUT|ECONNREFUSED|EAI_AGAIN|ENOTFOUND|socket hang up|UND_ERR/i.test(text)) return "network";
    return "other";
};

/**
 * One Gemini call that survives the usual failures without wasting quota.
 *  - network / busy  -> wait and retry the same model (up to attemptsPerModel)
 *  - quota / other   -> do NOT retry the same model, move to the next model
 *                       (Gemini counts limits per model, so the fallback has its own quota)
 * If every model fails the thrown error has allModelsFailed = true, so callers
 * can stop retrying instead of hammering an API that is already refusing.
 */
export const generateContentResilient = async ({
    models,
    contents,
    config,
    attemptsPerModel = 2,
    label = "Gemini"
}) => {
    const list = [...new Set((models || []).filter(Boolean))];
    // Main key first; the backup key (if configured) is only reached when the
    // main key has failed on every model.
    const clients = [gemini, geminiBackup].filter(Boolean);
    let lastError;

    for (let clientIndex = 0; clientIndex < clients.length; clientIndex += 1) {
        const client = clients[clientIndex];
        const keyName = clientIndex === 0 ? "main key" : "backup key";

        for (const model of list) {
            for (let attempt = 1; attempt <= attemptsPerModel; attempt += 1) {
                try {
                    return await client.models.generateContent({ model, contents, config });
                } catch (error) {
                    lastError = error;
                    const kind = classifyGeminiError(error);

                    console.warn(
                        `${label}: ${model} (${keyName}) failed (${kind}, attempt ${attempt}/${attemptsPerModel}):`,
                        error?.message || error
                    );

                    if (kind === "quota" || kind === "other") break;

                    if (attempt < attemptsPerModel) {
                        await sleep(1500 * attempt + Math.random() * 300);
                    }
                }
            }
        }
    }

    const failure = lastError || new Error(`${label}: no Gemini model available.`);
    failure.allModelsFailed = true;
    throw failure;
};