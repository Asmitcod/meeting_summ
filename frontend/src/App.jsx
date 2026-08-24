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
import AudioPlayer from "./components/AudioPlayer";
import IntroSplash from "./components/IntroSplash";

const POLL_INTERVAL_MS = 3000;

function cleanDisplayTitle(title) {
  if (!title) return "Meeting Recording";
  return title
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function App() {
  const [meetings, setMeetings] = useState([]);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [uiStatus, setUiStatus] = useState(null); // waking | pending | processing | done | error
  const [isUploading, setIsUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  // Audio playback & transcript sync state
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [seekTarget, setSeekTarget] = useState(null);

  const pollRef = useRef(null);

  // ── Load past meetings on mount ──────────────────────────────────────────
  useEffect(() => {
    listMeetings()
      .then((data) => {
        setMeetings(data);
        // Automatically select the most recent meeting if available
        if (data && data.length > 0) {
          handleSelect(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // ── Polling ─────────────────────────────────────────────────────────────
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

          // Update sidebar record
          setMeetings((prev) =>
            prev.map((m) =>
              m.id === data.id ? { ...m, status: data.status, title: data.title } : m
            )
          );

          if (data.status === "done" || data.status === "error") {
            stopPolling();
            if (data.status === "done") {
              toast.success("Synthesis complete!", {
                icon: "🎙️",
                style: { background: "#171a22", color: "#f1f4fa", border: "1px solid #32394a" },
              });
              // Retrieve signed audio URL
              try {
                const url = await getAudioUrl(meetingId);
                setAudioUrl(url);
              } catch {}
            } else {
              toast.error(
                "Processing failed: " + (data.error_message || "Unknown error"),
                { style: { background: "#171a22", color: "#fca5a5", border: "1px solid #7f1d1d" } }
              );
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Upload handler ──────────────────────────────────────────────────────
  const handleUpload = async (file) => {
    setIsUploading(true);
    setActiveMeeting(null);
    setAudioUrl(null);
    setUiStatus("waking");

    try {
      // Ping health first to wake instance if cold
      await pingHealth();

      setUiStatus("pending");
      const { meeting_id } = await uploadMeeting(file);

      const optimisticRecord = {
        id: meeting_id,
        title: file.name,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setMeetings((prev) => [optimisticRecord, ...prev]);

      startPolling(meeting_id);
      toast("Recording uploaded — running pipeline…", {
        icon: "⚡",
        style: { background: "#171a22", color: "#f1f4fa", border: "1px solid #32394a" },
      });
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Upload failed.";
      toast.error(msg, {
        style: { background: "#171a22", color: "#fca5a5", border: "1px solid #7f1d1d" },
      });
      setUiStatus(null);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Select meeting from sidebar ─────────────────────────────────────────
  const handleSelect = async (id) => {
    stopPolling();
    setAudioUrl(null);
    setAudioCurrentTime(0);
    setSeekTarget(null);

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
      toast.error("Could not load meeting recording");
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

  // Handle seeking from transcript click
  const handleSeekFromTranscript = (timeSecs) => {
    setSeekTarget(timeSecs);
  };

  const handleAudioTimeUpdate = (curr, dur) => {
    setAudioCurrentTime(curr);
    setAudioDuration(dur);
  };

  return (
    <div className="min-h-screen bg-ink-950 text-ink-200 flex flex-col font-sans selection:bg-accent-subtle selection:text-copper-200">
      {/* ── Intro Mic Sweep on First Load ── */}
      <IntroSplash />

      {/* ── App Header ── */}
      <header className="border-b border-ink-800/80 bg-ink-900/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent text-ink-950 flex items-center justify-center font-bold shadow-glow">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm5 9a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-ink-100 tracking-tight leading-none">
              Meeting Summarizer
            </h1>
            <p className="text-[11px] font-mono text-ink-500 mt-1">
              Audio intelligence & action items
            </p>
          </div>
        </div>

        {/* Attribution Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-850 border border-ink-750/70 text-xs font-mono text-ink-400 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="hidden sm:inline text-ink-400">Powered by</span>
          <span className="text-ink-200 font-semibold">Groq Whisper + LLaMA</span>
        </div>
      </header>

      {/* ── Main Workspace Layout ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ── Left Sidebar (Past Meetings Library) ── */}
        <aside className="w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-ink-800/80 bg-ink-900/60 flex flex-col flex-shrink-0">
          <div className="px-4 py-3.5 border-b border-ink-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold tracking-wider text-copper-400 uppercase">
                Recordings
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-ink-800 text-ink-400 border border-ink-750">
                {meetings.length}
              </span>
            </div>
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

        {/* ── Right Main Area ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-ink-950">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-7">

            {/* Upload Zone */}
            <div>
              <UploadForm onUpload={handleUpload} isUploading={isUploading} />
            </div>

            {/* Status Banner */}
            {uiStatus && uiStatus !== "done" && (
              <StatusBanner
                status={uiStatus}
                errorMessage={activeMeeting?.error_message}
              />
            )}

            {/* Results Section */}
            {activeMeeting && activeMeeting.status === "done" && (
              <div className="space-y-5 animate-fadeIn">
                {/* Meeting Header */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-ink-100 tracking-tight">
                    {cleanDisplayTitle(activeMeeting.title)}
                  </h2>
                  <span className="text-xs font-mono text-ink-500">
                    {new Date(activeMeeting.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Custom Audio Waveform Player */}
                {audioUrl && (
                  <AudioPlayer
                    src={audioUrl}
                    title={cleanDisplayTitle(activeMeeting.title)}
                    seekTime={seekTarget}
                    onTimeUpdate={handleAudioTimeUpdate}
                  />
                )}

                {/* Three Result Tabs (What happened, Actions, Captured Speech with audio-sync) */}
                <ResultTabs
                  meeting={activeMeeting}
                  currentTime={audioCurrentTime}
                  audioDuration={audioDuration}
                  onSeekAudio={handleSeekFromTranscript}
                />
              </div>
            )}

            {/* Empty State */}
            {!activeMeeting && !uiStatus && (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-ink-900 border border-ink-800 text-ink-500 mx-auto flex items-center justify-center text-xl">
                  🎧
                </div>
                <p className="text-sm text-ink-300 font-medium">Ready to transcribe</p>
                <p className="text-xs text-ink-500 max-w-sm mx-auto">
                  Upload an audio file above or select a past recording from your library on the left.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
