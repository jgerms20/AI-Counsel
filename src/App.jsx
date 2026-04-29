import { useState, useEffect } from 'react'
import TopicInput from './components/TopicInput.jsx'
import ProgressTracker from './components/ProgressTracker.jsx'
import ReadyScreen from './components/ReadyScreen.jsx'
import Settings from './components/Settings.jsx'
import { getSettings } from './lib/settings.js'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('input')
  const [runLabel, setRunLabel] = useState(null)
  const [results, setResults] = useState(null)
  const [hasSettings, setHasSettings] = useState(false)

  useEffect(() => {
    const s = getSettings()
    setHasSettings(!!(s.githubPat && s.repo))
  }, [])

  function goSettings() { setScreen('settings') }
  function goBack()     { setScreen('input') }

  function handleSaved() {
    setHasSettings(true)
    setScreen('input')
  }

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

  return (
    <div className="app">
      <Header
        onSettings={goSettings}
        onBack={goBack}
        showBack={screen === 'settings'}
      />

      {screen === 'settings'  && <Settings onSave={handleSaved} />}
      {screen === 'input'     && <TopicInput onStart={handleStart} hasSettings={hasSettings} onNeedSettings={goSettings} />}
      {screen === 'progress'  && <ProgressTracker runLabel={runLabel} onComplete={handleComplete} onReset={handleReset} />}
      {screen === 'ready'     && <ReadyScreen results={results} runLabel={runLabel} onNew={handleReset} />}
    </div>
  )
}

function Header({ onSettings, onBack, showBack }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <div className="logo-mark">🎙</div>
          <div className="logo-text">
            <div className="logo-title">Eclectic Polymath</div>
            <div className="logo-sub">Podcast Studio</div>
          </div>
        </div>

        <div className="header-actions">
          {showBack
            ? <button className="btn-ghost" onClick={onBack}>← Back</button>
            : <button className="btn-ghost" onClick={onSettings}>Settings</button>
          }
        </div>
      </div>
    </header>
  )
}
