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
          alert(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
        } else {
          alert(`Invalid file: ${err.message}`);
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
        border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
        transition-all duration-200 select-none
        ${isDragActive
          ? "border-brand-500 bg-brand-500/10 scale-[1.01]"
          : "border-slate-600 hover:border-brand-500 hover:bg-slate-800/50"
        }
        ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4">
        <span className="text-6xl">🎙️</span>

        {isDragActive ? (
          <p className="text-brand-400 font-semibold text-lg">Drop it here…</p>
        ) : (
          <>
            <p className="text-slate-200 font-semibold text-lg">
              Drag & drop your meeting audio
            </p>
            <p className="text-slate-400 text-sm">
              or <span className="text-brand-400 underline">browse to upload</span>
            </p>
          </>
        )}

        <p className="text-slate-500 text-xs mt-2">
          Supports MP3, WAV, M4A, OGG · Max {MAX_SIZE_MB} MB
        </p>
      </div>
    </div>
  );
}
