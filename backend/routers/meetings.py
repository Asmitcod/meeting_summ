"""
meetings.py — All /api/meetings/* routes.

Upload flow (two-step async):
1. POST /upload  → validate → save to Supabase Storage → insert DB row (status=pending)
                 → return {meeting_id} immediately → fire BackgroundTask
2. BackgroundTask → download audio → Whisper → LLM → update DB row (status=done/error)

Frontend polls GET /{id} every 3s until status is done or error.
"""

import uuid
import logging
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse

from config import get_settings, Settings
from database import get_supabase
from models import MeetingDetail, MeetingListItem, UploadResponse, AudioUrlResponse
from services.transcription import transcribe_audio, ALLOWED_AUDIO_TYPES
from services.summarization import summarize_transcript

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/meetings", tags=["meetings"])

AUDIO_BUCKET = "audio"
SIGNED_URL_EXPIRES = 3600  # 1 hour


# ---------------------------------------------------------------------------
# Background processing task
# ---------------------------------------------------------------------------

def process_meeting(meeting_id: str) -> None:
    """
    Run transcription + summarization for a meeting.
    Updates the Supabase row as status transitions occur.
    Called via FastAPI BackgroundTasks — runs after the HTTP response is sent.
    """
    supabase = get_supabase()

    try:
        # Mark as processing
        supabase.table("meetings").update({"status": "processing"}).eq("id", meeting_id).execute()

        # Fetch the audio_path stored during upload
        row = supabase.table("meetings").select("audio_path, title").eq("id", meeting_id).single().execute()
        audio_path: str = row.data["audio_path"]

        # Download audio bytes from Supabase Storage
        audio_bytes: bytes = supabase.storage.from_(AUDIO_BUCKET).download(audio_path)

        # --- Transcription ---
        filename = audio_path.split("/")[-1]
        transcript = transcribe_audio(audio_bytes, filename)

        # --- Summarization ---
        result = summarize_transcript(transcript)

        # --- Persist results ---
        supabase.table("meetings").update({
            "transcript": transcript,
            "summary": result.get("summary"),
            "key_decisions": result.get("key_decisions", []),
            "action_items": result.get("action_items", []),
            "status": "done",
            "error_message": None,
        }).eq("id", meeting_id).execute()

        logger.info("Meeting %s processed successfully.", meeting_id)

    except Exception as exc:
        logger.exception("Failed to process meeting %s: %s", meeting_id, exc)
        try:
            supabase.table("meetings").update({
                "status": "error",
                "error_message": str(exc),
            }).eq("id", meeting_id).execute()
        except Exception as db_exc:
            logger.error("Could not update error status for meeting %s: %s", meeting_id, db_exc)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/upload", response_model=UploadResponse, status_code=202)
async def upload_meeting(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
):
    """
    FR-1 / FR-2 / FR-5
    Accept audio upload, save to Supabase Storage, insert a pending DB row,
    then immediately return the meeting_id. Processing continues in the background.
    """
    # --- Validate content type ---
    if file.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: MP3, WAV, M4A, OGG.",
        )

    # --- Read and validate file size ---
    audio_bytes = await file.read()
    if len(audio_bytes) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds {settings.max_file_size_mb} MB limit.",
        )

    meeting_id = str(uuid.uuid4())
    safe_filename = file.filename or "recording.mp3"
    storage_path = f"{meeting_id}/{safe_filename}"

    supabase = get_supabase()

    # --- Upload to Supabase Storage ---
    try:
        supabase.storage.from_(AUDIO_BUCKET).upload(
            path=storage_path,
            file=audio_bytes,
            file_options={"content-type": file.content_type},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {exc}") from exc

    # --- Insert pending DB row ---
    title = safe_filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()
    try:
        supabase.table("meetings").insert({
            "id": meeting_id,
            "title": title,
            "audio_path": storage_path,
            "status": "pending",
        }).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database insert failed: {exc}") from exc

    # --- Fire background processing (returns immediately) ---
    background_tasks.add_task(process_meeting, meeting_id)

    return UploadResponse(meeting_id=meeting_id)


@router.get("", response_model=list[MeetingListItem])
def list_meetings():
    """
    FR-6 — Return all meetings ordered by newest first (for the sidebar).
    """
    supabase = get_supabase()
    response = (
        supabase.table("meetings")
        .select("id, title, status, created_at")
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


@router.get("/{meeting_id}", response_model=MeetingDetail)
def get_meeting(meeting_id: str):
    """
    FR-6 / FR-9 — Return full meeting detail.
    Used by frontend to poll processing status and retrieve final results.
    """
    supabase = get_supabase()
    response = supabase.table("meetings").select("*").eq("id", meeting_id).single().execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Meeting not found.")

    return response.data


@router.get("/{meeting_id}/audio-url", response_model=AudioUrlResponse)
def get_audio_url(meeting_id: str):
    """
    Generate a short-lived Supabase Storage signed URL for in-browser audio playback.
    Bucket is private so direct URLs are not accessible.
    """
    supabase = get_supabase()

    # Fetch audio_path
    row = supabase.table("meetings").select("audio_path").eq("id", meeting_id).single().execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Meeting not found.")

    audio_path: str = row.data["audio_path"]

    try:
        result = supabase.storage.from_(AUDIO_BUCKET).create_signed_url(
            path=audio_path,
            expires_in=SIGNED_URL_EXPIRES,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not generate signed URL: {exc}") from exc

    return AudioUrlResponse(signed_url=result["signedURL"], expires_in=SIGNED_URL_EXPIRES)


@router.delete("/{meeting_id}", status_code=204)
def delete_meeting(meeting_id: str):
    """
    Delete meeting record from DB and remove audio file from Supabase Storage.
    """
    supabase = get_supabase()

    row = supabase.table("meetings").select("audio_path").eq("id", meeting_id).single().execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Meeting not found.")

    audio_path: str = row.data.get("audio_path", "")

    # Remove from storage (best-effort — don't fail if already missing)
    if audio_path:
        try:
            supabase.storage.from_(AUDIO_BUCKET).remove([audio_path])
        except Exception as exc:
            logger.warning("Could not delete audio file %s: %s", audio_path, exc)

    supabase.table("meetings").delete().eq("id", meeting_id).execute()
