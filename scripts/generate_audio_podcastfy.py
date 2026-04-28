"""
Generates podcast audio from research reports using Podcastfy.
Produces a conversational two-host deep-dive (~50 minutes).
"""
import os
import glob

from podcastfy.client import generate_podcast

TOPIC = os.environ["TOPIC"]
RUN_LABEL = os.environ["RUN_LABEL"]
RUN_DIR = f"results/{RUN_LABEL}"


def main():
    research_files = sorted(glob.glob(f"{RUN_DIR}/research-*.md"))
    if not research_files:
        raise FileNotFoundError("No research files found in run directory")

    combined_text = []
    for path in research_files:
        with open(path, encoding="utf-8") as f:
            combined_text.append(f.read())

    full_research = "\n\n---\n\n".join(combined_text)

    # Write combined research to a temp file for Podcastfy
    combined_path = f"{RUN_DIR}/combined-research.txt"
    with open(combined_path, "w", encoding="utf-8") as f:
        f.write(full_research)

    print(f"Generating podcast audio via Podcastfy for: {TOPIC}")

    audio_path = generate_podcast(
        urls=[],
        text=full_research,
        tts_model="openai",
        longform=True,
        conversation_config={
            "podcast_name": "The Eclectic Polymath",
            "podcast_tagline": "Deep dives on anything and everything",
            "output_language": "English",
            "creativity": 0.7,
            "conversation_style": ["engaging", "analytical", "curious"],
            "roles_person1": "host",
            "roles_person2": "expert co-host",
            "dialogue_structure": [
                "Introduction",
                "Historical Context",
                "Deep Dive",
                "Key Insights",
                "Controversies and Debates",
                "Modern Relevance",
                "Wrap-up"
            ],
            "ending_message": "Thanks for listening to The Eclectic Polymath. Stay curious.",
        },
        llm_model_name="claude-opus-4-7",
        api_key_label="ANTHROPIC_API_KEY",
    )

    # Move audio to run dir
    import shutil
    out_path = f"{RUN_DIR}/audio.mp3"
    shutil.move(audio_path, out_path)
    print(f"Audio saved to {out_path}")


if __name__ == "__main__":
    main()
