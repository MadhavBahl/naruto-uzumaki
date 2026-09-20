import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'

const fragments = Array.from({ length: 9 }, (_, index) => ({
  left: `${12 + ((index * 29) % 77)}%`,
  top: `${10 + ((index * 19) % 68)}%`,
  '--flight-delay': `${index * -1.7}s`,
  '--flight-duration': `${8 + index % 4}s`,
  '--fragment-angle': `${index * 43}deg`,
  '--fragment-size': `${6 + index % 3 * 5}px`,
}))

export default function HeroAtmosphere({ form, still }) {
  const host = useRef(null)

  useEffect(() => {
    const element = host.current
    let visible = false
    const update = () => { element.dataset.active = String(visible && !document.hidden) }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update() })
    observer.observe(element)
    document.addEventListener('visibilitychange', update)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [])

  return (
    <div className="hero-atmosphere" ref={host} aria-hidden="true">
      <div className="seal-perspective">
        <div className="seal-gimbal">
          <div className="seal-ring seal-ring--outer" />
          <div className="seal-ring seal-ring--middle" />
          <div className="seal-ring seal-ring--inner" />
          <div className="seal-glyphs">
            {['忍', '風', '火', '絆', '夢', '道'].map((glyph, index) => (
              <span key={glyph} style={{ '--glyph-index': index }} lang="ja">{glyph}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="chakra-ribbon ribbon-back" />
      <div className="chakra-ribbon ribbon-front" />
      {fragments.map((style, index) => <span key={index} className="chakra-fragment" style={style} />)}
      {!still && <motion.div key={form} className="transformation-wave"
        initial={{ opacity: 0, scale: 0.55 }}
        animate={{ opacity: [0, 0.65, 0], scale: [0.55, 0.85, 1.6] }}
        transition={{ duration: 1.35, times: [0, 0.18, 1], ease: 'easeOut' }}
      />}
    </div>
  )
}