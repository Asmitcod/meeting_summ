"""
Unit tests for the summarization service.
Tests JSON extraction, structure validation, and error cases.
"""

import pytest
from unittest.mock import MagicMock, patch
from services.summarization import _extract_json, summarize_transcript


# ---------------------------------------------------------------------------
# _extract_json
# ---------------------------------------------------------------------------

def test_extract_json_clean():
    raw = '{"summary": "Good meeting.", "key_decisions": [], "action_items": []}'
    result = _extract_json(raw)
    assert result["summary"] == "Good meeting."


def test_extract_json_with_markdown_fences():
    raw = """```json
{"summary": "Wrapped.", "key_decisions": ["D1"], "action_items": []}
```"""
    result = _extract_json(raw)
    assert result["summary"] == "Wrapped."


def test_extract_json_raises_on_no_json():
    with pytest.raises(ValueError, match="No JSON object found"):
        _extract_json("This is just plain text, no JSON here.")


# ---------------------------------------------------------------------------
# summarize_transcript
# ---------------------------------------------------------------------------

MOCK_LLM_RESPONSE = """{
  "summary": "The team discussed Q3 targets.",
  "key_decisions": ["Adopt new CI pipeline", "Delay feature X to Q4"],
  "action_items": [
    {"task": "Set up CI", "owner": "Alice", "deadline": "Friday"},
    {"task": "Update roadmap", "owner": "Unassigned", "deadline": "Not specified"}
  ]
}"""


@patch("services.summarization.Groq")
def test_summarize_transcript_success(mock_groq_class):
    mock_client = MagicMock()
    mock_groq_class.return_value = mock_client

    mock_choice = MagicMock()
    mock_choice.message.content = MOCK_LLM_RESPONSE
    mock_client.chat.completions.create.return_value = MagicMock(choices=[mock_choice])

    result = summarize_transcript("We talked about Q3 targets...")

    assert result["summary"] == "The team discussed Q3 targets."
    assert len(result["key_decisions"]) == 2
    assert result["action_items"][0]["owner"] == "Alice"


@patch("services.summarization.Groq")
def test_summarize_transcript_bad_json_raises(mock_groq_class):
    mock_client = MagicMock()
    mock_groq_class.return_value = mock_client

    mock_choice = MagicMock()
    mock_choice.message.content = "Sorry, I cannot help with that."
    mock_client.chat.completions.create.return_value = MagicMock(choices=[mock_choice])

    with pytest.raises(ValueError):
        summarize_transcript("Some transcript text.")


@patch("services.summarization.Groq")
def test_summarize_transcript_api_error_raises(mock_groq_class):
    mock_client = MagicMock()
    mock_groq_class.return_value = mock_client
    mock_client.chat.completions.create.side_effect = Exception("API timeout")

    with pytest.raises(RuntimeError, match="Groq LLM summarization failed"):
        summarize_transcript("Some transcript text.")
