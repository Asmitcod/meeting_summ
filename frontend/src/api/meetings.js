import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60s — handles Render free-tier cold start (~30–50s wake-up)
});

/**
 * Upload an audio file.
 * Returns { meeting_id, message } immediately — processing runs in background.
 */
export async function uploadMeeting(file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/api/meetings/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data; // { meeting_id, message }
}

/**
 * Poll a single meeting by ID.
 * Used to track status: pending → processing → done/error.
 */
export async function getMeeting(id) {
  const { data } = await api.get(`/api/meetings/${id}`);
  return data;
}

/**
 * List all past meetings (sidebar).
 */
export async function listMeetings() {
  const { data } = await api.get("/api/meetings");
  return data;
}

/**
 * Get a short-lived signed URL for audio playback.
 */
export async function getAudioUrl(id) {
  const { data } = await api.get(`/api/meetings/${id}/audio-url`);
  return data.signed_url;
}

/**
 * Delete a meeting and its audio file.
 */
export async function deleteMeeting(id) {
  await api.delete(`/api/meetings/${id}`);
}

/**
 * Ping /health — used to wake the Render server before uploading.
 */
export async function pingHealth() {
  try {
    await api.get("/health");
    return true;
  } catch {
    return false;
  }
}
