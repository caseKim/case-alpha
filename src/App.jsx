import { useState, useEffect, useRef } from 'react'
import './App.css'

const calcMultiplier = c => 1 + Math.floor(c / 3) * 0.5
const getZone = g =>
  g >= 45 && g <= 55 ? 'perfect' :
  g >= 38 && g <= 62 ? 'great' :
  g >= 27 && g <= 73 ? 'good' :
  g >= 18 && g <= 82 ? 'ok' : 'miss'

function App() {
  const [phase, setPhase] = useState('start') // 'start' | 'playing' | 'result'
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(10)
  const [feedback, setFeedback] = useState(null)
  const [hadJackpot, setHadJackpot] = useState(false)
  const [perfectCount, setPerfectCount] = useState(0)
  const [nearMissCount, setNearMissCount] = useState(0)
  const [gauge, setGauge] = useState(0)
  const [combo, setCombo] = useState(0)
  const [clickMark, setClickMark] = useState(null)
  const [onCooldown, setOnCooldown] = useState(false)
  const [remainingClicks, setRemainingClicks] = useState(15)
  const direction = useRef(1)
  const timeRef = useRef(10)
  const feedbackTimer = useRef(null)
  const cooldownTimer = useRef(null)
  const clickMarkId = useRef(0)

  function startGame() {
    setScore(0)
    setTime(15)
    timeRef.current = 15
    setHadJackpot(false)
    setPerfectCount(0)
    setNearMissCount(0)
    setCombo(0)
    setOnCooldown(false)
    setRemainingClicks(15)
    clearTimeout(cooldownTimer.current)
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
        const speed = 1 + (15 - timeRef.current) * 0.12
        const next = g + direction.current * speed
        if (next >= 100 || next <= 0) direction.current *= -1
        return Math.min(100, Math.max(0, next))
      })
    }, 16)
    return () => clearInterval(interval)
  }, [phase])

  useEffect(() => { timeRef.current = time }, [time])
  useEffect(() => () => { clearTimeout(feedbackTimer.current); clearTimeout(cooldownTimer.current) }, [])

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
    const message = perfectCount >= 5 ? '타이밍 고수 🔥' : perfectCount === 0 ? '조금 더 맞춰보자' : nearMissCount >= 5 ? '조금만 더 맞췄으면 대박인데!' : score >= 100 ? '오늘 미쳤다 🔥' : score >= 50 ? '오… 운 좋은데요?' : '괜찮은데요?'
    return (
      <div className="game">
        <h1>Time's up!</h1>
        <p className="final-score">{score}</p>
        {hadJackpot && <p className="jackpot-banner">JACKPOT 터졌다!! 🎉</p>}
        <p className="final-perfect">PERFECT {perfectCount}회</p>
        <p className="final-message">{message}</p>
        <button className="retry-btn" onClick={startGame}>Play Again</button>
      </div>
    )
  }

  const indicatorZone = getZone(gauge)

  return (
    <div className="game">
      <p className="timer">{time}s</p>
      <div className="gauge-track">
        <div className="gauge-zone-ok-left" />
        <div className="gauge-zone-ok-right" />
        <div className="gauge-zone-good-left" />
        <div className="gauge-zone-good-right" />
        <div className="gauge-zone-great-left" />
        <div className="gauge-zone-great-right" />
        <div className="gauge-zone-perfect" />
        {clickMark && <div key={clickMark.id} className="gauge-click-mark" style={{ left: `${clickMark.pos}%` }} />}
        <div
          className={`gauge-indicator${indicatorZone !== 'miss' ? ` in-${indicatorZone}` : ''}`}
          style={{ left: `${gauge}%` }}
        />
      </div>
      <p className="score">{score}</p>
      <p className={`remaining${remainingClicks <= 3 ? ' danger' : ''}`}>남은 기회: {remainingClicks}</p>
      <div className="float-area">
        {combo >= 3 && <p className="combo">COMBO x{calcMultiplier(combo).toFixed(1)}</p>}
        {feedback && <p className={`feedback ${feedback.isJackpot ? 'jackpot' : feedback.timing === 'perfect' ? 'perfect' : ''}`}>{feedback.text}</p>}
      </div>
      <button
        className={`click-btn${onCooldown ? ' cooldown' : ''}`}
        onClick={e => {
          if (onCooldown) return
          setClickMark({ pos: gauge, id: ++clickMarkId.current })
          const left = remainingClicks - 1
          setRemainingClicks(left)
          const timing = getZone(gauge)
          const newCombo = timing === 'miss' ? 0 : combo + 1
          setCombo(newCombo)
          const multiplier = calcMultiplier(newCombo)
          const r = Math.random()
          const base = timing === 'perfect' ? (r < 0.35 ? 100 : r < 0.65 ? 20 : r < 0.90 ? 5 : 1)
                     : timing === 'great'   ? (r < 0.15 ? 100 : r < 0.45 ? 20 : r < 0.80 ? 5 : 1)
                     : timing === 'good'    ? (r < 0.05 ? 100 : r < 0.20 ? 20 : r < 0.55 ? 5 : 1)
                     : timing === 'ok'      ? (r < 0.01 ? 20  : r < 0.40 ? 5  : 1)
                     :                        -1
          const points = base < 0 ? base : Math.round(base * multiplier)
          const isJackpot = base === 100
          setScore(s => s + points)
          if (isJackpot) setHadJackpot(true)
          if (timing === 'perfect') setPerfectCount(c => c + 1)
          const nearMiss = timing === 'great' && ((gauge >= 38 && gauge <= 44) || (gauge >= 56 && gauge <= 62))
          if (nearMiss) setNearMissCount(c => c + 1)
          if (left === 0) { setPhase('result'); return }
          const comboTag = newCombo >= 3 ? ` x${multiplier.toFixed(1)}` : ''
          const label = isJackpot            ? `JACKPOT! +${points}`
                     : timing === 'perfect'  ? `🔥 PERFECT! +${points}${comboTag}`
                     : nearMiss              ? `거의 맞았는데!! 😭 +${points}`
                     : timing === 'great'    ? `⚡ GREAT! +${points}${comboTag}`
                     : timing === 'good'     ? `👍 GOOD +${points}${comboTag}`
                     : timing === 'ok'       ? `👌 OK +${points}`
                     :                         `😅 ${points}`
          setFeedback({ text: label, timing, isJackpot })
          clearTimeout(feedbackTimer.current)
          feedbackTimer.current = setTimeout(() => setFeedback(null), isJackpot || timing === 'perfect' ? 1000 : 600)
          const cls = isJackpot ? 'jackpot-pop' : timing === 'perfect' ? 'perfect-pop' : 'pop'
          e.currentTarget.classList.remove('pop', 'perfect-pop', 'jackpot-pop')
          void e.currentTarget.offsetWidth
          e.currentTarget.classList.add(cls)
          setOnCooldown(true)
          cooldownTimer.current = setTimeout(() => setOnCooldown(false), 300)
        }}
        disabled={phase !== 'playing' || onCooldown}
      >Click!</button>
    </div>
  )
}

export default App
