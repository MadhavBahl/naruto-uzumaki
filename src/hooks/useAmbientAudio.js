import { useCallback, useEffect, useRef, useState } from 'react'

// Original synthesized ambience. No external audio, autoplay, or copyrighted music.
export default function useAmbientAudio() {
  const audio = useRef(null)
  const [enabled, setEnabled] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  const toggle = useCallback(async () => {
    try {
      if (audio.current) {
        await audio.current.close()
        audio.current = null
        setEnabled(false)
        return
      }
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) throw new Error('Audio not supported')
      const context = new AudioContext()
      audio.current = context
      const gain = context.createGain()
      gain.gain.setValueAtTime(0, context.currentTime)
      gain.gain.linearRampToValueAtTime(0.025, context.currentTime + 2)
      gain.connect(context.destination)
      ;[110, 164.81, 220.35].forEach(frequency => {
        const oscillator = context.createOscillator()
        oscillator.type = 'sine'
        oscillator.frequency.value = frequency
        oscillator.connect(gain)
        oscillator.start()
      })
      await context.resume()
      setEnabled(true)
    } catch {
      if (audio.current) await audio.current.close().catch(() => {})
      audio.current = null
      setEnabled(false)
      setUnavailable(true)
    }
  }, [])

  useEffect(() => {
    const onVisibility = () => {
      const context = audio.current
      if (!context || context.state === 'closed') return
      const operation = document.hidden ? context.suspend() : context.resume()
      operation.catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (audio.current) audio.current.close().catch(() => {})
    }
  }, [])

  return { enabled, unavailable, toggle }
}