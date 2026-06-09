import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

type VerdictType = 'cool' | 'not-cool'
type Screen = 'setup' | 'playing' | 'ranking'
type TurnPhase = 'idle' | 'loading' | 'result'

interface Verdict {
  type: VerdictType
  score: number
  message: string
  emoji: string
}

interface Player {
  id: number
  name: string
  scores: number[]
  cool: number
  notCool: number
}

interface LastTurn {
  playerName: string
  round: number
  verdict: Verdict
}

interface RankingPlayer extends Player {
  average: number
  best: number
  total: number
}

const DEFAULT_NAMES = ['Lucien', 'Kelvin', 'Fritz', 'Jannis', 'Jonas', 'Mira', 'Noah', 'Leni']
const MIN_PLAYERS = 2
const MAX_PLAYERS = 8
const MIN_ROUNDS = 1
const MAX_ROUNDS = 7

const COOL_VERDICTS = [
  { emoji: '😎', message: 'Legendenstatus aktiviert.' },
  { emoji: '🔥', message: 'Zu cool fuer diese Runde.' },
  { emoji: '⚡', message: 'Elektrische Aura im Raum.' },
  { emoji: '🌊', message: 'Smooth wie Mitternacht.' },
  { emoji: '🎸', message: 'Hauptbuehnen-Energie.' },
  { emoji: '🕶️', message: 'Sonnenbrille waere angemessen.' },
  { emoji: '💎', message: 'Selten. Klar. Iconic.' },
]

