import { useState, useRef, useEffect, useCallback } from "react";

// Generate a deterministic pseudo-waveform array from a string or default pattern
function generateWaveformData(seedStr = "meeting", count = 48) {
  const bars = [];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed << 5) - seed + seedStr.charCodeAt(i);
    seed |= 0;
  }
  for (let i = 0; i < count; i++) {
    const x = Math.sin((i + 1) * 0.45 + (seed % 10)) * 0.5 + 0.5;
    const y = Math.cos((i + 1) * 0.15) * 0.3 + 0.4;
    const height = Math.max(18, Math.min(95, Math.round((x * 0.6 + y * 0.4) * 100)));
    bars.push(height);
  }
  return bars;
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function AudioPlayer({
  src,
  title = "Recording",
  onTimeUpdate,
  seekTime,
}) {
  const audioRef = useRef(null);
  const waveformRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [bars] = useState(() => generateWaveformData(title, 52));

  // Sync external seek requests (e.g. user clicked transcript segment)
  useEffect(() => {
    if (seekTime !== null && seekTime !== undefined && audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  }, [seekTime]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const curr = audioRef.current.currentTime;
    setCurrentTime(curr);
    if (onTimeUpdate) {
      onTimeUpdate(curr, audioRef.current.duration || 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const handleWaveformClick = (e) => {
    if (!waveformRef.current || !audioRef.current || !duration) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = pct * duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const toggleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioRef.current.muted = nextMute;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-ink-900 border border-ink-750/80 rounded-2xl p-4 sm:p-5 shadow-subtle relative overflow-hidden group">
      {/* Background ambient audio glow */}
      <div 
        className="absolute -right-20 -top-20 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none transition-opacity duration-500"
        style={{ opacity: isPlaying ? 0.9 : 0.2 }}
      />

      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      <div className="flex flex-col gap-3.5 relative z-10">
        {/* Top bar: Play button + Waveform scrubber */}
        <div className="flex items-center gap-4">
          {/* Main Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-xl bg-accent hover:bg-accent-hover active:bg-accent-active text-ink-950 flex items-center justify-center font-bold shadow-glow transition-all duration-200 flex-shrink-0 group-hover:scale-105 active:scale-95"
            title={isPlaying ? "Pause" : "Play recording"}
          >
            {isPlaying ? (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1.5" />
                <rect x="14" y="4" width="4" height="16" rx="1.5" />
              </svg>
            ) : (
              <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                <path d="M7 4.5v15a1 1 0 0 0 1.55.83l12-7.5a1 1 0 0 0 0-1.66l-12-7.5A1 1 0 0 0 7 4.5z" />
              </svg>
            )}
          </button>

          {/* Interactive Waveform Scrubber */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <div
              ref={waveformRef}
              onClick={handleWaveformClick}
              className="h-10 flex items-center gap-1 cursor-pointer group/wave py-1"
              title="Click anywhere on waveform to seek"
            >
              {bars.map((barHeight, idx) => {
                const barPct = (idx / bars.length) * 100;
                const isPlayed = barPct <= progressPct;
                return (
                  <div
                    key={idx}
                    className="flex-1 flex items-center justify-center h-full"
                  >
                    <div
                      className={`w-full max-w-[4px] rounded-full transition-all duration-150 ${
                        isPlayed
                          ? "bg-accent shadow-[0_0_8px_rgba(232,122,66,0.5)]"
                          : "bg-ink-700 group-hover/wave:bg-ink-600"
                      } ${isPlaying && isPlayed ? "opacity-100" : "opacity-85"}`}
                      style={{
                        height: `${barHeight}%`,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Time labels & live progress bar */}
            <div className="flex items-center justify-between text-xs font-mono text-ink-400 select-none">
              <span className="text-accent font-semibold">{formatTime(currentTime)}</span>
              <span className="text-ink-500">/ {formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Bottom controls: Audio meta info + playback speed + mute */}
        <div className="flex items-center justify-between pt-1 border-t border-ink-800/80 text-xs">
          <div className="flex items-center gap-2 text-ink-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
            <span className="font-mono text-[11px] text-ink-300 truncate max-w-[200px]">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Speed toggle */}
            <button
              onClick={toggleSpeed}
              className="px-2 py-1 rounded-md bg-ink-800 hover:bg-ink-750 text-ink-300 hover:text-ink-100 font-mono text-[11px] font-medium transition-colors border border-ink-700/60"
              title="Change playback speed"
            >
              {playbackRate}x
            </button>

            {/* Mute button */}
            <button
              onClick={toggleMute}
              className="p-1 rounded-md text-ink-400 hover:text-ink-200 transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
