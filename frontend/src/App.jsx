import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import {
  uploadMeeting,
  getMeeting,
  listMeetings,
  getAudioUrl,
  pingHealth,
} from "./api/meetings";
import UploadForm from "./components/UploadForm";
import StatusBanner from "./components/StatusBanner";
import ResultTabs from "./components/ResultTabs";
import MeetingList from "./components/MeetingList";

const POLL_INTERVAL_MS = 3000;

export default function App() {
  const [meetings, setMeetings] = useState([]);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [uiStatus, setUiStatus] = useState(null); // waking | pending | processing | done | error
  const [isUploading, setIsUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const pollRef = useRef(null);

  // ── Load history on mount ──────────────────────────────────────────────
  useEffect(() => {
    listMeetings()
      .then(setMeetings)
      .catch(() => {}); // silently ignore — server may be asleep
  }, []);

  // ── Polling ───────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (meetingId) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const data = await getMeeting(meetingId);
          setActiveMeeting(data);
          setUiStatus(data.status);
          // Update sidebar entry
          setMeetings((prev) =>
            prev.map((m) => (m.id === data.id ? { ...m, status: data.status } : m))
          );
          if (data.status === "done" || data.status === "error") {
            stopPolling();
            if (data.status === "done") {
              toast.success("Meeting summarized! 🎉");
              // Fetch signed audio URL
              try {
                const url = await getAudioUrl(meetingId);
                setAudioUrl(url);
              } catch {}
            } else {
              toast.error("Processing failed: " + (data.error_message || "Unknown error"));
            }
          }
        } catch (err) {
          console.error("Poll error:", err);
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Upload handler ────────────────────────────────────────────────────
  const handleUpload = async (file) => {
    setIsUploading(true);
    setActiveMeeting(null);
    setAudioUrl(null);
    setUiStatus("waking");

    try {
      // Wake the Render server first (handles cold start gracefully)
      await pingHealth();

      setUiStatus("pending");
      const { meeting_id } = await uploadMeeting(file);

      // Optimistically add to sidebar
      const optimistic = {
        id: meeting_id,
        title: file.name.replace(/\.[^.]+$/, ""),
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setMeetings((prev) => [optimistic, ...prev]);

      startPolling(meeting_id);
      toast("Upload successful — transcribing now…", { icon: "🎙️" });
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Upload failed.";
      toast.error(msg);
      setUiStatus(null);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Select from sidebar ───────────────────────────────────────────────
  const handleSelect = async (id) => {
    stopPolling();
    setAudioUrl(null);
    try {
      const data = await getMeeting(id);
      setActiveMeeting(data);
      setUiStatus(data.status);
      if (data.status === "pending" || data.status === "processing") {
        startPolling(id);
      } else if (data.status === "done") {
        try {
          const url = await getAudioUrl(id);
          setAudioUrl(url);
        } catch {}
      }
    } catch {
      toast.error("Could not load meeting.");
    }
  };

  const handleDelete = (id) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    if (activeMeeting?.id === id) {
      setActiveMeeting(null);
      setUiStatus(null);
      setAudioUrl(null);
      stopPolling();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center gap-3">
        <span className="text-2xl">🎙️</span>
        <h1 className="text-xl font-bold text-slate-100">Meeting Summarizer</h1>
        <span className="ml-auto text-xs text-slate-500">
          Powered by Groq Whisper + LLaMA
        </span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside className="w-72 border-r border-slate-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Past Meetings ({meetings.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <MeetingList
              meetings={meetings}
              activeMeetingId={activeMeeting?.id}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Upload area — always visible */}
            <div>
              <h2 className="text-lg font-semibold text-slate-200 mb-4">
                Upload a Meeting Recording
              </h2>
              <UploadForm onUpload={handleUpload} isUploading={isUploading} />
            </div>

            {/* Status banner */}
            {uiStatus && uiStatus !== "done" && (
              <StatusBanner
                status={uiStatus}
                errorMessage={activeMeeting?.error_message}
              />
            )}

            {/* Results */}
            {activeMeeting?.status === "done" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-200">
                    {activeMeeting.title}
                  </h2>
                  <span className="text-xs text-slate-500">
                    {new Date(activeMeeting.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Audio player */}
                {audioUrl && (
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-2">▶ Audio Playback</p>
                    <audio controls src={audioUrl} className="w-full h-10" />
                  </div>
                )}

                <ResultTabs meeting={activeMeeting} />
              </div>
            )}

            {/* Empty state */}
            {!activeMeeting && !uiStatus && (
              <div className="text-center py-16 text-slate-600">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm">
                  Upload a recording above or select a past meeting from the sidebar.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
