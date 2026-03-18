import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [phase, setPhase] = useState('start') // 'start' | 'playing' | 'result'
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(10)
  const [feedback, setFeedback] = useState(null)
  const [hadJackpot, setHadJackpot] = useState(false)
  const [gauge, setGauge] = useState(0)
  const feedbackTimer = useRef(null)

  function startGame() {
    setScore(0)
    setTime(10)
    setHadJackpot(false)
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing') return

    const interval = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          clearInterval(interval)
          setPhase('result')
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [phase])

  useEffect(() => {
    if (phase !== 'playing') return
    const interval = setInterval(() => {
      setGauge(g => (g + 1) % 101)
    }, 16)
    return () => clearInterval(interval)
  }, [phase])

  useEffect(() => () => clearTimeout(feedbackTimer.current), [])

  if (phase === 'start') {
    return (
      <div className="game">
        <h1>Click Game</h1>
        <p>Click as many times as you can in 10 seconds!</p>
        <button onClick={startGame}>Start</button>
      </div>
    )
  }

  if (phase === 'result') {
    const message = score >= 100 ? '오늘 미쳤다 🔥' : score >= 50 ? '오… 운 좋은데요?' : score >= 20 ? '괜찮은데요?' : '오늘 운이 별로네요 😅'
    return (
      <div className="game">
        <h1>Time's up!</h1>
        <p className="final-score">{score}</p>
        {hadJackpot && <p className="jackpot-banner">JACKPOT 터졌다!! 🎉</p>}
        <p className="final-message">{message}</p>
        <button className="retry-btn" onClick={startGame}>Play Again</button>
      </div>
    )
  }

  return (
    <div className="game">
      <p className="timer">{time}s</p>
      <div className="gauge-track">
        <div className="gauge-zone-good" />
        <div className="gauge-zone-perfect" />
        <div className="gauge-indicator" style={{ left: `${gauge}%` }} />
      </div>
      <p className="score">{score}</p>
      {feedback && <p className={`feedback ${feedback === 'JACKPOT!' ? 'jackpot' : ''}`}>{feedback}</p>}
      <button
        className="click-btn"
        onClick={e => {
          const timing = gauge >= 45 && gauge <= 55 ? 'perfect'
                       : gauge >= 35 && gauge <= 65 ? 'good'
                       : 'normal'
          const r = Math.random()
          const base = timing === 'perfect' ? (r < 0.10 ? 100 : r < 0.25 ? 20 : r < 0.55 ? 5 : 1)
                     : timing === 'good'    ? (r < 0.03 ? 100 : r < 0.12 ? 20 : r < 0.40 ? 5 : 1)
                     :                        (r < 0.01 ? 100 : r < 0.05 ? 20 : r < 0.30 ? 5 : 1)
          const isJackpot = base === 100
          setScore(s => s + base)
          if (isJackpot) setHadJackpot(true)
          const label = isJackpot ? 'JACKPOT!' : `+${base}${timing === 'perfect' ? ' PERFECT' : timing === 'good' ? ' GOOD' : ''}`
          setFeedback(label)
          clearTimeout(feedbackTimer.current)
          feedbackTimer.current = setTimeout(() => setFeedback(null), isJackpot ? 1000 : 600)
          const cls = isJackpot ? 'jackpot-pop' : 'pop'
          e.currentTarget.classList.remove('pop', 'jackpot-pop')
          void e.currentTarget.offsetWidth
          e.currentTarget.classList.add(cls)
        }}
        disabled={phase !== 'playing'}
      >Click!</button>
    </div>
  )
}

export default App
