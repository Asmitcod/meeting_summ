export default function ActionItem({ item, index }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex gap-4">
      {/* Index badge */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-slate-100 font-medium leading-snug">{item.task}</p>

        <div className="flex flex-wrap gap-3 mt-2">
          {item.owner && item.owner !== "Unassigned" && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <span>👤</span>
              <span>{item.owner}</span>
            </span>
          )}
          {item.deadline && item.deadline !== "Not specified" && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <span>📅</span>
              <span>{item.deadline}</span>
            </span>
          )}
          {(!item.owner || item.owner === "Unassigned") && (
            <span className="text-xs text-slate-600 italic">No owner assigned</span>
          )}
        </div>
      </div>
    </div>
  );
}
