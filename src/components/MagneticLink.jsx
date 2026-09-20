import { motion, useSpring } from 'motion/react'

export default function MagneticLink({ children, still, ...props }) {
  const x = useSpring(0, { stiffness: 210, damping: 17 })
  const y = useSpring(0, { stiffness: 210, damping: 17 })

  function move(event) {
    if (still || event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    x.set((event.clientX - rect.left - rect.width / 2) * 0.12)
    y.set((event.clientY - rect.top - rect.height / 2) * 0.2)
  }

  return <motion.a {...props} style={{ x: still ? 0 : x, y: still ? 0 : y }} onPointerMove={move}
    onPointerLeave={() => { x.set(0); y.set(0) }} onBlur={() => { x.set(0); y.set(0) }}>{children}</motion.a>
}