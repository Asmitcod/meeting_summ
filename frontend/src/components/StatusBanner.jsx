export default function StatusBanner({ status, errorMessage }) {
  const steps = [
    { key: "uploading", label: "Uploaded" },
    { key: "transcribing", label: "Transcribing audio" },
    { key: "summarizing", label: "Analyzing decisions & tasks" },
  ];

  const getStepState = (stepIndex) => {
    if (status === "done") return "completed";
    if (status === "error") return "error";
    if (status === "pending") return stepIndex === 0 ? "active" : "upcoming";
    if (status === "processing") return stepIndex <= 1 ? "active" : "upcoming";
    if (status === "waking") return "waking";
    return "upcoming";
  };

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 shadow-subtle flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 text-lg">
          ⚠️
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-semibold text-red-300 text-sm">Processing encountered an issue</p>
          {errorMessage && (
            <p className="text-red-400/90 text-xs font-mono bg-ink-950/70 p-3 rounded-lg border border-red-500/20 overflow-x-auto">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (status === "waking") {
    return (
      <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4 sm:p-5 shadow-subtle flex items-center gap-4 animate-pulse">
        <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center flex-shrink-0">
          <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <div>
          <p className="font-semibold text-teal-200 text-sm font-sans">Connecting to backend…</p>
          <p className="text-ink-400 text-xs mt-0.5 font-sans">Free-tier service is waking up (takes ~30s on cold start)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink-750 bg-ink-900 p-4 sm:p-5 shadow-subtle">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="font-semibold text-ink-100 text-sm font-sans">Processing Recording</p>
            <p className="text-xs text-ink-400 font-sans mt-0.5">
              Groq Whisper & LLaMA · Updating live
            </p>
          </div>
        </div>

        {/* Mini Step Track */}
        <div className="flex items-center gap-1.5 font-sans">
          {steps.map((step, idx) => {
            const state = getStepState(idx);
            return (
              <div key={step.key} className="flex items-center gap-1.5">
                <span
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                    state === "completed"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : state === "active"
                      ? "bg-teal-500/15 text-teal-300 border border-teal-500/40 font-medium"
                      : "bg-ink-800 text-ink-500 border border-ink-750"
                  }`}
                >
                  {step.label}
                </span>
                {idx < steps.length - 1 && (
                  <span className="text-ink-700 text-xs">→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
