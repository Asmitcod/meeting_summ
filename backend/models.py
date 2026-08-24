from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ---------------------------------------------------------------------------
# Nested types
# ---------------------------------------------------------------------------

class ActionItem(BaseModel):
    task: str
    owner: str = "Unassigned"
    deadline: str = "Not specified"


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class MeetingListItem(BaseModel):
    id: str
    title: str
    status: str
    created_at: datetime
    updated_at: datetime


class MeetingDetail(BaseModel):
    id: str
    title: str
    audio_path: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    key_decisions: Optional[list[str]] = None
    action_items: Optional[list[ActionItem]] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime  # auto-maintained by trg_meetings_updated_at trigger


class UploadResponse(BaseModel):
    meeting_id: str
    message: str = "Upload received. Processing started."


class AudioUrlResponse(BaseModel):
    signed_url: str
    expires_in: int = 3600
