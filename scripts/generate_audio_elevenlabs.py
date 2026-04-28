"""
Generates podcast audio via ElevenLabs GenFM API.
"""
import os
import glob
import requests

TOPIC = os.environ["TOPIC"]
RUN_LABEL = os.environ["RUN_LABEL"]
RUN_DIR = f"results/{RUN_LABEL}"
ELEVENLABS_API_KEY = os.environ["ELEVENLABS_API_KEY"]


def build_script(research_files: list[str]) -> str:
    import anthropic
    combined = []
    for path in research_files:
        with open(path, encoding="utf-8") as f:
            combined.append(f.read())

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    message = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=8000,
        messages=[{
            "role": "user",
            "content": f"""Convert this research into a detailed podcast script for two hosts (Alex and Jordan) for The Eclectic Polymath Podcast.

Topic: {TOPIC}

Research:
{chr(10).join(combined)[:10000]}

Write a full conversational podcast script that covers all major angles. Make it feel like two intellectually curious friends going deep on a topic. 45-50 minutes of content. Include natural banter, follow-up questions, moments of surprise, and genuine enthusiasm. End with a memorable takeaway."""
        }],
    )
    return message.content[0].text


def main():
    research_files = sorted(glob.glob(f"{RUN_DIR}/research-*.md"))
    if not research_files:
        raise FileNotFoundError("No research files found")

    print("Building podcast script from research...")
    script = build_script(research_files)

    script_path = f"{RUN_DIR}/podcast-script.txt"
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(script)

    print("Sending to ElevenLabs GenFM...")
    headers = {"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"}

    response = requests.post(
        "https://api.elevenlabs.io/v1/podcasts",
        headers=headers,
        json={
            "title": f"The Eclectic Polymath — {TOPIC}",
            "script": script,
            "hosts": [
                {"name": "Alex", "voice_id": "pNInz6obpgDQGcFmaJgB"},
                {"name": "Jordan", "voice_id": "EXAVITQu4vr4xnSDxMaL"},
            ],
            "model_id": "eleven_multilingual_v2",
        },
        timeout=300,
    )
    response.raise_for_status()
    data = response.json()

    audio_url = data.get("audio_url") or data.get("url")
    if not audio_url:
        raise ValueError(f"No audio URL in response: {data}")

    print(f"Downloading audio from {audio_url}...")
    audio_resp = requests.get(audio_url, timeout=300)
    audio_resp.raise_for_status()

    out_path = f"{RUN_DIR}/audio.mp3"
    with open(out_path, "wb") as f:
        f.write(audio_resp.content)
    print(f"Audio saved to {out_path}")


if __name__ == "__main__":
    main()
