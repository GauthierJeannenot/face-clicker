import { useState, useCallback } from 'react'

const SOUNDS = ['Aïe !', 'Ouille !', 'Oulà !']

let cachedVoice: SpeechSynthesisVoice | null = null

function loadVoice() {
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return
  // Voix masculines françaises connues sur Windows/macOS
  const maleFrench =
    voices.find(v => v.lang.startsWith('fr') && /paul|thomas|nicolas|reed|malo/i.test(v.name)) ??
    voices.find(v => v.lang.startsWith('fr') && !/hortense|amelie|audrey|aurelie|fiona/i.test(v.name)) ??
    voices.find(v => v.lang.startsWith('fr'))
  cachedVoice = maleFrench ?? null
}

window.speechSynthesis.addEventListener('voiceschanged', loadVoice)
loadVoice()

function speak(text: string) {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'fr-FR'
  utterance.rate = 0.82
  utterance.pitch = 0.55
  utterance.volume = 1
  if (cachedVoice) utterance.voice = cachedVoice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export default function App() {
  const [label, setLabel] = useState<string | null>(null)
  const [shaking, setShaking] = useState(false)

  const handleClick = useCallback(() => {
    const sound = SOUNDS[Math.floor(Math.random() * SOUNDS.length)]
    speak(sound)
    setLabel(sound)
    setShaking(true)
    setTimeout(() => setShaking(false), 400)
    setTimeout(() => setLabel(null), 1200)
  }, [])

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div
          style={{
            ...styles.imageWrapper,
            ...(shaking ? styles.shake : {}),
          }}
          onClick={handleClick}
        >
          <img
            src="/face.webp"
            alt="Visage"
            style={styles.image}
            draggable={false}
          />
          {label && <div style={styles.bubble}>{label}</div>}
        </div>
        <p style={styles.hint}>Clique sur le visage !</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0e9e0',
    fontFamily: 'sans-serif',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  imageWrapper: {
    position: 'relative',
    cursor: "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><text y='36' font-size='36'>🖐️</text></svg>\") 20 20, pointer",
    borderRadius: '50%',
    overflow: 'hidden',
    width: '320px',
    height: '320px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    transition: 'transform 0.1s',
    userSelect: 'none',
  },
  shake: {
    animation: 'none',
    transform: 'scale(0.96)',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center top',
    pointerEvents: 'none',
  },
  bubble: {
    position: 'absolute',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    color: '#c0392b',
    fontWeight: 'bold',
    fontSize: '1.6rem',
    padding: '6px 18px',
    borderRadius: '999px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },
  hint: {
    color: '#888',
    fontSize: '0.95rem',
    margin: 0,
  },
}
