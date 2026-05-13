import { useState, useCallback, useRef } from 'react'

const SOUNDS = ['Aïe !', 'Ouille !', 'Oulà !']

let cachedVoice: SpeechSynthesisVoice | null = null

// Voix féminines à exclure (Windows, macOS, iOS, Android)
const FEMALE_NAMES = /hortense|amelie|amé|audrey|aurelie|aurélie|fiona|alice|marie|julie|claire|léa|lea|samantha|karen|victoria|moira|tessa|veena/i

// Voix masculines prioritaires (Windows, macOS, iOS, Android)
const MALE_NAMES = /paul|thomas|nicolas|reed|malo|damien|pierre|martin|google français|fr.*male/i

function pickMaleVoice(voices: SpeechSynthesisVoice[]) {
  const fr = voices.filter(v => v.lang.startsWith('fr'))
  return (
    fr.find(v => MALE_NAMES.test(v.name)) ??
    fr.find(v => !FEMALE_NAMES.test(v.name)) ??
    fr[0] ??
    null
  )
}

function loadVoice() {
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return
  console.log('[voices]', voices.map(v => `${v.name} (${v.lang})`).join(', '))
  cachedVoice = pickMaleVoice(voices)
  console.log('[selected]', cachedVoice?.name ?? 'none')
}

window.speechSynthesis.addEventListener('voiceschanged', loadVoice)
loadVoice()

function speak(text: string) {
  // Sur iOS, getVoices() ne retourne rien avant la première interaction
  if (!cachedVoice) loadVoice()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'fr-FR'
  utterance.rate = 0.82
  utterance.pitch = 0.2
  utterance.volume = 1
  if (cachedVoice) utterance.voice = cachedVoice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export default function App() {
  const [label, setLabel] = useState<string | null>(null)
  const [shaking, setShaking] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = useCallback(() => {
    const sound = SOUNDS[Math.floor(Math.random() * SOUNDS.length)]
    speak(sound)
    setLabel(sound)
    setShaking(true)
    setTimeout(() => setShaking(false), 400)
    setTimeout(() => setLabel(null), 1200)
  }, [])

  const handlePressStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      loadVoice()
      const voices = window.speechSynthesis.getVoices()
      const lines = voices.map(v => `${v.name} (${v.lang})`).join('\n') || 'Aucune voix trouvée'
      setDebugInfo(`Voix dispo :\n${lines}\n\nSélectionnée :\n${cachedVoice?.name ?? 'aucune'}`)
    }, 800)
  }, [])

  const handlePressEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
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
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
        >
          <img
            src={`${import.meta.env.BASE_URL}face.webp`}
            alt="Visage"
            style={styles.image}
            draggable={false}
          />
          {label && <div style={styles.bubble}>{label}</div>}
        </div>
        <p style={styles.hint}>Clique · Appui long = debug voix</p>
        {debugInfo && (
          <pre style={styles.debug} onClick={() => setDebugInfo(null)}>
            {debugInfo}
          </pre>
        )}
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
  debug: {
    background: '#1e1e1e',
    color: '#7fffb2',
    fontSize: '0.75rem',
    padding: '12px',
    borderRadius: '8px',
    maxWidth: '90vw',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    cursor: 'pointer',
    maxHeight: '40vh',
    overflowY: 'auto',
  },
}
