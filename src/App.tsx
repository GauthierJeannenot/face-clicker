import { useState, useCallback, useRef } from 'react'

const SOUNDS = ['Aïe !', 'Ouille !', 'Oulà !']

// Animation timing
const FALL_DURATION = 160  // ms jusqu'à l'impact
const TOTAL_DURATION = 480 // ms animation complète

// Keyframes injectés une seule fois
const sheet = new CSSStyleSheet()
sheet.replaceSync(`
  @keyframes slapFall {
    0%   { transform: translateX(-50%) rotate(180deg) translateY(0px);   }
    100% { transform: translateX(-50%) rotate(180deg) translateY(700px);  }
  }
  @keyframes slapReturn {
    0%   { transform: translateX(-50%) rotate(180deg) translateY(700px);  }
    100% { transform: translateX(-50%) rotate(180deg) translateY(0px);    }
  }
  @keyframes faceHit {
    0%   { transform: scale(1)    translateX(0);   }
    25%  { transform: scale(0.93, 1.07) translateX(8px);  }
    55%  { transform: scale(1.03, 0.96) translateX(-4px); }
    100% { transform: scale(1)    translateX(0);   }
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

type Phase = 'idle' | 'falling' | 'returning'

export default function App() {
  const [phase, setPhase]   = useState<Phase>('idle')
  const [label, setLabel]   = useState<string | null>(null)
  const [faceHit, setFaceHit] = useState(false)
  const busy = useRef(false)

  const handleClick = useCallback(() => {
    if (busy.current) return
    busy.current = true
    setPhase('falling')

    // Impact
    setTimeout(() => {
      const sound = SOUNDS[Math.floor(Math.random() * SOUNDS.length)]
      speak(sound)
      setLabel(sound)
      setFaceHit(true)
      setPhase('returning')
      setTimeout(() => setFaceHit(false), 400)
      setTimeout(() => setLabel(null), 1200)
    }, FALL_DURATION)

    // Fin
    setTimeout(() => {
      setPhase('idle')
      busy.current = false
    }, TOTAL_DURATION)
  }, [])

  const handStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-110px',
    left: '50%',
    fontSize: '90px',
    lineHeight: 1,
    pointerEvents: 'none',
    userSelect: 'none',
    transform: 'translateX(-50%) rotate(180deg)',
    animation:
      phase === 'falling'   ? `slapFall ${FALL_DURATION}ms cubic-bezier(0.4,0,1,1) forwards` :
      phase === 'returning' ? `slapReturn ${TOTAL_DURATION - FALL_DURATION}ms ease-out forwards` :
      'none',
    opacity: phase === 'idle' ? 0 : 1,
  }

  const faceStyle: React.CSSProperties = {
    ...styles.imageWrapper,
    animation: faceHit ? `faceHit 400ms ease-out` : 'none',
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.slapZone} onClick={handleClick}>
          <div style={handStyle}>🖐️</div>
          <div style={faceStyle}>
            <img
              src={`${import.meta.env.BASE_URL}face.webp`}
              alt="Visage"
              style={styles.image}
              draggable={false}
            />
            {label && <div style={styles.bubble}>{label}</div>}
          </div>
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
  slapZone: {
    position: 'relative',
    paddingTop: '120px',
    cursor: "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><text y='36' font-size='36'>🖐️</text></svg>\") 20 20, pointer",
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
