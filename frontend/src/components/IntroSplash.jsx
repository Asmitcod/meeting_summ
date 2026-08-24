import { useState, useEffect } from "react";

export default function IntroSplash({ onFinish }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start fade out after the sweep finishes
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 1800);

    // Completely unmount after transition
    const finishTimer = setTimeout(() => {
      setVisible(false);
      if (onFinish) onFinish();
    }, 2400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-ink-950/95 backdrop-blur-md transition-opacity duration-700 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Sound frequency line across the screen */}
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-ink-700 to-transparent top-1/2 -translate-y-1/2" />

      {/* Travelling Mic with soundwave ripples */}
      <div className="absolute w-full top-1/2 -translate-y-1/2 overflow-hidden py-16">
        <div className="animate-mic-sweep flex items-center gap-3">
          {/* Audio trailing particle waves */}
          <div className="flex items-center gap-1.5 opacity-60">
            <div className="w-1 h-3 bg-teal-500 rounded-full animate-pulse" />
            <div className="w-1 h-6 bg-teal-400 rounded-full" />
            <div className="w-1 h-9 bg-teal-500 rounded-full" />
            <div className="w-1 h-5 bg-teal-600 rounded-full" />
            <div className="w-1 h-8 bg-teal-500 rounded-full" />
          </div>

          {/* Glowing Studio Mic */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-teal-500 blur-lg opacity-60 animate-ping" />
            <div className="w-14 h-14 rounded-2xl bg-teal-600 text-ink-950 flex items-center justify-center font-bold shadow-glow relative z-10 scale-110">
              <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm5 9a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
              </svg>
            </div>
          </div>

          {/* Forward sound waves */}
          <div className="flex items-center gap-1.5 opacity-80">
            <div className="w-1 h-8 bg-teal-500 rounded-full" />
            <div className="w-1 h-5 bg-teal-400 rounded-full" />
            <div className="w-1 h-10 bg-teal-500 rounded-full" />
            <div className="w-1 h-6 bg-teal-600 rounded-full" />
            <div className="w-1 h-3 bg-teal-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Subtle branding hint */}
      <div className="absolute bottom-12 flex flex-col items-center gap-2">
        <span className="text-xs font-sans font-medium tracking-wider text-ink-400 uppercase">
          Initializing Speech Engine
        </span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
