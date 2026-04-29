import { useState, useEffect, useRef } from 'react'
import { fetchResultFile } from '../lib/github.js'
import { getSettings } from '../lib/settings.js'
import './ProgressTracker.css'

const STEPS = [
  { id: 'research', label: 'Deep research',               detail: 'Claude + OpenAI + Gemini running in parallel — takes ~40 min' },
  { id: 'metadata', label: 'Generating metadata',         detail: 'Titles, descriptions, social posts, Spotify poll questions…' },
  { id: 'audio',    label: 'Generating audio',            detail: 'Building your ~50-minute episode' },
  { id: 'commit',   label: 'Saving results to your repo', detail: 'Packaging everything up' },
]

function fmt(secs) {
  const m = Math.floor(secs / 60), s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ProgressTracker({ runLabel, onComplete, onReset }) {
  const [stepIndex, setStepIndex]   = useState(0)
  const [elapsed, setElapsed]       = useState(0)
  const [done, setDone]             = useState(false)
  const startRef = useRef(Date.now())
  const pollRef  = useRef(null)

  // Elapsed clock
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  // Approximate step based on elapsed time while polling
  useEffect(() => {
    const stepAt = [0, 40 * 60, 42 * 60, 44 * 60]
    const advance = setInterval(() => {
      const secs = (Date.now() - startRef.current) / 1000
      const idx  = stepAt.filter(t => secs >= t).length - 1
      setStepIndex(i => Math.max(i, Math.min(idx, STEPS.length - 1)))
    }, 10000)

    pollRef.current = setInterval(async () => {
      try {
        const manifest = await fetchResultFile(runLabel, 'manifest.json')
        if (manifest?.status === 'complete') {
          clearInterval(pollRef.current)
          clearInterval(advance)
          setStepIndex(STEPS.length)
          setDone(true)
          const metadata = await fetchResultFile(runLabel, 'metadata.json')
          onComplete({ manifest, metadata })
        }
      } catch { /* not ready yet */ }
    }, 30000)

    return () => { clearInterval(advance); clearInterval(pollRef.current) }
  }, [runLabel, onComplete])

  const { repo } = getSettings()

  return (
    <main className="main">
      <div className="prog-heading">
        <h1>{done ? '✅ Ready.' : 'Running…'}</h1>
        <p>
          {done
            ? 'Record your preamble, then upload the audio to Spotify.'
            : `Elapsed: ${fmt(elapsed)} — this takes about 45 minutes. You can close the tab and come back.`}
        </p>
      </div>

      <div className="card steps-card">
        {STEPS.map((step, i) => {
          const state = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending'
          return (
            <div key={step.id} className={`step step-${state}`}>
              <div className="step-icon">
                {state === 'done'    && <span className="step-check">✓</span>}
                {state === 'active'  && <span className="step-spinner" />}
                {state === 'pending' && <span className="step-dot" />}
              </div>
              <div>
                <div className="step-label">{step.label}</div>
                {state === 'active' && <div className="step-detail">{step.detail}</div>}
              </div>
            </div>
          )
        })}
      </div>

      <div className="card run-info">
        <p className="label">Run ID</p>
        <code className="run-id">{runLabel}</code>
        <p className="run-link">
          <a href={`https://github.com/${repo}/actions`} target="_blank" rel="noreferrer">
            View live progress in GitHub Actions →
          </a>
        </p>
      </div>

      <button className="btn-ghost cancel-btn" onClick={onReset}>
        ← Start a new episode
      </button>
    </main>
  )
}
