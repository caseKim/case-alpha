import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [phase, setPhase] = useState('start') // 'start' | 'playing' | 'result'
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(10)
  const [feedback, setFeedback] = useState(null)
  const [hadJackpot, setHadJackpot] = useState(false)
  const [perfectCount, setPerfectCount] = useState(0)
  const [gauge, setGauge] = useState(0)
  const direction = useRef(1)
  const feedbackTimer = useRef(null)

  function startGame() {
    setScore(0)
    setTime(10)
    setHadJackpot(false)
    setPerfectCount(0)
    direction.current = 1
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
      setGauge(g => {
        const next = g + direction.current
        if (next >= 100 || next <= 0) direction.current *= -1
        return Math.min(100, Math.max(0, next))
      })
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
    const timingMessage = perfectCount >= 5 ? '타이밍 감각 좋다 🔥' : perfectCount === 0 ? '조금만 더 맞춰보자' : null
    const message = timingMessage ?? (score >= 100 ? '오늘 미쳤다 🔥' : score >= 50 ? '오… 운 좋은데요?' : score >= 20 ? '괜찮은데요?' : '오늘 운이 별로네요 😅')
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
      {feedback && <p className={`feedback ${feedback.text === 'JACKPOT!' ? 'jackpot' : feedback.timing === 'perfect' ? 'perfect' : ''}`}>{feedback.text}</p>}
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
          if (timing === 'perfect') setPerfectCount(c => c + 1)
          const label = isJackpot ? 'JACKPOT!' : `+${base}${timing === 'perfect' ? ' PERFECT' : timing === 'good' ? ' GOOD' : ''}`
          setFeedback({ text: label, timing })
          clearTimeout(feedbackTimer.current)
          feedbackTimer.current = setTimeout(() => setFeedback(null), isJackpot || timing === 'perfect' ? 1000 : 600)
          const cls = isJackpot ? 'jackpot-pop' : timing === 'perfect' ? 'perfect-pop' : 'pop'
          e.currentTarget.classList.remove('pop', 'perfect-pop', 'jackpot-pop')
          void e.currentTarget.offsetWidth
          e.currentTarget.classList.add(cls)
        }}
        disabled={phase !== 'playing'}
      >Click!</button>
    </div>
  )
}

export default App
