import { useState } from 'react'
import CopyButton from './CopyButton.jsx'
import './ReadyScreen.css'

export default function ReadyScreen({ results, runLabel, onNew }) {
  const { metadata } = results || {}
  const [selectedTitle, setSelectedTitle] = useState(0)
  const [selectedDesc, setSelectedDesc] = useState(0)

  if (!metadata) {
    return (
      <main className="main">
        <div className="ready-header">
          <h1>✅ Ready</h1>
          <p>Results committed but metadata could not be loaded. Check your repo's results/{runLabel}/ folder.</p>
        </div>
        <button className="btn-primary" onClick={onNew}>Start a new episode</button>
      </main>
    )
  }

  const repoPath = (() => {
    try { return JSON.parse(localStorage.getItem('ep_settings') || '{}').repo || 'your-repo' } catch { return 'your-repo' }
  })()

  return (
    <main className="main ready-main">
      <div className="ready-header">
        <h1>✅ Everything is ready.</h1>
        <p>Record your preamble and add it to the top of the audio file, then upload to Spotify.</p>
      </div>

      {/* Audio Download */}
      <section className="ready-section card">
        <p className="section-title">🎙 Audio</p>
        <div className="audio-links">
          <a
            className="btn-primary audio-btn"
            href={`https://raw.githubusercontent.com/${repoPath}/main/results/${runLabel}/audio.mp3`}
            target="_blank"
            rel="noreferrer"
          >
            Download audio.mp3
          </a>
          <a
            className="btn-secondary audio-btn"
            href={`https://raw.githubusercontent.com/${repoPath}/main/results/${runLabel}/notebooklm-sources.zip`}
            target="_blank"
            rel="noreferrer"
          >
            Download NotebookLM sources
          </a>
        </div>
      </section>

      {/* Title Picker */}
      <section className="ready-section card">
        <p className="section-title">📋 Pick your episode title</p>
        <div className="pick-list">
          {(metadata.titles || []).map((title, i) => (
            <label key={i} className={`radio-option ${selectedTitle === i ? 'selected' : ''}`}>
              <input type="radio" name="title" checked={selectedTitle === i} onChange={() => setSelectedTitle(i)} />
              <span>{title}</span>
            </label>
          ))}
        </div>
        {metadata.titles?.[selectedTitle] && (
          <div className="pick-copy">
            <CopyButton text={metadata.titles[selectedTitle]} />
          </div>
        )}
      </section>

      {/* Description Picker */}
      <section className="ready-section card">
        <p className="section-title">📝 Pick your episode description</p>
        <div className="pick-list">
          {(metadata.descriptions || []).map((desc, i) => (
            <label key={i} className={`radio-option desc-option ${selectedDesc === i ? 'selected' : ''}`}>
              <input type="radio" name="desc" checked={selectedDesc === i} onChange={() => setSelectedDesc(i)} />
              <span className="desc-preview">{desc}</span>
            </label>
          ))}
        </div>
        {metadata.descriptions?.[selectedDesc] && (
          <div className="pick-copy">
            <CopyButton text={metadata.descriptions[selectedDesc]} label="Copy description" />
          </div>
        )}
      </section>

      {/* Spotify Poll Questions */}
      <section className="ready-section card">
        <p className="section-title">📊 Spotify poll questions</p>
        <div className="poll-list">
          {(metadata.spotify_poll_questions || []).map((poll, i) => (
            <div key={i} className="poll-item">
              <div className="poll-question">
                <span>{poll.question}</span>
                <CopyButton text={poll.question} />
              </div>
              <div className="poll-options">
                {(poll.options || []).map((opt, j) => (
                  <span key={j} className="poll-opt">{opt}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cover Photo */}
      <section className="ready-section card">
        <p className="section-title">📷 Find your cover photo</p>
        <p className="cover-hint">Click to search Google Images for real photos — pick one that fits the vibe.</p>
        <div className="cover-links">
          {(metadata.cover_image_searches || []).map((item, i) => (
            <a
              key={i}
              href={item.url || `https://www.google.com/search?q=${encodeURIComponent(item.query || item)}&tbm=isch&tbs=itp:photo`}
              target="_blank"
              rel="noreferrer"
              className="cover-link"
            >
              <span className="cover-num">{i + 1}</span>
              <span>{item.query || item}</span>
              <span className="cover-arrow">→</span>
            </a>
          ))}
        </div>
      </section>

      {/* Social Posts */}
      <section className="ready-section card">
        <p className="section-title">📱 Social posts</p>
        <div className="social-tabs-content">
          <SocialPost platform="Instagram" icon="📸" text={metadata.instagram_post} />
          <SocialPost platform="Twitter / X" icon="𝕏" text={metadata.twitter_post} />
          <SocialPost platform="YouTube" icon="▶" text={metadata.youtube_description} />
        </div>
      </section>

      <div className="ready-footer">
        <button className="btn-primary" onClick={onNew}>🎙 Start a new episode</button>
      </div>
    </main>
  )
}

function SocialPost({ platform, icon, text }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="social-post">
      <div className="social-header" onClick={() => setOpen(o => !o)}>
        <span>{icon} {platform}</span>
        <span className="social-toggle">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="social-body">
          <pre className="social-text">{text}</pre>
          <CopyButton text={text} label={`Copy ${platform} post`} />
        </div>
      )}
    </div>
  )
}
