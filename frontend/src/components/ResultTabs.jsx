import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import ActionItem from "./ActionItem";

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-ink-800 hover:bg-ink-750 text-ink-300 hover:text-ink-100 border border-ink-700/70 transition-colors shadow-sm"
    >
      {copied ? (
        <>
          <span className="text-emerald-400">✓</span>
          <span>Copied</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

// Splits raw transcript into segment blocks with estimated timestamp offsets for interactive seek
function parseTranscriptSegments(rawText, totalDuration = 0) {
  if (!rawText) return [];
  
  // Split by double newline or sentence boundaries
  const rawParagraphs = rawText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const segments = [];
  const totalLength = rawText.length || 1;
  let accumulatedChars = 0;

  for (let i = 0; i < rawParagraphs.length; i++) {
    const text = rawParagraphs[i];
    // Estimate start time proportionate to character offset
    const estimatedStartTime = (accumulatedChars / totalLength) * (totalDuration || 60);
    accumulatedChars += text.length;
    const estimatedEndTime = (accumulatedChars / totalLength) * (totalDuration || 60);

    segments.push({
      id: i,
      text,
      startTime: estimatedStartTime,
      endTime: estimatedEndTime,
    });
  }
  return segments;
}

function formatTimestamp(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function ResultTabs({
  meeting,
  currentTime = 0,
  audioDuration = 0,
  onSeekAudio,
}) {
  const [activeTab, setActiveTab] = useState("summary");

  const segments = useMemo(
    () => parseTranscriptSegments(meeting.transcript, audioDuration),
    [meeting.transcript, audioDuration]
  );

  const summaryText = useMemo(() => {
    return [
      "## Summary",
      meeting.summary || "",
      "",
      "## Key Decisions",
      ...(meeting.key_decisions || []).map((d) => `• ${d}`),
    ].join("\n");
  }, [meeting]);

  const actionText = useMemo(() => {
    return (meeting.action_items || [])
      .map(
        (a, i) =>
          `${i + 1}. ${a.task} [Owner: ${a.owner || "Unassigned"}, Deadline: ${
            a.deadline || "Not specified"
          }]`
      )
      .join("\n");
  }, [meeting]);

  const tabs = [
    {
      id: "summary",
      label: "What happened",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "actions",
      label: "Action Items",
      badge: meeting.action_items?.length || 0,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: "transcript",
      label: "Captured Speech",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-ink-900 border border-ink-750/90 rounded-2xl overflow-hidden shadow-subtle flex flex-col">
      {/* Top Segmented Pill Tab Bar */}
      <div className="p-2 border-b border-ink-800 bg-ink-950/60 flex items-center gap-1.5 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${
                  isActive
                    ? "bg-accent text-ink-950 font-semibold shadow-glow"
                    : "text-ink-400 hover:text-ink-200 hover:bg-ink-850"
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-ink-950/25 text-ink-950 font-bold"
                      : "bg-ink-800 text-ink-300 border border-ink-700"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-6 sm:p-7">
        {/* ── 1. Summary Tab ("What happened") ── */}
        {activeTab === "summary" && (
          <div className="space-y-7">
            {/* Executive synthesis */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-semibold tracking-wider text-copper-400 uppercase">
                  Synthesis
                </h3>
                <CopyButton text={summaryText} label="Copy Summary" />
              </div>
              <div className="bg-ink-850/80 border border-ink-750/70 rounded-xl p-5 shadow-sm">
                <p className="text-ink-100 text-base leading-relaxed font-normal">
                  {meeting.summary || "No summary available."}
                </p>
              </div>
            </div>

            {/* Key Decisions Section */}
            {meeting.key_decisions && meeting.key_decisions.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-mono font-semibold tracking-wider text-copper-400 uppercase">
                  Key Decisions
                </h3>
                <div className="grid gap-2.5">
                  {meeting.key_decisions.map((decision, idx) => (
                    <div
                      key={idx}
                      className="bg-ink-850/50 border border-ink-750/60 rounded-xl p-4 flex items-start gap-3.5 hover:border-ink-650 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-md bg-accent-subtle border border-accent/40 text-accent flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-ink-200 text-sm leading-relaxed font-medium">
                        {decision}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 2. Action Items Tab ── */}
        {activeTab === "actions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-semibold tracking-wider text-copper-400 uppercase">
                  Actionable Tasks
                </h3>
                <p className="text-xs text-ink-400 mt-0.5">
                  Click any item to toggle completion
                </p>
              </div>
              <CopyButton text={actionText} label="Copy Tasks" />
            </div>

            {meeting.action_items && meeting.action_items.length > 0 ? (
              <div className="grid gap-3 pt-1">
                {meeting.action_items.map((item, idx) => (
                  <ActionItem key={idx} item={item} index={idx} />
                ))}
              </div>
            ) : (
              <div className="bg-ink-850/40 border border-dashed border-ink-750 rounded-xl p-8 text-center text-ink-500 text-sm">
                No explicit action items identified in this meeting.
              </div>
            )}
          </div>
        )}

        {/* ── 3. Transcript Tab ("Captured Speech") with Audio Sync ── */}
        {activeTab === "transcript" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-semibold tracking-wider text-copper-400 uppercase">
                  Captured Speech
                </h3>
                <p className="text-xs text-ink-400 mt-0.5">
                  Click any segment to jump audio playback
                </p>
              </div>
              <CopyButton text={meeting.transcript || ""} label="Copy Transcript" />
            </div>

            <div className="bg-ink-950/90 border border-ink-800 rounded-xl p-4 sm:p-5 max-h-[520px] overflow-y-auto space-y-3.5 font-mono text-sm">
              {segments.length > 0 ? (
                segments.map((seg) => {
                  const isCurrent =
                    audioDuration > 0 &&
                    currentTime >= seg.startTime &&
                    currentTime <= (seg.endTime + 0.5);

                  return (
                    <div
                      key={seg.id}
                      onClick={() => onSeekAudio && onSeekAudio(seg.startTime)}
                      className={`
                        p-3 rounded-lg transition-all duration-200 cursor-pointer border flex flex-col sm:flex-row sm:items-start gap-2.5 sm:gap-4 group/line
                        ${
                          isCurrent
                            ? "bg-accent-subtle/80 border-accent/50 shadow-sm"
                            : "bg-ink-900/40 border-transparent hover:bg-ink-850/80 hover:border-ink-700/60"
                        }
                      `}
                    >
                      {/* Timestamp Tag */}
                      <span
                        className={`text-xs font-mono flex-shrink-0 px-2 py-0.5 rounded transition-colors ${
                          isCurrent
                            ? "bg-accent text-ink-950 font-bold"
                            : "text-ink-500 bg-ink-800/80 group-hover/line:text-copper-300"
                        }`}
                      >
                        {formatTimestamp(seg.startTime)}
                      </span>

                      {/* Line content */}
                      <p
                        className={`leading-relaxed text-sm transition-colors ${
                          isCurrent
                            ? "text-ink-100 font-medium"
                            : "text-ink-300 group-hover/line:text-ink-100"
                        }`}
                      >
                        {seg.text}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-ink-500 italic p-4">No transcript text available.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
