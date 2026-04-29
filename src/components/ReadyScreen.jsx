import { useState } from 'react'
import CopyButton from './CopyButton.jsx'
import { getSettings } from '../lib/settings.js'
import './ReadyScreen.css'

export default function ReadyScreen({ results, runLabel, onNew }) {
  const { metadata } = results || {}
  const [selectedTitle, setSelectedTitle] = useState(0)
  const [selectedDesc,  setSelectedDesc]  = useState(0)

  const { repo } = getSettings()
  const rawBase = `https://raw.githubusercontent.com/${repo}/main/results/${runLabel}`

  if (!metadata) {
    return (
      <main className="main">
        <div className="ready-heading">
          <h1>✅ Ready</h1>
          <p>Check your repo's <code>results/{runLabel}/</code> folder for all outputs.</p>
        </div>
        <button className="btn-primary" onClick={onNew}>Start a new episode</button>
      </main>
    )
  }

  return (
    <main className="main">
      <div className="ready-heading">
        <h1>✅ Everything is ready.</h1>
        <p>Record your preamble and add it to the top of the audio, then upload to Spotify.</p>
      </div>

      {/* Audio */}
      <section className="ready-section card">
        <p className="label">🎙 Audio</p>
        <div className="audio-row">
          <a className="btn-primary" href={`${rawBase}/audio.mp3`} target="_blank" rel="noreferrer">
            Download audio.mp3
          </a>
          <a className="btn-ghost" href={`${rawBase}/notebooklm-sources.zip`} target="_blank" rel="noreferrer">
            Download NotebookLM sources
          </a>
        </div>
      </section>

      {/* Title */}
      <section className="ready-section card">
        <p className="label">📋 Episode title</p>
        <div className="pick-list">
          {(metadata.titles || []).map((t, i) => (
            <button
              key={i}
              className={`pick-option ${selectedTitle === i ? 'selected' : ''}`}
              onClick={() => setSelectedTitle(i)}
            >
              <input type="radio" readOnly checked={selectedTitle === i} />
              <span className="pick-text">{t}</span>
            </button>
          ))}
        </div>
        {metadata.titles?.[selectedTitle] && (
          <div className="pick-footer">
            <CopyButton text={metadata.titles[selectedTitle]} label="Copy title" />
          </div>
        )}
      </section>

      {/* Description */}
      <section className="ready-section card">
        <p className="label">📝 Episode description</p>
        <div className="pick-list">
          {(metadata.descriptions || []).map((d, i) => (
            <button
              key={i}
              className={`pick-option ${selectedDesc === i ? 'selected' : ''}`}
              onClick={() => setSelectedDesc(i)}
            >
              <input type="radio" readOnly checked={selectedDesc === i} />
              <span className="pick-text">{d}</span>
            </button>
          ))}
        </div>
        {metadata.descriptions?.[selectedDesc] && (
          <div className="pick-footer">
            <CopyButton text={metadata.descriptions[selectedDesc]} label="Copy description" />
          </div>
        )}
      </section>

      {/* Spotify polls */}
      <section className="ready-section card">
        <p className="label">📊 Spotify poll questions</p>
        <div className="poll-list">
          {(metadata.spotify_poll_questions || []).map((poll, i) => (
            <div key={i} className="poll-item">
              <div className="poll-q">
                <span className="poll-q-text">{poll.question}</span>
                <CopyButton text={poll.question} />
              </div>
              <div className="poll-opts">
                {(poll.options || []).map((opt, j) => (
                  <span key={j} className="poll-opt">{opt}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cover photo */}
      <section className="ready-section card">
        <p className="label">📷 Cover photo</p>
        <p className="cover-hint">Click to search Google Images — find a real photo that fits the vibe.</p>
        <div className="cover-links">
          {(metadata.cover_image_searches || []).map((item, i) => {
            const query = item.query || item
            const url   = item.url   || `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&tbs=itp:photo`
            return (
              <a key={i} className="cover-link" href={url} target="_blank" rel="noreferrer">
                <span className="cover-num">{i + 1}</span>
                <span>{query}</span>
                <span className="cover-arrow">→</span>
              </a>
            )
          })}
        </div>
      </section>

      {/* Social posts */}
      <section className="ready-section card">
        <p className="label">📱 Social posts</p>
        <div className="social-list">
          <SocialPost icon="📸" platform="Instagram"  text={metadata.instagram_post} />
          <SocialPost icon="𝕏"  platform="Twitter / X" text={metadata.twitter_post} />
          <SocialPost icon="▶"  platform="YouTube"    text={metadata.youtube_description} />
        </div>
      </section>

      <div className="ready-footer">
        <button className="btn-primary" onClick={onNew}>🎙 Start a new episode</button>
      </div>
    </main>
  )
}

function SocialPost({ icon, platform, text }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="social-item">
      <button className="social-header" onClick={() => setOpen(o => !o)}>
        <span>{icon} {platform}</span>
        <span className="social-toggle">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="social-body">
          <pre className="social-text">{text}</pre>
          <CopyButton text={text} label={`Copy ${platform} post`} />
        </div>
      )}
    </div>
  )
}
