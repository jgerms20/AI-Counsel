import { useState, useRef, useCallback } from 'react'
import { dispatchWorkflow } from '../lib/github.js'
import './TopicInput.css'

const AUDIO_METHODS = [
  {
    id: 'podcastfy',
    label: 'Podcastfy',
    tag: 'Free',
    tagStyle: 'tag-green',
    desc: 'Two AI hosts debate and explore your topic. ~50 min, fully automated.',
  },
  {
    id: 'elevenlabs',
    label: 'ElevenLabs',
    tag: 'Best voices',
    tagStyle: '',
    desc: 'Premium voice quality via ElevenLabs GenFM. Requires ElevenLabs API key.',
  },
  {
    id: 'notebooklm',
    label: 'NotebookLM',
    tag: 'Manual step',
    tagStyle: '',
    desc: 'Research is packaged for upload to Google NotebookLM. You generate audio there.',
  },
]

export default function TopicInput({ onStart, hasSettings, onNeedSettings }) {
  const [topic, setTopic]           = useState('')
  const [inputMode, setInputMode]   = useState('text')
  const [audioMethod, setAudioMethod] = useState('podcastfy')
  const [recording, setRecording]   = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [launching, setLaunching]   = useState(false)
  const [error, setError]           = useState(null)
  const [dragOver, setDragOver]     = useState(false)

  const recognitionRef = useRef(null)
  const fileRef        = useRef(null)

  /* ── Voice ── */
  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setError('Voice not supported in this browser — use Chrome or Safari.'); return }
    const r = new SR()
    r.continuous = true
    r.interimResults = true
    r.lang = 'en-US'
    let final = ''
    r.onresult = e => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      setTopic(final + interim)
    }
    r.onerror = () => setError('Voice error — try typing instead.')
    r.onend   = () => setRecording(false)
    r.start()
    recognitionRef.current = r
    setRecording(true)
    setError(null)
  }

  function stopVoice() {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setRecording(false)
  }

  /* ── Audio file → Whisper ── */
  async function transcribeFile(file) {
    if (!file) return
    setTranscribing(true)
    setError(null)
    try {
      const { getSettings } = await import('../lib/settings.js')
      const { openaiKey } = getSettings()
      if (!openaiKey) throw new Error('Add your OpenAI key in Settings to transcribe audio files.')
      const fd = new FormData()
      fd.append('file', file)
      fd.append('model', 'whisper-1')
      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openaiKey}` },
        body: fd,
      })
      const data = await res.json()
      if (data.text) { setTopic(data.text); setInputMode('text') }
      else throw new Error(data.error?.message || 'Transcription failed')
    } catch (err) {
      setError(err.message)
    } finally {
      setTranscribing(false)
    }
  }

  /* ── Drag & drop ── */
  const handleDragOver = useCallback(e => { e.preventDefault(); setDragOver(true) }, [])
  const handleDragLeave = useCallback(() => setDragOver(false), [])
  const handleDrop = useCallback(e => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith('audio/')) transcribeFile(file)
    else setError('Please drop an audio file (mp3, m4a, wav, etc.)')
  }, [])

  /* ── Launch ── */
  async function handleStart() {
    if (!hasSettings) { onNeedSettings(); return }
    if (!topic.trim()) { setError('Enter or record your topic first.'); return }
    setLaunching(true)
    setError(null)
    try {
      const label = `ep-${Date.now()}`
      await dispatchWorkflow({ topic: topic.trim(), audioMethod, runLabel: label })
      onStart(label)
    } catch (err) {
      setError(`Could not start: ${err.message}`)
      setLaunching(false)
    }
  }

  const canStart = !launching && topic.trim().length > 0

  return (
    <main className="main">

      {/* Page heading */}
      <div className="ti-heading">
        <h1>What do you want to go deep on?</h1>
        <p>Type, speak, or drop an audio file. Everything else is automated.</p>
      </div>

      {/* Settings nudge */}
      {!hasSettings && (
        <button className="settings-nudge" onClick={onNeedSettings}>
          <span className="nudge-dot" />
          Configure GitHub settings before starting
          <span className="nudge-arrow">→</span>
        </button>
      )}

      {/* Two-column grid */}
      <div className="ti-grid">

        {/* ── Left: Topic input ── */}
        <div className="ti-left">

          {/* Mode tabs */}
          <div className="mode-tabs">
            {[['text','Type'],['voice','Record'],['file','Upload']].map(([m,l]) => (
              <button
                key={m}
                className={`mode-tab ${inputMode === m ? 'active' : ''}`}
                onClick={() => setInputMode(m)}
              >{l}</button>
            ))}
          </div>

          {/* Text mode */}
          {inputMode === 'text' && (
            <textarea
              className="topic-area"
              rows={7}
              placeholder="e.g. The Chinese Cultural Revolution — what caused it, what actually happened, and its lasting impact on modern China"
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          )}

          {/* Voice mode */}
          {inputMode === 'voice' && (
            <div className="voice-panel">
              <button
                className={`voice-btn ${recording ? 'active' : ''}`}
                onClick={recording ? stopVoice : startVoice}
              >
                <span className="voice-icon">{recording ? '■' : '●'}</span>
                {recording ? 'Stop recording' : 'Start recording'}
              </button>
              {recording && <p className="voice-hint">Listening… speak your idea naturally</p>}
              {topic && (
                <textarea
                  className="topic-area"
                  rows={5}
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              )}
            </div>
          )}

          {/* File / drop mode */}
          {inputMode === 'file' && (
            <div
              className={`drop-zone ${dragOver ? 'drag-over' : ''} ${transcribing ? 'loading' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !transcribing && fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="audio/*"
                style={{ display: 'none' }}
                onChange={e => transcribeFile(e.target.files?.[0])}
              />
              {transcribing ? (
                <>
                  <div className="drop-spinner" />
                  <p className="drop-label">Transcribing with Whisper…</p>
                </>
              ) : (
                <>
                  <div className="drop-icon">🎵</div>
                  <p className="drop-label">Drop an audio file here</p>
                  <p className="drop-hint">or click to browse — mp3, m4a, wav, ogg</p>
                </>
              )}
            </div>
          )}

          {topic && inputMode !== 'text' && (
            <p className="topic-preview-label">Transcribed topic:</p>
          )}
        </div>

        {/* ── Right: Audio method ── */}
        <div className="ti-right">
          <p className="label">Audio method</p>
          <div className="method-list">
            {AUDIO_METHODS.map(m => (
              <button
                key={m.id}
                className={`method-card ${audioMethod === m.id ? 'selected' : ''}`}
                onClick={() => setAudioMethod(m.id)}
              >
                <div className="method-card-top">
                  <span className="method-name">{m.label}</span>
                  <span className={`tag ${m.tagStyle}`}>{m.tag}</span>
                </div>
                <p className="method-desc">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {/* Start button */}
      <div className="ti-footer">
        <button
          className="btn-primary start-btn"
          onClick={handleStart}
          disabled={!canStart}
        >
          {launching
            ? <><span className="start-spinner" /> Starting…</>
            : <>Start automation →</>
          }
        </button>
        <p className="ti-footer-hint">
          Research takes ~40 min. You'll get titles, descriptions, audio, social posts, and cover photo links.
        </p>
      </div>

    </main>
  )
}
