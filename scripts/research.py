"""
Runs a deep research query against a single AI provider.
Called by the GitHub Actions matrix job with PROVIDER env var set to
'claude', 'openai', or 'gemini'.
"""
import os
import sys

PROVIDER = os.environ["PROVIDER"]
TOPIC = os.environ["TOPIC"]
RUN_LABEL = os.environ["RUN_LABEL"]

DEEP_RESEARCH_PROMPT = """You are a world-class research analyst. Conduct an exhaustive, deeply detailed research report on the following topic.

Topic: {topic}

Your report must include:
1. Historical background and origin
2. Key concepts, figures, and events
3. Causes, mechanisms, and underlying dynamics
4. Significant consequences and lasting impact
5. Controversies, debates, and multiple perspectives
6. Contemporary relevance and modern connections
7. Surprising or counterintuitive findings
8. Recommended further reading

Write in an engaging, narrative style suitable for a long-form podcast episode aimed at an intellectually curious general audience. Be thorough — this is the foundation for a 50-minute deep-dive podcast. Minimum 3,000 words."""


def run_claude(topic: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    message = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=16000,
        thinking={"type": "enabled", "budget_tokens": 10000},
        messages=[{"role": "user", "content": DEEP_RESEARCH_PROMPT.format(topic=topic)}],
    )
    text_blocks = [b.text for b in message.content if hasattr(b, "text")]
    return "\n\n".join(text_blocks)


def run_openai(topic: str) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    response = client.responses.create(
        model="o3",
        input=DEEP_RESEARCH_PROMPT.format(topic=topic),
        tools=[{"type": "web_search_preview"}],
    )
    return response.output_text


def run_gemini(topic: str) -> str:
    import google.generativeai as genai
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel("gemini-2.5-pro-preview-05-06")
    response = model.generate_content(
        DEEP_RESEARCH_PROMPT.format(topic=topic),
        generation_config=genai.GenerationConfig(max_output_tokens=16000),
    )
    return response.text


def main():
    print(f"[{PROVIDER}] Starting deep research on: {TOPIC}")
    runners = {"claude": run_claude, "openai": run_openai, "gemini": run_gemini}
    if PROVIDER not in runners:
        print(f"Unknown provider: {PROVIDER}")
        sys.exit(1)

    result = runners[PROVIDER](TOPIC)

    out_dir = f"results/{RUN_LABEL}"
    os.makedirs(out_dir, exist_ok=True)
    out_path = f"{out_dir}/research-{PROVIDER}.md"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(f"# Deep Research Report — {PROVIDER.title()}\n\n")
        f.write(f"**Topic:** {TOPIC}\n\n---\n\n")
        f.write(result)

    print(f"[{PROVIDER}] Done. Written to {out_path}")


if __name__ == "__main__":
    main()
