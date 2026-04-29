import { useState } from 'react'
import { getSettings, saveSettings } from '../lib/settings.js'
import './Settings.css'

const SECRETS = [
  ['ANTHROPIC_API_KEY',  'Your Claude API key — console.anthropic.com'],
  ['OPENAI_API_KEY',     'Your OpenAI API key — platform.openai.com'],
  ['GEMINI_API_KEY',     'Your Gemini API key — aistudio.google.com'],
  ['ELEVENLABS_API_KEY', 'ElevenLabs key (only if using ElevenLabs audio)'],
  ['GH_PAT',             'Same Personal Access Token as above — lets Actions commit results back'],
]

export default function Settings({ onSave }) {
  const saved = getSettings()
  const [pat,     setPat]   = useState(saved.githubPat || '')
  const [repo,    setRepo]  = useState(saved.repo      || 'jgerms20/AI-Counsel')
  const [success, setSuccess] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    saveSettings({ githubPat: pat.trim(), repo: repo.trim() })
    setSuccess(true)
    setTimeout(() => { setSuccess(false); onSave() }, 900)
  }

  return (
    <main className="main">
      <div className="settings-heading">
        <h1>Settings</h1>
        <p>Your PAT is stored only in this browser — never sent anywhere except GitHub's own API.</p>
      </div>

      <form onSubmit={handleSave} className="settings-form card">
        <div className="field">
          <label className="label">GitHub Personal Access Token</label>
          <input
            type="password"
            value={pat}
            onChange={e => setPat(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            required
            autoComplete="off"
          />
          <span className="field-hint">
            Needs <code>repo</code> + <code>workflow</code> scopes.{' '}
            <a href="https://github.com/settings/tokens/new?scopes=repo,workflow" target="_blank" rel="noreferrer">
              Create one on GitHub →
            </a>
          </span>
        </div>

        <div className="field">
          <label className="label">Repository</label>
          <input
            type="text"
            value={repo}
            onChange={e => setRepo(e.target.value)}
            placeholder="owner/repo-name"
            required
          />
        </div>

        <button type="submit" className="btn-primary save-btn">
          {success ? '✓ Saved' : 'Save settings'}
        </button>
      </form>

      <div className="secrets-card card">
        <p className="label">GitHub Secrets to add to your repo</p>
        <p className="secrets-note">
          Repo → Settings → Secrets and variables → Actions → New repository secret
        </p>
        <table className="secrets-table">
          <thead>
            <tr><th>Secret name</th><th>Value</th></tr>
          </thead>
          <tbody>
            {SECRETS.map(([name, desc]) => (
              <tr key={name}>
                <td><code>{name}</code></td>
                <td className="secret-desc">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
