const API_BASE = "http://localhost:5000";

// If your self-hosted server ever returns raw audio bytes instead of
// { audioUrl }, change generateSpeech() below — everything else stays the same.

export async function fetchVoices() {
  const res = await fetch(`${API_BASE}/api/voices`);
  if (!res.ok) throw new Error("Failed to load voices");
  return res.json(); // expected: [{ id, name, ... }]
}

export async function generateSpeech({ bookId, pageId, text, voiceId }) {
  const res = await fetch(`${API_BASE}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookId, pageId, text, voiceId }),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || "TTS request failed");
  }

  const data = await res.json();
  return data.audioUrl; // expected: a playable URL (mp3/wav)
}