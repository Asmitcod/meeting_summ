import { useState } from "react";

function getInitials(name) {
  if (!name || name === "Unassigned") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ActionItem({ item, index }) {
  const [completed, setCompleted] = useState(false);

  const isAssigned = item.owner && item.owner !== "Unassigned";
  const hasDeadline = item.deadline && item.deadline !== "Not specified";

  return (
    <div
      onClick={() => setCompleted(!completed)}
      className={`
        rounded-xl p-4 sm:p-4.5 border transition-all duration-200 cursor-pointer select-none flex items-start gap-3.5 group
        ${
          completed
            ? "bg-ink-950/60 border-ink-800/60 opacity-60"
            : "bg-ink-850 border-ink-750/80 hover:border-ink-650 hover:bg-ink-800 shadow-sm"
        }
      `}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setCompleted(!completed);
        }}
        className={`w-5 h-5 rounded-md mt-0.5 flex-shrink-0 flex items-center justify-center border transition-all ${
          completed
            ? "bg-teal-500 border-teal-500 text-ink-950"
            : "border-ink-600 group-hover:border-teal-500/60 bg-ink-900"
        }`}
      >
        {completed && (
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {/* Task text & meta (Sans typography) */}
      <div className="flex-1 min-w-0 space-y-2 font-sans">
        <p
          className={`text-sm leading-relaxed transition-colors ${
            completed ? "line-through text-ink-500" : "text-ink-100 font-medium"
          }`}
        >
          {item.task}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {/* Owner pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ink-900 border border-ink-750 text-xs">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                isAssigned
                  ? "bg-teal-500/20 text-teal-300"
                  : "bg-ink-700 text-ink-400"
              }`}
            >
              {getInitials(item.owner)}
            </span>
            <span className={isAssigned ? "text-ink-200 font-medium" : "text-ink-400 italic"}>
              {item.owner || "Unassigned"}
            </span>
          </div>

          {/* Deadline pill */}
          {hasDeadline && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-ink-900 border border-ink-750 text-xs text-ink-300">
              <svg className="w-3 h-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{item.deadline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