const UNCOOL_VERDICTS = [
  { emoji: '💀', message: 'Der Raum schweigt kurz.' },
  { emoji: '🥶', message: 'Kalt, aber nicht cool.' },
  { emoji: '🤓', message: 'Sehr mutiger Auftritt.' },
  { emoji: '🧊', message: 'Eiswuerfel mit Nervositaet.' },
  { emoji: '📟', message: 'Pager-Vibes wurden erkannt.' },
  { emoji: '🧦', message: 'Socken-in-Sandalen-Alarm.' },
  { emoji: '🥴', message: 'Nah dran. Trotzdem daneben.' },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function makeVerdict(): Verdict {
  const isCool = Math.random() < 0.5
  const score = isCool
    ? Math.floor(Math.random() * 25) + 76
    : Math.floor(Math.random() * 45) + 10
  const pool = isCool ? COOL_VERDICTS : UNCOOL_VERDICTS
  const pick = pool[Math.floor(Math.random() * pool.length)]

  return {
    type: isCool ? 'cool' : 'not-cool',
    score,
    message: pick.message,
    emoji: pick.emoji,
  }
}

function getAverage(scores: number[]) {
  if (scores.length === 0) return 0
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup')
  const [playerCount, setPlayerCount] = useState(5)
  const [rounds, setRounds] = useState(3)
  const [playerNames, setPlayerNames] = useState(DEFAULT_NAMES.slice(0, 5))
  const [players, setPlayers] = useState<Player[]>([])
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('idle')
  const [completedTurns, setCompletedTurns] = useState(0)
  const [lastTurn, setLastTurn] = useState<LastTurn | null>(null)
  const [barWidth, setBarWidth] = useState(0)
  const [flashKey, setFlashKey] = useState(0)
  const [revealCount, setRevealCount] = useState(0)

  const totalTurns = players.length * rounds
  const currentPlayerIndex = players.length > 0 ? completedTurns % players.length : 0
  const currentRound = players.length > 0 ? Math.floor(completedTurns / players.length) + 1 : 1
  const currentPlayer = players[currentPlayerIndex]
  const progress = totalTurns > 0 ? Math.round((completedTurns / totalTurns) * 100) : 0
  const activeVerdict = lastTurn?.verdict ?? null
  const verdictClass = activeVerdict?.type ?? 'idle'
  const showBar = turnPhase === 'result' && activeVerdict !== null

  const ranking = useMemo<RankingPlayer[]>(() => {
    return players
      .map(player => ({
        ...player,
        average: getAverage(player.scores),
        best: player.scores.length > 0 ? Math.max(...player.scores) : 0,
        total: player.scores.reduce((sum, score) => sum + score, 0),
      }))
      .sort((a, b) => a.average - b.average || a.best - b.best || a.name.localeCompare(b.name))
  }, [players])

  const champion = ranking[ranking.length - 1]

  useEffect(() => {
    if (screen !== 'ranking') return

    setRevealCount(0)
    const timers = ranking.map((_, index) => (
      window.setTimeout(() => setRevealCount(index + 1), 500 + index * 850)
    ))

    return () => timers.forEach(window.clearTimeout)
  }, [ranking, screen])

  const updatePlayerCount = useCallback((nextCount: number) => {
    const safeCount = clamp(nextCount, MIN_PLAYERS, MAX_PLAYERS)
    setPlayerCount(safeCount)
    setPlayerNames(names => (
      Array.from({ length: safeCount }, (_, index) => names[index] ?? DEFAULT_NAMES[index] ?? `Spieler ${index + 1}`)
    ))
  }, [])

  const updateName = useCallback((index: number, value: string) => {
    setPlayerNames(names => names.map((name, nameIndex) => (nameIndex === index ? value : name)))
  }, [])

  const startGame = useCallback(() => {
    const cleanNames = playerNames
      .slice(0, playerCount)
      .map((name, index) => name.trim() || `Spieler ${index + 1}`)

    setPlayers(cleanNames.map((name, index) => ({
      id: index,
      name,
      scores: [],
      cool: 0,
      notCool: 0,
    })))
    setCompletedTurns(0)
    setLastTurn(null)
    setTurnPhase('idle')
    setBarWidth(0)
    setRevealCount(0)
    setScreen('playing')
  }, [playerCount, playerNames])

  const judge = useCallback(() => {
    if (!currentPlayer || turnPhase === 'loading') return

    setTurnPhase('loading')
    setLastTurn(null)
    setBarWidth(0)

    const judgedPlayer = currentPlayer
    const judgedRound = currentRound
    const delay = 900 + Math.random() * 700

    window.setTimeout(() => {
      const verdict = makeVerdict()

      setPlayers(currentPlayers => currentPlayers.map(player => (
        player.id === judgedPlayer.id
          ? {
              ...player,
              scores: [...player.scores, verdict.score],
              cool: player.cool + (verdict.type === 'cool' ? 1 : 0),
              notCool: player.notCool + (verdict.type === 'not-cool' ? 1 : 0),
            }
          : player
      )))
      setLastTurn({ playerName: judgedPlayer.name, round: judgedRound, verdict })
      setCompletedTurns(turns => turns + 1)
      setTurnPhase('result')
      setFlashKey(key => key + 1)
      window.setTimeout(() => setBarWidth(verdict.score), 80)
    }, delay)
  }, [currentPlayer, currentRound, turnPhase])

  const continueGame = useCallback(() => {
    if (completedTurns >= totalTurns) {
      setScreen('ranking')
      setTurnPhase('idle')
      return
    }

    setTurnPhase('idle')
    setLastTurn(null)
    setBarWidth(0)
  }, [completedTurns, totalTurns])

  const restartSetup = useCallback(() => {
    setScreen('setup')
    setPlayers([])
    setCompletedTurns(0)
    setLastTurn(null)
    setTurnPhase('idle')
    setBarWidth(0)
    setRevealCount(0)
  }, [])

  return (
    <>
      <div
        key={flashKey}
        className={`flash ${activeVerdict?.type ?? ''}`}
      />

      <div className={`app ${screen}`}>
        <header className="header">
          <p className="header-eyebrow">The Ultimate Judgement</p>
          <h1 className="header-title">
            BIST DU<br /><span>COOL?</span>
          </h1>
        </header>

        {screen === 'setup' && (
          <main className="panel setup-panel">
            <div className="corner tl" />
            <div className="corner tr" />
            <div className="corner bl" />
            <div className="corner br" />

            <section className="setup-hero">
              <span className="setup-icon">🎛️</span>
              <div>
                <p className="panel-kicker">Laptop Party Mode</p>
                <h2>Wer tritt an?</h2>
              </div>
            </section>

            <div className="setup-controls">
              <label className="stepper-field">
                <span>Spieler</span>
                <div className="stepper">
                  <button type="button" onClick={() => updatePlayerCount(playerCount - 1)}>-</button>
                  <strong>{playerCount}</strong>
                  <button type="button" onClick={() => updatePlayerCount(playerCount + 1)}>+</button>
                </div>
              </label>

              <label className="stepper-field">
                <span>Runden</span>
                <div className="stepper">
                  <button type="button" onClick={() => setRounds(value => clamp(value - 1, MIN_ROUNDS, MAX_ROUNDS))}>-</button>
                  <strong>{rounds}</strong>
                  <button type="button" onClick={() => setRounds(value => clamp(value + 1, MIN_ROUNDS, MAX_ROUNDS))}>+</button>
                </div>
              </label>
            </div>

            <div className="name-grid">
              {playerNames.map((name, index) => (
                <label className="name-field" key={index}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <input
                    value={name}
                    onChange={event => updateName(index, event.target.value)}
                    maxLength={18}
                    aria-label={`Name Spieler ${index + 1}`}
                  />
                </label>
              ))}
            </div>

            <button className="btn" onClick={startGame}>
              <span>Spiel starten</span>
            </button>
          </main>
        )}

        {screen === 'playing' && currentPlayer && (
          <main className="panel game-panel">
            <div className="corner tl" />
            <div className="corner tr" />
            <div className="corner bl" />
            <div className="corner br" />

            <div className="turn-meta">
              <span>Runde {Math.min(currentRound, rounds)} / {rounds}</span>
              <span>{completedTurns} / {totalTurns} Urteile</span>
            </div>

            <div className="progress-track" aria-label="Spielfortschritt">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>

            <section className="turn-stage">
              {turnPhase !== 'result' && (
                <>
                  <p className="panel-kicker">Jetzt am Zug</p>
                  <h2 className="player-callout">{currentPlayer.name}</h2>
                  <p className="turn-copy">Der Laptop schaut tief in die Aura.</p>
                </>
              )}

              {turnPhase === 'loading' && (
                <div className="scanner" aria-label="Analyse laeuft">
                  <span /><span /><span /><span />
                </div>
              )}

              {turnPhase === 'result' && lastTurn && (
                <div className="verdict" key={`${lastTurn.playerName}-${completedTurns}`}>
                  <p className="panel-kicker">{lastTurn.playerName} · Runde {lastTurn.round}</p>
                  <span className="verdict-emoji">{lastTurn.verdict.emoji}</span>
                  <div className={`verdict-label ${lastTurn.verdict.type}`}>
                    {lastTurn.verdict.type === 'cool' ? 'COOL' : 'UNCOOL'}
                  </div>
                  <p className="verdict-subtitle">{lastTurn.verdict.message}</p>
                </div>
              )}
            </section>

            <div className="coolness-bar-wrapper">
              <div className="coolness-bar-label">
                <span>Coolness Level</span>
                <span>{showBar ? `${activeVerdict!.score}%` : '-'}</span>
              </div>
              <div className="coolness-bar-track">
                <div
                  className={`coolness-bar-fill ${showBar ? verdictClass : 'idle'}`}
                  style={{ width: showBar ? `${barWidth}%` : '0%' }}
                />
              </div>
            </div>

            {turnPhase === 'result' ? (
              <button className="btn" onClick={continueGame}>
                <span>{completedTurns >= totalTurns ? 'Ranking enthuellen' : 'Naechster Spieler'}</span>
              </button>
            ) : (
              <button
                className={`btn ${turnPhase === 'loading' ? 'loading' : ''}`}
                onClick={judge}
                disabled={turnPhase === 'loading'}
              >
                <span>{turnPhase === 'loading' ? 'Analysiere...' : `${currentPlayer.name} pruefen`}</span>
              </button>
            )}

            <div className="scoreboard">
              {players.map(player => (
                <div className={`score-row ${player.id === currentPlayer.id && turnPhase !== 'result' ? 'active' : ''}`} key={player.id}>
                  <span className="score-name">{player.name}</span>
                  <span className="score-average">{player.scores.length > 0 ? `${getAverage(player.scores)}%` : '--'}</span>
                  <span className="score-record">{player.cool}:{player.notCool}</span>
                </div>
              ))}
            </div>
          </main>
        )}

        {screen === 'ranking' && (
          <main className="panel ranking-panel">
            <div className="corner tl" />
            <div className="corner tr" />
            <div className="corner bl" />
            <div className="corner br" />

            <section className="ranking-head">
              <p className="panel-kicker">Final Reveal</p>
              <h2>Von uncool bis ikonisch</h2>
              {champion && revealCount >= ranking.length && (
                <p className="champion-line">{champion.name} ist offiziell am coolsten.</p>
              )}
            </section>

            <div className="ranking-list">
              {ranking.slice(0, revealCount).map((player, index) => {
                const isChampion = index === ranking.length - 1
                const isUncoolest = index === 0

                return (
                  <article
                    className={`ranking-card ${isChampion ? 'champion' : ''} ${isUncoolest ? 'uncoolest' : ''}`}
                    key={player.id}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <span className="ranking-place">{index + 1}</span>
                    <div className="ranking-copy">
                      <strong>{player.name}</strong>
                      <span>{isChampion ? 'Coolness Champion' : isUncoolest ? 'Uncoolster Startpunkt' : 'auf dem Weg nach oben'}</span>
                    </div>
                    <div className="ranking-score">
                      <strong>{player.average}%</strong>
                      <span>{player.cool}:{player.notCool}</span>
                    </div>
                  </article>
                )
              })}
            </div>

            {revealCount < ranking.length ? (
              <button className="btn secondary" onClick={() => setRevealCount(ranking.length)}>
                <span>Alles anzeigen</span>
              </button>
            ) : (
              <button className="btn" onClick={restartSetup}>
                <span>Neue Runde</span>
              </button>
            )}
          </main>
        )}

        <footer className="footer">
          <span>© Coolness Institute · Ergebnisse sind endgueltig</span>
        </footer>
      </div>
    </>
  )
}
