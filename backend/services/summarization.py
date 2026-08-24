import json
import re
from groq import Groq
from config import get_settings
from models import ActionItem

LLM_MODEL = "openai/gpt-oss-20b"

# System prompt — kept concise because response_format=json_object enforces JSON
SYSTEM_PROMPT = """\
You are an expert meeting analyst. Analyze meeting transcripts and return structured JSON.
Your response must be valid JSON with exactly these keys: summary, key_decisions, action_items.
"""

# User prompt — describes the schema clearly
USER_PROMPT_TEMPLATE = """\
Analyze the following meeting transcript and return a JSON object with this exact structure:

{{
  "summary": "3 to 5 sentence executive summary of the entire meeting",
  "key_decisions": [
    "Decision 1",
    "Decision 2"
  ],
  "action_items": [
    {{
      "task": "Description of the task",
      "owner": "Person responsible or 'Unassigned'",
      "deadline": "Deadline if mentioned or 'Not specified'"
    }}
  ]
}}

Meeting Transcript:
\"\"\"
{transcript}
\"\"\"
"""


def _extract_json(text: str) -> dict:
    """
    Robustly extract a JSON object from an LLM response.
    Handles any residual markdown fences in case the model ignores response_format.
    """
    cleaned = re.sub(r"```(?:json)?", "", text).strip()
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in LLM response: {text[:300]}")
    return json.loads(match.group())


def summarize_transcript(transcript: str) -> dict:
    """
    Call Groq LLM (openai/gpt-oss-20b) to generate a structured summary.

    Args:
        transcript: Full meeting transcript text.

    Returns:
        Dict with keys: summary (str), key_decisions (list[str]),
        action_items (list[dict with task/owner/deadline]).

    Raises:
        RuntimeError: If the Groq API call fails.
        ValueError: If the response cannot be parsed as valid JSON.
    """
    settings = get_settings()
    client = Groq(api_key=settings.groq_api_key)

    user_prompt = USER_PROMPT_TEMPLATE.format(transcript=transcript)

    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=2048,
            response_format={"type": "json_object"},  # Enforces valid JSON output
        )
    except Exception as exc:
        raise RuntimeError(f"Groq LLM summarization failed: {exc}") from exc

    raw_content = response.choices[0].message.content or ""

    # response_format=json_object should guarantee valid JSON, but we parse
    # defensively in case of edge cases (empty response, extra text, etc.)
    try:
        parsed = json.loads(raw_content)
    except json.JSONDecodeError:
        parsed = _extract_json(raw_content)

    # Validate and normalise action_items structure
    validated_items = []
    for item in parsed.get("action_items", []):
        validated_items.append(
            ActionItem(
                task=item.get("task", ""),
                owner=item.get("owner", "Unassigned"),
                deadline=item.get("deadline", "Not specified"),
            ).model_dump()
        )
    parsed["action_items"] = validated_items

    return parsed
