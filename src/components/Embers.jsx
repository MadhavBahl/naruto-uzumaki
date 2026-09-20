import { useEffect, useRef } from 'react'

export default function Embers({ paused }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (paused) return
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return
    let width = 0
    let height = 0
    let frame
    let lastTime = 0
    let visible = true
    const particles = Array.from({ length: 34 }, () => ({
      x: Math.random(), y: Math.random(), size: 0.5 + Math.random() * 1.6,
      speed: 0.015 + Math.random() * 0.035, phase: Math.random() * Math.PI * 2,
    }))
    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = width * dpr
      canvas.height = height * dpr
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const draw = time => {
      const delta = Math.min((time - lastTime) / 1000, 0.05)
      lastTime = time
      context.clearRect(0, 0, width, height)
      particles.forEach(particle => {
        particle.y -= particle.speed * delta
        if (particle.y < -0.02) particle.y = 1.02
        const x = particle.x * width + Math.sin(time / 3500 + particle.phase) * 30
        context.beginPath()
        context.fillStyle = `rgba(255, 157, 78, ${0.2 + Math.sin(particle.y * Math.PI) * 0.45})`
        context.arc(x, particle.y * height, particle.size, 0, Math.PI * 2)
        context.fill()
      })
      frame = requestAnimationFrame(draw)
    }
    const updateVisibility = () => {
      cancelAnimationFrame(frame)
      if (visible && !document.hidden) frame = requestAnimationFrame(draw)
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      updateVisibility()
    })
    observer.observe(canvas)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    document.addEventListener('visibilitychange', updateVisibility)
    resize()
    return () => {
      cancelAnimationFrame(frame)
      context.clearRect(0, 0, width, height)
      observer.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [paused])

  return <canvas className="embers" ref={canvasRef} aria-hidden="true" />
}