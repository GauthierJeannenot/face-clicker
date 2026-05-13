import { useState, useCallback, useRef, useLayoutEffect } from 'react'

const SOUNDS = ['Aïe !', 'Ouille !', 'Oulà !']

const TOTAL_DURATION = 420  // ms pour traverser toute la page
const IMPACT_AT      = 200  // ms : impact au centre (50vw)

const sheet = new CSSStyleSheet()
sheet.replaceSync(`
  @keyframes slapAcross {
    from { transform: translateX(-150px) rotate(90deg); }
    to   { transform: translateX(calc(100vw + 150px)) rotate(90deg); }
  }
  @keyframes faceHit {
    0%   { transform: scale(1) translateX(0);      }
    25%  { transform: scale(0.93, 1.07) translateX(12px); }
    60%  { transform: scale(1.03, 0.96) translateX(-5px); }
    100% { transform: scale(1) translateX(0);      }
  }
`)
document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]

let cachedVoice: SpeechSynthesisVoice | null = null

const FEMALE_NAMES = /hortense|amelie|amé|audrey|aurelie|aurélie|fiona|alice|marie|julie|claire|léa|lea|samantha|karen|victoria|moira|tessa|veena/i
const MALE_NAMES   = /paul|thomas|nicolas|reed|malo|damien|pierre|martin|google français|fr.*male/i

function pickMaleVoice(voices: SpeechSynthesisVoice[]) {
  const fr = voices.filter(v => v.lang.startsWith('fr'))
  return (
    fr.find(v => MALE_NAMES.test(v.name)) ??
    fr.find(v => !FEMALE_NAMES.test(v.name)) ??
    fr[0] ?? null
  )
}

function loadVoice() {
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return
  cachedVoice = pickMaleVoice(voices)
}

window.speechSynthesis.addEventListener('voiceschanged', loadVoice)
loadVoice()

function speak(text: string) {
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
  const [slapping, setSlapping] = useState(false)
  const [label, setLabel]       = useState<string | null>(null)
  const [faceHit, setFaceHit]   = useState(false)
  const [handTop, setHandTop]   = useState(0)
  const faceRef = useRef<HTMLDivElement>(null)
  const busy    = useRef(false)

  useLayoutEffect(() => {
    if (faceRef.current) {
      const r = faceRef.current.getBoundingClientRect()
      setHandTop(r.top + r.height / 2 - 45) // centré verticalement sur le visage
    }
  }, [])

  const handleClick = useCallback(() => {
    if (busy.current) return
    busy.current = true

    // Recalcule la position au moment du clic (scroll possible)
    if (faceRef.current) {
      const r = faceRef.current.getBoundingClientRect()
      setHandTop(r.top + r.height / 2 - 45)
    }

    setSlapping(true)

    setTimeout(() => {
      const sound = SOUNDS[Math.floor(Math.random() * SOUNDS.length)]
      speak(sound)
      setLabel(sound)
      setFaceHit(true)
      setTimeout(() => setFaceHit(false), 400)
      setTimeout(() => setLabel(null), 1200)
    }, IMPACT_AT)

    setTimeout(() => {
      setSlapping(false)
      busy.current = false
    }, TOTAL_DURATION)
  }, [])

  return (
    <div style={styles.page} onClick={handleClick}>
      <div style={styles.card}>
        <div
          ref={faceRef}
          style={{
            ...styles.imageWrapper,
            animation: faceHit ? 'faceHit 400ms ease-out' : 'none',
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}face.webp`}
            alt="Visage"
            style={styles.image}
            draggable={false}
          />
          {label && <div style={styles.bubble}>{label}</div>}
        </div>
        <p style={styles.hint}>Clique sur le visage !</p>
      </div>

      {slapping && (
        <div
          style={{
            position: 'fixed',
            top: handTop,
            left: 0,
            fontSize: '90px',
            lineHeight: 1,
            pointerEvents: 'none',
            userSelect: 'none',
            animation: `slapAcross ${TOTAL_DURATION}ms linear forwards`,
          }}
        >
          🖐️
        </div>
      )}
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
    overflow: 'hidden',
    cursor: "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><text y='36' font-size='36'>🖐️</text></svg>\") 20 20, pointer",
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: '50%',
    overflow: 'hidden',
    width: '320px',
    height: '320px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    userSelect: 'none',
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
