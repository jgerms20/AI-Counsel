import { useState, useEffect, useRef } from 'react'
import { fetchResultFile } from '../lib/github.js'
import './ProgressTracker.css'

const STEPS = [
  { id: 'research', label: 'Deep research', detail: 'Claude + OpenAI + Gemini running in parallel (~40 min)' },
  { id: 'metadata', label: 'Generating titles & descriptions', detail: 'Titles, descriptions, social posts, poll questions…' },
  { id: 'audio', label: 'Generating audio', detail: 'Building your 50-minute deep-dive episode' },
  { id: 'commit', label: 'Saving results', detail: 'Packaging everything into your repo' },
]

export default function ProgressTracker({ runLabel, onComplete, onReset }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const startTime = useRef(Date.now())
  const pollRef = useRef(null)

  useEffect(() => {
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    // Simulate step progression based on elapsed time, then poll for real completion
    const stepTimings = [0, 40 * 60, 42 * 60, 44 * 60] // approximate seconds when each step starts
    const stepTimer = setInterval(() => {
      const secs = (Date.now() - startTime.current) / 1000
      const idx = stepTimings.filter(t => secs >= t).length - 1
      setStepIndex(Math.min(idx, STEPS.length - 1))
    }, 5000)

    // Poll for manifest.json every 30s
    pollRef.current = setInterval(async () => {
      try {
        const manifest = await fetchResultFile(runLabel, 'manifest.json')
        if (manifest?.status === 'complete') {
          clearInterval(pollRef.current)
          clearInterval(stepTimer)
          setStepIndex(STEPS.length)
          setDone(true)
          const metadata = await fetchResultFile(runLabel, 'metadata.json')
          onComplete({ manifest, metadata })
        }
      } catch {
        // Not ready yet — keep polling
      }
    }, 30000)

    return () => { clearInterval(stepTimer); clearInterval(pollRef.current) }
  }, [runLabel, onComplete])

  function fmt(secs) {
    const m = Math.floor(secs / 60), s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <main className="main">
      <div className="progress-header">
        <h1>{done ? '✅ Ready.' : 'Automation running…'}</h1>
        <p className="progress-sub">
          {done
            ? 'Record your preamble, then upload the audio to Spotify.'
            : `Elapsed: ${fmt(elapsed)} — sit back, this takes ~45 minutes`}
        </p>
      </div>

      <div className="card steps-card">
        {STEPS.map((step, i) => {
          const state = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending'
          return (
            <div key={step.id} className={`step step-${state}`}>
              <div className="step-icon">
                {state === 'done' ? '✓' : state === 'active' ? <span className="spinner" /> : <span className="dot" />}
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
        <p className="section-title">Run ID</p>
        <code className="run-label">{runLabel}</code>
        <p className="run-hint">
          Check live progress in{' '}
          <a
            href={`https://github.com/${localStorage.getItem('ep_settings') ? JSON.parse(localStorage.getItem('ep_settings')).repo : 'your-repo'}/actions`}
            target="_blank"
            rel="noreferrer"
          >
            GitHub Actions →
          </a>
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <button className="btn-secondary cancel-btn" onClick={onReset}>
        ← Start a new episode
      </button>
    </main>
  )
}
