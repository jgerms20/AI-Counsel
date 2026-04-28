import { useState, useEffect } from 'react'
import TopicInput from './components/TopicInput.jsx'
import ProgressTracker from './components/ProgressTracker.jsx'
import ReadyScreen from './components/ReadyScreen.jsx'
import Settings from './components/Settings.jsx'
import { getSettings } from './lib/settings.js'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('input') // input | progress | ready | settings
  const [runLabel, setRunLabel] = useState(null)
  const [results, setResults] = useState(null)
  const [hasSettings, setHasSettings] = useState(false)

  useEffect(() => {
    const s = getSettings()
    setHasSettings(!!(s.githubPat && s.repo))
  }, [])

  function handleStart(label) {
    setRunLabel(label)
    setScreen('progress')
  }

  function handleComplete(data) {
    setResults(data)
    setScreen('ready')
  }

  function handleReset() {
    setRunLabel(null)
    setResults(null)
    setScreen('input')
  }

  if (screen === 'settings') {
    return (
      <div className="app">
        <Header onSettings={() => setScreen(hasSettings ? 'input' : 'settings')} settingsActive />
        <Settings onSave={() => { setHasSettings(true); setScreen('input') }} />
      </div>
    )
  }

  return (
    <div className="app">
      <Header onSettings={() => setScreen('settings')} />
      {screen === 'input' && (
        <TopicInput onStart={handleStart} hasSettings={hasSettings} onNeedSettings={() => setScreen('settings')} />
      )}
      {screen === 'progress' && (
        <ProgressTracker runLabel={runLabel} onComplete={handleComplete} onReset={handleReset} />
      )}
      {screen === 'ready' && (
        <ReadyScreen results={results} runLabel={runLabel} onNew={handleReset} />
      )}
    </div>
  )
}

function Header({ onSettings, settingsActive }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <span className="logo-icon">🎙</span>
          <div>
            <div className="logo-title">Eclectic Polymath</div>
            <div className="logo-sub">Podcast Studio</div>
          </div>
        </div>
        <button className={`btn-secondary ${settingsActive ? 'active' : ''}`} onClick={onSettings}>
          {settingsActive ? '← Back' : '⚙ Settings'}
        </button>
      </div>
    </header>
  )
}
