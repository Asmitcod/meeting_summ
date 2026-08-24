import { deleteMeeting } from "../api/meetings";
import toast from "react-hot-toast";

const STATUS_BADGE = {
  pending:    "bg-yellow-500/20 text-yellow-400",
  processing: "bg-brand-500/20 text-brand-400",
  done:       "bg-emerald-500/20 text-emerald-400",
  error:      "bg-red-500/20 text-red-400",
};

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function MeetingList({ meetings, activeMeetingId, onSelect, onDelete }) {
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Delete this meeting?")) return;
    try {
      await deleteMeeting(id);
      toast.success("Meeting deleted.");
      onDelete(id);
    } catch {
      toast.error("Failed to delete meeting.");
    }
  };

  if (!meetings.length) {
    return (
      <div className="text-slate-500 text-sm italic px-4 py-6 text-center">
        No past meetings yet.
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {meetings.map((m) => (
        <li
          key={m.id}
          onClick={() => onSelect(m.id)}
          className={`
            group flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors
            ${activeMeetingId === m.id
              ? "bg-brand-500/15 border border-brand-500/30"
              : "hover:bg-slate-800 border border-transparent"
            }
          `}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{m.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{formatDate(m.created_at)}</p>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${STATUS_BADGE[m.status] || ""}`}>
              {m.status}
            </span>
          </div>

          {/* Delete button — visible on hover */}
          <button
            onClick={(e) => handleDelete(e, m.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400 text-lg flex-shrink-0 mt-0.5"
            title="Delete meeting"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
