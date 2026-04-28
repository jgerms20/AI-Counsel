"""
Packages research reports into a ZIP file ready to upload to NotebookLM,
along with a README with exact upload instructions.
"""
import os
import glob
import zipfile

RUN_LABEL = os.environ["RUN_LABEL"]
RUN_DIR = f"results/{RUN_LABEL}"

README_CONTENT = """# NotebookLM Upload Instructions

1. Go to https://notebooklm.google.com and create a new notebook
2. Click "Add Source" and upload each of the .md files in this ZIP
3. Once all sources are added, click "Audio Overview"
4. Select "Long" duration (not Standard or Short)
5. Click "Generate" — this takes ~20 minutes
6. Download the audio when it's ready
7. Return to the podcast site to continue

Files to upload:
- research-claude.md
- research-openai.md
- research-gemini.md
"""


def main():
    research_files = sorted(glob.glob(f"{RUN_DIR}/research-*.md"))
    if not research_files:
        raise FileNotFoundError("No research files found")

    zip_path = f"{RUN_DIR}/notebooklm-sources.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in research_files:
            zf.write(path, os.path.basename(path))
        zf.writestr("README.txt", README_CONTENT)

    print(f"NotebookLM package written to {zip_path}")


if __name__ == "__main__":
    main()
