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
        relative overflow-hidden rounded-2xl border transition-all duration-200 cursor-pointer p-8 sm:p-9 select-none group
        ${
          isDragActive
            ? "border-teal-500 bg-teal-500/10 shadow-glow scale-[1.005]"
            : "border-ink-750 bg-ink-900 hover:border-ink-600 hover:bg-ink-850 shadow-subtle"
        }
        ${isUploading ? "opacity-60 cursor-not-allowed pointer-events-none" : ""}
      `}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center text-center gap-3.5">
        {/* Solid Mic Badge */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
            isDragActive
              ? "bg-teal-500 text-ink-950 scale-105 shadow-glow"
              : "bg-ink-800 border border-ink-700 text-teal-400 group-hover:border-teal-500/40 group-hover:text-teal-300 group-hover:bg-ink-750"
          }`}
        >
          <svg
            className="w-6 h-6"
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

        {/* Text hierarchy in Clean UI Sans */}
        <div className="space-y-1 max-w-md">
          <p className="text-base font-semibold text-ink-100 font-sans tracking-tight">
            {isDragActive ? (
              <span className="text-teal-400">Drop audio to start transcription</span>
            ) : (
              <span>Upload a meeting recording</span>
            )}
          </p>
          <p className="text-xs text-ink-400 font-sans">
            Drag & drop an audio file, or <span className="text-teal-400 font-medium hover:text-teal-300 underline underline-offset-2">browse files</span>
          </p>
        </div>

        {/* Plain inline caption line (not boxed chip pills) */}
        <p className="text-[11px] text-ink-500 font-sans pt-0.5">
          MP3, WAV, M4A, OGG · Up to 25 MB
        </p>
      </div>
    </div>
  );
}
