import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

const ACCEPTED = {
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/x-wav": [".wav"],
  "audio/mp4": [".m4a", ".mp4"],
  "audio/m4a": [".m4a"],
  "audio/ogg": [".ogg"],
};

const MAX_SIZE_MB = 25;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function UploadForm({ onUpload, isUploading }) {
  const onDrop = useCallback(
    (accepted, rejected) => {
      if (rejected.length > 0) {
        const err = rejected[0].errors[0];
        if (err.code === "file-too-large") {
          alert(`Audio file is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
        } else {
          alert(`File error: ${err.message}`);
        }
        return;
      }
      if (accepted.length > 0) {
        onUpload(accepted[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer p-8 sm:p-10 select-none group
        ${
          isDragActive
            ? "border-accent bg-accent-subtle shadow-glow scale-[1.008]"
            : "border-ink-750/90 bg-ink-900/90 hover:border-ink-600 hover:bg-ink-850 shadow-subtle"
        }
        ${isUploading ? "opacity-60 cursor-not-allowed pointer-events-none" : ""}
      `}
    >
      {/* Ambient background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#272c3a_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

      <input {...getInputProps()} />

      <div className="relative z-10 flex flex-col items-center text-center gap-4">
        {/* Solid Mic Capsule Badge */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
            isDragActive
              ? "bg-accent text-ink-950 scale-110 shadow-glow"
              : "bg-ink-800 border border-ink-700 text-copper-400 group-hover:border-accent/40 group-hover:text-accent group-hover:bg-ink-750"
          }`}
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>

        {/* Text hierarchy */}
        <div className="space-y-1.5 max-w-md">
          <p className="text-base sm:text-lg font-semibold text-ink-100 tracking-tight">
            {isDragActive ? (
              <span className="text-accent">Release audio to begin processing</span>
            ) : (
              <span>Drop meeting recording here</span>
            )}
          </p>
          <p className="text-xs sm:text-sm text-ink-400 font-normal">
            or <span className="text-accent underline underline-offset-4 font-medium hover:text-accent-hover">browse files</span> on your computer
          </p>
        </div>

        {/* Audio format badges */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-ink-800/80 border border-ink-700/60 text-ink-400">
            MP3 · WAV · M4A · OGG
          </span>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-ink-800/80 border border-ink-700/60 text-ink-500">
            Up to 25 MB
          </span>
        </div>
      </div>
    </div>
  );
}
