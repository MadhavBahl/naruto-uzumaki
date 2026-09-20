import { motion, useSpring, useTransform } from 'motion/react'

export default function TiltCard({ children, still, className = '' }) {
  const x = useSpring(0, { stiffness: 170, damping: 24 })
  const y = useSpring(0, { stiffness: 170, damping: 24 })
  const glareX = useTransform(x, [-7, 7], ['10%', '90%'])
  const glareY = useTransform(y, [-7, 7], ['90%', '10%'])

  function move(event) {
    if (still || event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    x.set(((event.clientX - rect.left) / rect.width - 0.5) * 14)
    y.set(-((event.clientY - rect.top) / rect.height - 0.5) * 14)
  }

  return (
    <motion.div className={`${className} tilt-card`}
      onPointerMove={move} onPointerLeave={() => { x.set(0); y.set(0) }}
      style={{ rotateY: still ? 0 : x, rotateX: still ? 0 : y, transformPerspective: 1100, '--glare-x': glareX, '--glare-y': glareY }}
      initial={still ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: still ? 0 : 0.7 }}>
      {children}
      <span className="card-glare" aria-hidden="true" />
      <span className="card-corner corner-tl" aria-hidden="true" />
      <span className="card-corner corner-br" aria-hidden="true" />
    </motion.div>
  )
}