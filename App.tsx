import { useState, useCallback } from 'react'
import './App.css'

type VerdictType = 'cool' | 'not-cool'

interface Verdict {
  type: VerdictType
  score: number
  message: string
  emoji: string
}

const COOL_VERDICTS = [
  { emoji: '😎', message: 'Undeniably legendary.' },
  { emoji: '🔥', message: 'Too hot to handle.' },
  { emoji: '⚡', message: 'Pure electric energy.' },
  { emoji: '🌊', message: 'Smooth as the ocean.' },
  { emoji: '🎸', message: 'Rock star vibes only.' },
  { emoji: '🕶️', message: 'Shades required at all times.' },
  { emoji: '💎', message: 'Rare. Flawless. Iconic.' },
]

const UNCOOL_VERDICTS = [
  { emoji: '💀', message: 'Tragically un-hip.' },
  { emoji: '🥶', message: 'Not that kind of cold.' },
  { emoji: '🤓', message: 'Nerd alert. Maximum cringe.' },
  { emoji: '🧊', message: 'Ice cold... but make it awkward.' },
  { emoji: '📟', message: 'Still using a pager in 2025.' },
  { emoji: '🧦', message: 'Sandals AND socks. Classic.' },
  { emoji: '🥴', message: 'Close. But no cigar.' },
]

interface Stats {
  cool: number
  notCool: number
  total: number
}

type Phase = 'idle' | 'loading' | 'result'

export default function App() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [stats, setStats] = useState<Stats>({ cool: 0, notCool: 0, total: 0 })
  const [flashKey, setFlashKey] = useState<number>(0)
  const [barWidth, setBarWidth] = useState<number>(0)

  const judge = useCallback(() => {
    if (phase === 'loading') return
    setPhase('loading')
    setVerdict(null)
    setBarWidth(0)

    const delay = 800 + Math.random() * 600

    setTimeout(() => {
      const isCool = Math.random() < 0.5
      const score = isCool
        ? Math.floor(Math.random() * 25) + 76   // 76–100
        : Math.floor(Math.random() * 45) + 10   // 10–54

      const pool = isCool ? COOL_VERDICTS : UNCOOL_VERDICTS
      const pick = pool[Math.floor(Math.random() * pool.length)]

      const newVerdict: Verdict = {
        type: isCool ? 'cool' : 'not-cool',
        score,
        message: pick.message,
        emoji: pick.emoji,
      }

      setVerdict(newVerdict)
      setPhase('result')
      setFlashKey(k => k + 1)
      setStats(s => ({
        cool: s.cool + (isCool ? 1 : 0),
        notCool: s.notCool + (isCool ? 0 : 1),
        total: s.total + 1,
      }))

      // animate bar after short delay
      setTimeout(() => setBarWidth(score), 80)
    }, delay)
  }, [phase])

  const verdictClass = verdict?.type ?? 'idle'
  const showBar = phase === 'result' && verdict !== null

  return (
    <>
      {/* flash overlay */}
      <div
        key={flashKey}
        className={`flash ${verdict?.type ?? ''}`}
      />

      <div className="app">
        {/* Header */}
        <header className="header">
          <p className="header-eyebrow">The Ultimate Judgement</p>
          <h1 className="header-title">
            BIST DU<br /><span>COOL?</span>
          </h1>
        </header>

        {/* Main Panel */}
        <main className="panel">
          <div className="corner tl" />
          <div className="corner tr" />
          <div className="corner bl" />
          <div className="corner br" />

          {/* Result display */}
          <div className="result-display">
            {phase === 'idle' && (
              <div className="result-idle">
                <span className="result-idle-icon">🎲</span>
                <p className="result-idle-text">Drück den Knopf. Finde die Wahrheit.</p>
              </div>
            )}

            {phase === 'loading' && (
              <div className="loading-dots">
                <span /><span /><span />
              </div>
            )}

            {phase === 'result' && verdict && (
              <div className={`verdict`} key={`${stats.total}`}>
                <span className="verdict-emoji">{verdict.emoji}</span>
                <div className={`verdict-label ${verdict.type}`}>
                  {verdict.type === 'cool' ? 'COOL' : 'UNCOOL'}
                </div>
                <p className="verdict-subtitle">{verdict.message}</p>
              </div>
            )}
          </div>

          {/* Coolness bar */}
          <div className="coolness-bar-wrapper">
            <div className="coolness-bar-label">
              <span>Coolness Level</span>
              <span>{showBar ? `${verdict!.score}%` : '—'}</span>
            </div>
            <div className="coolness-bar-track">
              <div
                className={`coolness-bar-fill ${showBar ? verdictClass : 'idle'}`}
                style={{ width: showBar ? `${barWidth}%` : '0%' }}
              />
            </div>
          </div>

          {/* CTA Button */}
          <button
            className={`btn ${phase === 'loading' ? 'loading' : ''}`}
            onClick={judge}
            disabled={phase === 'loading'}
          >
            <span>
              {phase === 'loading' ? 'Analyzing...' :
               phase === 'result' ? 'Nochmal' : 'JETZT URTEILEN'}
            </span>
          </button>

          {/* Stats */}
          {stats.total > 0 && (
            <div className="stats">
              <div className="stat">
                <div className="stat-value cool-count">{stats.cool}</div>
                <div className="stat-label">Cool</div>
              </div>
              <div className="stat">
                <div className="stat-value not-cool-count">{stats.notCool}</div>
                <div className="stat-label">Uncool</div>
              </div>
              <div className="stat">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Gesamt</div>
              </div>
            </div>
          )}
        </main>

        <footer className="footer">
          <span>© Coolness Institute · Ergebnisse sind endgültig</span>
        </footer>
      </div>
    </>
  )
}
