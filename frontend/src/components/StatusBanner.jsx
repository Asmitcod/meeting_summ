const STATUS_CONFIG = {
  pending: {
    icon: "⏳",
    label: "Queued — waiting to start…",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
    spin: true,
  },
  processing: {
    icon: "⚡",
    label: "Transcribing & summarizing…",
    color: "text-brand-400",
    bg: "bg-brand-500/10 border-brand-500/30",
    spin: true,
  },
  done: {
    icon: "✅",
    label: "Done! Your summary is ready.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    spin: false,
  },
  error: {
    icon: "❌",
    label: "Something went wrong.",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
    spin: false,
  },
  waking: {
    icon: "🌅",
    label: "Waking up server (free tier)… this takes ~30s on first request.",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30",
    spin: true,
  },
};

export default function StatusBanner({ status, errorMessage }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <div className={`rounded-xl border px-5 py-4 flex items-start gap-3 ${cfg.bg}`}>
      <span className="text-xl mt-0.5">
        {cfg.spin ? (
          <span className="inline-block animate-spin">{cfg.icon === "⚡" ? "🔄" : "⏳"}</span>
        ) : (
          cfg.icon
        )}
      </span>
      <div>
        <p className={`font-semibold ${cfg.color}`}>{cfg.label}</p>
        {status === "error" && errorMessage && (
          <p className="text-red-300 text-sm mt-1 font-mono">{errorMessage}</p>
        )}
        {(status === "pending" || status === "processing") && (
          <p className="text-slate-400 text-xs mt-1">
            Polling for updates every 3 seconds…
          </p>
        )}
      </div>
    </div>
  );
}
