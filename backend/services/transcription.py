import io
from groq import Groq
from config import get_settings

ALLOWED_AUDIO_TYPES = {
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/m4a",
    "audio/ogg",
    "audio/webm",
    "video/mp4",  # some recorders produce mp4 container
}

WHISPER_MODEL = "whisper-large-v3-turbo"


def transcribe_audio(audio_bytes: bytes, filename: str) -> str:
    """
    Send audio bytes to Groq Whisper and return the full transcript text.

    Args:
        audio_bytes: Raw audio file content.
        filename: Original filename (used to hint the file extension to Groq).

    Returns:
        Transcript string.

    Raises:
        RuntimeError: If the Groq API call fails.
    """
    settings = get_settings()
    client = Groq(api_key=settings.groq_api_key)

    # Groq SDK expects a file-like tuple: (filename, bytes_io, mime_type)
    audio_file = (filename, io.BytesIO(audio_bytes), "audio/mpeg")

    try:
        response = client.audio.transcriptions.create(
            file=audio_file,
            model=WHISPER_MODEL,
            response_format="text",
        )
    except Exception as exc:
        raise RuntimeError(f"Groq Whisper transcription failed: {exc}") from exc

    # When response_format="text", the SDK returns the transcript string directly
    return str(response)
