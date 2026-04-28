"""
Combines all research reports and generates podcast metadata:
- 4-5 title options
- 2-3 episode descriptions
- Instagram, Twitter/X, YouTube posts
- 5 Spotify poll questions
- 3 Google Image search queries for cover photo
"""
import json
import os
import glob

import anthropic

TOPIC = os.environ["TOPIC"]
RUN_LABEL = os.environ["RUN_LABEL"]
RUN_DIR = f"results/{RUN_LABEL}"

DESCRIPTION_TEMPLATE_PATH = "templates/description_format.txt"


def load_research() -> str:
    parts = []
    for provider in ("claude", "openai", "gemini"):
        path = f"{RUN_DIR}/research-{provider}.md"
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                parts.append(f.read())
    return "\n\n---\n\n".join(parts)


def load_description_template() -> str:
    if os.path.exists(DESCRIPTION_TEMPLATE_PATH):
        with open(DESCRIPTION_TEMPLATE_PATH, encoding="utf-8") as f:
            return f.read()
    return """[Hook sentence that captures the essence of the episode]

In this episode, we explore [brief 1-2 sentence summary of the topic].

[2-3 sentences on key themes and what the listener will learn]

Subscribe to The Eclectic Polymath Podcast for deep dives on topics that make you think differently about the world."""


def generate_metadata(research: str, description_template: str) -> dict:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    prompt = f"""You are helping produce an episode of The Eclectic Polymath Podcast — a show that does deep dives on any topic that's intellectually fascinating, no matter the subject.

TOPIC: {TOPIC}

RESEARCH SUMMARY (from 3 AI systems):
{research[:12000]}

EPISODE DESCRIPTION TEMPLATE:
{description_template}

Generate the following as a single valid JSON object with these exact keys:

{{
  "titles": [
    "Title Option 1",
    "Title Option 2",
    "Title Option 3",
    "Title Option 4",
    "Title Option 5"
  ],
  "descriptions": [
    "Description option 1 (following the template format above)",
    "Description option 2 (following the template format above)",
    "Description option 3 (following the template format above)"
  ],
  "instagram_post": "Full Instagram caption with hashtags",
  "twitter_post": "Twitter/X post under 280 characters",
  "youtube_description": "Full YouTube video description (300-500 words) with timestamps placeholder and subscribe CTA",
  "spotify_poll_questions": [
    {{"question": "Poll question 1?", "options": ["Option A", "Option B", "Option C", "Option D"]}},
    {{"question": "Poll question 2?", "options": ["Option A", "Option B", "Option C", "Option D"]}},
    {{"question": "Poll question 3?", "options": ["Option A", "Option B", "Option C", "Option D"]}},
    {{"question": "Poll question 4?", "options": ["Option A", "Option B", "Option C", "Option D"]}},
    {{"question": "Poll question 5?", "options": ["Option A", "Option B", "Option C", "Option D"]}}
  ],
  "cover_image_searches": [
    "Google Image search query 1 — specific, visual, real photo (not illustration)",
    "Google Image search query 2",
    "Google Image search query 3"
  ]
}}

Rules:
- Titles should be punchy, curiosity-driven, and varied in style
- Descriptions must follow the template structure exactly
- Instagram caption should be warm, inviting, and end with 8-12 relevant hashtags
- Cover image searches should find real photographs, not illustrations or stock art — be very specific (e.g. "Chinese Cultural Revolution Tiananmen Square 1966 historical photograph")
- Poll questions should be genuinely interesting debate-worthy questions from the episode content, with 4 answer options each
- Return ONLY the JSON object, no other text"""

    message = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip().rstrip("```").strip()

    return json.loads(raw)


def main():
    print(f"Generating metadata for: {TOPIC}")
    research = load_research()
    if not research:
        print("ERROR: No research files found.")
        raise SystemExit(1)

    description_template = load_description_template()
    metadata = generate_metadata(research, description_template)

    # Add Google Image search links
    for i, query in enumerate(metadata.get("cover_image_searches", [])):
        encoded = query.replace(" ", "+")
        metadata["cover_image_searches"][i] = {
            "query": query,
            "url": f"https://www.google.com/search?q={encoded}&tbm=isch&tbs=itp:photo",
        }

    out_path = f"{RUN_DIR}/metadata.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"Metadata written to {out_path}")


if __name__ == "__main__":
    main()
