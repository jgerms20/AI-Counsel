# Eclectic Polymath Podcast Studio — Setup Guide

One-time setup. After this, your entire podcast workflow is automated.

---

## Step 1 — Fork / clone this repo

This is your personal repo. Keep it private if you want.

---

## Step 2 — Add GitHub Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

Add each of these:

| Secret Name | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `OPENAI_API_KEY` | platform.openai.com → API Keys |
| `GEMINI_API_KEY` | aistudio.google.com → Get API Key |
| `ELEVENLABS_API_KEY` | elevenlabs.io → Profile → API Key *(skip if not using ElevenLabs)* |
| `GH_PAT` | github.com/settings/tokens → Generate new token (classic) → check `repo` + `workflow` |

---

## Step 3 — Enable GitHub Pages

Go to: **GitHub repo → Settings → Pages**
- Source: **Deploy from a branch**
- Branch: `gh-pages` / `/ (root)`
- Click Save

Your site will be live at: `https://jgerms20.github.io/AI-Counsel`

> Pages won't appear until the first build runs. Trigger it manually:
> GitHub repo → Actions → "Build & Deploy to GitHub Pages" → Run workflow

---

## Step 4 — Customize your episode description template

Open `templates/description_format.txt` and edit it to match your exact description style.
The AI will follow this structure for every episode.

---

## Step 5 — Configure the site

Open the live site URL, click **⚙ Settings**, and enter:
- Your **GitHub PAT** (same one from Step 2 — `GH_PAT`)
- Your **repo** (e.g. `jgerms20/AI-Counsel`)

This is stored only in your browser's localStorage.

---

## Using the site

1. Open `https://jgerms20.github.io/AI-Counsel` on your phone or computer
2. Type, speak, or upload your podcast topic idea
3. Choose your audio generation method (Podcastfy / ElevenLabs / NotebookLM)
4. Hit **▶ Start Automation**
5. Wait ~45 minutes (or check GitHub Actions for live progress)
6. The site shows: audio download, title options, description options, Spotify poll questions, cover photo search links, social media posts
7. Record your preamble and prepend it to the audio file
8. Upload to Spotify for Podcasters and publish

---

## Audio Methods Compared

| Method | Cost | Quality | Automation |
|---|---|---|---|
| **Podcastfy** | Free | Good | Fully automated |
| **ElevenLabs** | ~$0.10–0.50/ep | Best | Fully automated |
| **NotebookLM** | Free | Excellent | One manual step |

---

## Troubleshooting

**Workflow doesn't start:** Check that your PAT has `repo` + `workflow` scopes and that GitHub Actions is enabled on the repo.

**Research step fails for one provider:** The workflow uses `fail-fast: false` so other providers keep running. Check the Actions log for which provider failed and why (usually an API key issue).

**Audio generation fails:** Podcastfy requires `OPENAI_API_KEY` for TTS even when using Claude for the script. Make sure both keys are set.

**Results don't appear on site:** Raw GitHub content can take 1-2 minutes to propagate after commit. The site polls every 30 seconds and will pick it up automatically.
