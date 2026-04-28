import { useState } from 'react'
import { getSettings, saveSettings } from '../lib/settings.js'
import './Settings.css'

export default function Settings({ onSave }) {
  const saved = getSettings()
  const [pat, setPat] = useState(saved.githubPat || '')
  const [repo, setRepo] = useState(saved.repo || 'jgerms20/AI-Counsel')
  const [saved_, setSaved] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    saveSettings({ githubPat: pat.trim(), repo: repo.trim() })
    setSaved(true)
    setTimeout(() => { setSaved(false); onSave() }, 800)
  }

  return (
    <main className="main">
      <div className="settings-header">
        <h1>Settings</h1>
        <p className="settings-desc">
          Your GitHub PAT is stored only in your browser — never sent to any server other than GitHub.
        </p>
      </div>

      <form onSubmit={handleSave} className="settings-form card">
        <div className="field">
          <label>GitHub Personal Access Token</label>
          <input
            type="password"
            value={pat}
            onChange={e => setPat(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            required
          />
          <span className="field-hint">
            Needs <code>repo</code> + <code>workflow</code> scopes.{' '}
            <a href="https://github.com/settings/tokens/new?scopes=repo,workflow" target="_blank" rel="noreferrer">
              Create one →
            </a>
          </span>
        </div>

        <div className="field">
          <label>GitHub Repository</label>
          <input
            type="text"
            value={repo}
            onChange={e => setRepo(e.target.value)}
            placeholder="owner/repo-name"
            required
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          {saved_ ? '✓ Saved' : 'Save Settings'}
        </button>
      </form>

      <div className="settings-secrets card">
        <p className="section-title">GitHub Secrets to configure in your repo</p>
        <p className="settings-desc" style={{ marginBottom: '1rem' }}>
          Go to your repo → Settings → Secrets and variables → Actions, and add:
        </p>
        <table className="secrets-table">
          <thead>
            <tr><th>Secret</th><th>Value</th></tr>
          </thead>
          <tbody>
            {[
              ['ANTHROPIC_API_KEY', 'Your Claude API key'],
              ['OPENAI_API_KEY', 'Your OpenAI API key'],
              ['GEMINI_API_KEY', 'Your Gemini API key'],
              ['ELEVENLABS_API_KEY', 'Your ElevenLabs key (if using ElevenLabs audio)'],
              ['GH_PAT', 'Same PAT as above (so Actions can commit results)'],
            ].map(([name, desc]) => (
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
