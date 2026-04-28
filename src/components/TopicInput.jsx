import { useState, useRef } from 'react'
import { dispatchWorkflow } from '../lib/github.js'
import './TopicInput.css'

const AUDIO_METHODS = [
  {
    id: 'podcastfy',
    label: 'Podcastfy',
    tag: 'Free',
    desc: 'Open-source AI podcast generation. Two conversational hosts, ~50 min deep-dive. Fully automated.',
  },
  {
    id: 'elevenlabs',
    label: 'ElevenLabs',
    tag: 'Best quality',
    desc: 'Premium voice quality via ElevenLabs GenFM. Requires ElevenLabs API key.',
  },
  {
    id: 'notebooklm',
    label: 'NotebookLM',
    tag: 'Manual step',
    desc: 'Research is packaged for you. You upload to NotebookLM and generate the audio there — then continue.',
  },
]

export default function TopicInput({ onStart, hasSettings, onNeedSettings }) {
  const [topic, setTopic] = useState('')
  const [inputMode, setInputMode] = useState('text') // text | voice | file
  const [audioMethod, setAudioMethod] = useState('podcastfy')
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState(null)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const fileRef = useRef(null)

  // Browser voice recording via Web Speech API
  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setError('Voice recording not supported in this browser. Use Chrome or Safari.'); return }
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    let final = ''
    recognition.onresult = e => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      setTopic(final + interim)
    }
    recognition.onerror = () => setError('Voice error. Try typing instead.')
    recognition.onend = () => setRecording(false)
    recognition.start()
    mediaRef.current = recognition
    setRecording(true)
    setError(null)
  }

  function stopVoice() {
    if (mediaRef.current) { mediaRef.current.stop(); mediaRef.current = null }
    setRecording(false)
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setTranscribing(true)
    setError(null)
    try {
      // Use OpenAI Whisper via a fetch call — the browser-side call needs the key from settings
      const { getSettings } = await import('../lib/settings.js')
      const { openaiKey } = getSettings()
      if (!openaiKey) {
        setError('Add your OpenAI API key in Settings to use audio file upload.')
        setTranscribing(false)
        return
      }
      const fd = new FormData()
      fd.append('file', file)
      fd.append('model', 'whisper-1')
      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openaiKey}` },
        body: fd,
      })
      const data = await res.json()
      if (data.text) setTopic(data.text)
      else throw new Error(data.error?.message || 'Transcription failed')
    } catch (err) {
      setError(`Transcription error: ${err.message}`)
    } finally {
      setTranscribing(false)
    }
  }

  async function handleStart() {
    if (!hasSettings) { onNeedSettings(); return }
    if (!topic.trim()) { setError('Please enter or record your topic first.'); return }
    setLaunching(true)
    setError(null)
    try {
      const runLabel = `ep-${Date.now()}`
      await dispatchWorkflow({ topic: topic.trim(), audioMethod, runLabel })
      onStart(runLabel)
    } catch (err) {
      setError(`Failed to start: ${err.message}`)
      setLaunching(false)
    }
  }

  return (
    <main className="main">
      <div className="input-header">
        <h1>What do you want to go deep on?</h1>
        <p>Speak, upload audio, or type your idea — then hit Start. Everything else is automated.</p>
      </div>

      {!hasSettings && (
        <div className="settings-banner card" onClick={onNeedSettings}>
          <span>⚙ Configure your GitHub settings first →</span>
        </div>
      )}

      <div className="card topic-card">
        <div className="input-mode-tabs">
          {[['text', '⌨ Type'], ['voice', '🎙 Record'], ['file', '📁 Upload']].map(([mode, label]) => (
            <button
              key={mode}
              className={`mode-tab ${inputMode === mode ? 'active' : ''}`}
              onClick={() => setInputMode(mode)}
            >
              {label}
            </button>
          ))}
        </div>

        {inputMode === 'text' && (
          <textarea
            className="topic-textarea"
            placeholder="e.g. The Chinese Cultural Revolution — causes, what actually happened, and its lasting impact on modern China"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            rows={5}
          />
        )}

        {inputMode === 'voice' && (
          <div className="voice-area">
            <button
              className={`voice-btn ${recording ? 'recording' : ''}`}
              onClick={recording ? stopVoice : startVoice}
            >
              {recording ? '⏹ Stop Recording' : '🎙 Start Recording'}
            </button>
            {recording && <div className="recording-pulse">Recording… speak your topic</div>}
            {topic && (
              <textarea
                className="topic-textarea"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={4}
              />
            )}
          </div>
        )}

        {inputMode === 'file' && (
          <div className="file-area">
            <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleFileUpload} />
            <button className="btn-secondary upload-btn" onClick={() => fileRef.current?.click()} disabled={transcribing}>
              {transcribing ? 'Transcribing…' : '📁 Choose audio file'}
            </button>
            {topic && (
              <textarea
                className="topic-textarea"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={4}
              />
            )}
          </div>
        )}
      </div>

      <div className="card audio-method-card">
        <p className="section-title">Audio Generation Method</p>
        <div className="audio-methods">
          {AUDIO_METHODS.map(m => (
            <label key={m.id} className={`radio-option ${audioMethod === m.id ? 'selected' : ''}`}>
              <input type="radio" name="audio" value={m.id} checked={audioMethod === m.id} onChange={() => setAudioMethod(m.id)} />
              <div>
                <div className="method-label">
                  {m.label} <span className="tag">{m.tag}</span>
                </div>
                <div className="method-desc">{m.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <button
        className="btn-primary start-btn"
        onClick={handleStart}
        disabled={launching || !topic.trim()}
      >
        {launching ? 'Starting…' : '▶ Start Automation'}
      </button>
    </main>
  )
}
