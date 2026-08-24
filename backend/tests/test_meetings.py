"""
Tests for meeting API routes.
Uses TestClient and mocks Supabase + background task services.
"""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# Patch Supabase before importing app so get_supabase() is mocked at import time
with patch("database.create_client", return_value=MagicMock()):
    from main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# /health
# ---------------------------------------------------------------------------

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# POST /api/meetings/upload — validation
# ---------------------------------------------------------------------------

def test_upload_rejects_wrong_content_type():
    response = client.post(
        "/api/meetings/upload",
        files={"file": ("test.txt", b"hello world", "text/plain")},
    )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_upload_rejects_oversized_file():
    # 26 MB of zeros
    large_bytes = b"\x00" * (26 * 1024 * 1024)
    response = client.post(
        "/api/meetings/upload",
        files={"file": ("big.mp3", large_bytes, "audio/mpeg")},
    )
    assert response.status_code == 400
    assert "exceeds" in response.json()["detail"]


@patch("routers.meetings.get_supabase")
@patch("routers.meetings.process_meeting")
def test_upload_success(mock_process, mock_get_supabase):
    """Upload a valid small audio file — expect 202 and a meeting_id."""
    mock_supabase = MagicMock()
    mock_supabase.storage.from_().upload.return_value = {}
    mock_supabase.table().insert().execute.return_value = MagicMock(data=[{"id": "abc"}])
    mock_get_supabase.return_value = mock_supabase

    small_audio = b"\xff\xfb" + b"\x00" * 1024  # fake MP3 header
    response = client.post(
        "/api/meetings/upload",
        files={"file": ("standup.mp3", small_audio, "audio/mpeg")},
    )
    assert response.status_code == 202
    data = response.json()
    assert "meeting_id" in data


# ---------------------------------------------------------------------------
# GET /api/meetings
# ---------------------------------------------------------------------------

@patch("routers.meetings.get_supabase")
def test_list_meetings(mock_get_supabase):
    mock_supabase = MagicMock()
    mock_supabase.table().select().order().execute.return_value = MagicMock(
        data=[
            {
                "id": "1",
                "title": "Standup",
                "status": "done",
                "created_at": "2026-08-24T10:00:00+00:00",
                "updated_at": "2026-08-24T10:05:00+00:00",
            },
        ]
    )
    mock_get_supabase.return_value = mock_supabase

    response = client.get("/api/meetings")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert response.json()[0]["title"] == "Standup"


# ---------------------------------------------------------------------------
# GET /api/meetings/{id}
# ---------------------------------------------------------------------------

@patch("routers.meetings.get_supabase")
def test_get_meeting_not_found(mock_get_supabase):
    mock_supabase = MagicMock()
    mock_supabase.table().select().eq().single().execute.return_value = MagicMock(data=None)
    mock_get_supabase.return_value = mock_supabase

    response = client.get("/api/meetings/nonexistent-id")
    assert response.status_code == 404
