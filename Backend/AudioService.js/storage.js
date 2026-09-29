import fs from "node:fs/promises";
import path from "node:path";

const AUDIO_DIR = path.resolve("uploads/audio");
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:5000";

export async function saveAudio(cacheKey, buffer) {
  const filePath = path.join(AUDIO_DIR, cacheKey);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return `${PUBLIC_BASE_URL}/audio/${cacheKey}`;
}