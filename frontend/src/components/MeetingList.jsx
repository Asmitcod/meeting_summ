import { useState, useMemo } from "react";
import { deleteMeeting } from "../api/meetings";
import toast from "react-hot-toast";

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffInSecs = Math.floor((now - date) / 1000);

  if (diffInSecs < 60) return "Just now";
  if (diffInSecs < 3600) {
    const mins = Math.floor(diffInSecs / 60);
    return `${mins}m ago`;
  }
  if (diffInSecs < 86400) {
    const hours = Math.floor(diffInSecs / 3600);
    return `${hours}h ago`;
  }
  if (diffInSecs < 172800) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function cleanTitle(rawTitle) {
  if (!rawTitle) return "Untitled Meeting";
  return rawTitle
    .replace(/\.[^.]+$/, "") // strip extension
    .replace(/[-_]+/g, " ") // replace dashes/underscores with space
    .replace(/\s+/g, " ")
    .trim();
}

export default function MeetingList({
  meetings,
  activeMeetingId,
  onSelect,
  onDelete,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Delete this meeting record?")) return;
    try {
      await deleteMeeting(id);
      toast.success("Meeting removed");
      onDelete(id);
    } catch {
      toast.error("Could not delete meeting");
    }
  };

  const filteredMeetings = useMemo(() => {
    if (!searchQuery.trim()) return meetings;
    const query = searchQuery.toLowerCase();
    return meetings.filter((m) =>
      cleanTitle(m.title).toLowerCase().includes(query)
    );
  }, [meetings, searchQuery]);

  if (!meetings || meetings.length === 0) {
    return (
      <div className="py-12 px-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-ink-850 border border-ink-750 text-ink-500 mx-auto flex items-center justify-center mb-3">
          🎙️
        </div>
        <p className="text-xs font-medium text-ink-400">No recordings yet</p>
        <p className="text-[11px] text-ink-500 mt-1">Upload an audio clip to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Subtle search filter if more than 3 meetings */}
      {meetings.length > 3 && (
        <div className="px-2 pb-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Filter meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-ink-850 border border-ink-750/70 rounded-lg px-3 py-1.5 text-xs text-ink-200 placeholder-ink-500 focus:outline-none focus:border-accent/60 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      <ul className="space-y-1.5 overflow-y-auto px-1">
        {filteredMeetings.map((m) => {
          const isActive = activeMeetingId === m.id;
          const isPending = m.status === "pending";
          const isProcessing = m.status === "processing";
          const isError = m.status === "error";
          const hasSpecialStatus = isPending || isProcessing || isError;

          return (
            <li
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={`
                group relative rounded-xl p-3 cursor-pointer transition-all duration-150 border
                ${
                  isActive
                    ? "bg-ink-850 border-teal-500/50 shadow-sm"
                    : "bg-ink-900/40 border-transparent hover:bg-ink-850/60 hover:border-ink-750"
                }
              `}
            >
              {/* Left active accent bar */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-teal-500 rounded-r" />
              )}

              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 font-sans">
                  <p
                    className={`text-xs sm:text-sm font-medium truncate ${
                      isActive ? "text-ink-100 font-semibold" : "text-ink-200 group-hover:text-ink-100"
                    }`}
                  >
                    {cleanTitle(m.title)}
                  </p>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-mono text-ink-500">
                      {formatRelativeTime(m.created_at)}
                    </span>

                    {/* Show status badge ONLY if not done */}
                    {hasSpecialStatus && (
                      <span
                        className={`text-[10px] font-sans px-1.5 py-0.2 rounded font-medium ${
                          isError
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : "bg-teal-500/15 text-teal-300 border border-teal-500/30 animate-pulse"
                        }`}
                      >
                        {m.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete button on hover */}
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, m.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-ink-500 hover:text-red-400 rounded hover:bg-ink-800 flex-shrink-0"
                  title="Delete recording"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
