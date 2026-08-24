import { useState } from "react";
import toast from "react-hot-toast";
import ActionItem from "./ActionItem";

const TABS = ["Summary", "Action Items", "Transcript"];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export default function ResultTabs({ meeting }) {
  const [active, setActive] = useState("Summary");

  const summaryText = [
    meeting.summary,
    "",
    "Key Decisions:",
    ...(meeting.key_decisions || []).map((d) => `• ${d}`),
  ].join("\n");

  const actionText = (meeting.action_items || [])
    .map((a, i) => `${i + 1}. ${a.task} | Owner: ${a.owner} | Deadline: ${a.deadline}`)
    .join("\n");

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-700">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              active === tab
                ? "text-brand-400 border-b-2 border-brand-400 bg-slate-800/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">

        {/* ── Summary tab ── */}
        {active === "Summary" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Executive Summary</h3>
                <CopyButton text={summaryText} />
              </div>
              <p className="text-slate-200 leading-relaxed">{meeting.summary}</p>
            </div>

            {meeting.key_decisions?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Key Decisions
                </h3>
                <ul className="space-y-2">
                  {meeting.key_decisions.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-200">
                      <span className="text-brand-400 mt-1 flex-shrink-0">◆</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Action Items tab ── */}
        {active === "Action Items" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Action Items ({meeting.action_items?.length || 0})
              </h3>
              <CopyButton text={actionText} />
            </div>
            {meeting.action_items?.length > 0 ? (
              <div className="space-y-3">
                {meeting.action_items.map((item, i) => (
                  <ActionItem key={i} item={item} index={i} />
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">No action items found in this meeting.</p>
            )}
          </div>
        )}

        {/* ── Transcript tab ── */}
        {active === "Transcript" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Full Transcript</h3>
              <CopyButton text={meeting.transcript || ""} />
            </div>
            <div className="bg-slate-950 rounded-xl p-4 max-h-[500px] overflow-y-auto">
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                {meeting.transcript || "No transcript available."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
