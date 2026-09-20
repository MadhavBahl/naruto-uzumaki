import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

function ChakraFallback() {
  return <div className="chakra-fallback" aria-hidden="true">
    <div className="chakra-outer-ring"><span /><span /><span /><span /></div>
    <div className="chakra-system">
      <div className="chakra-aura" /><div className="chakra-orbit orbit-one" /><div className="chakra-orbit orbit-two" /><div className="chakra-orbit orbit-three" />
      <div className="chakra-satellite satellite-one" /><div className="chakra-satellite satellite-two" />
      <div className="chakra-core"><div className="core-swirl" /><span className="core-center" /></div><div className="release-ring" />
    </div>
  </div>
}

export default function ChakraScene({ effect, phase, still }) {
  const hostRef = useRef(null)
  const engineRef = useRef(null)
  const settings = useRef({ effect, phase, paused: Boolean(still) })
  const [nearby, setNearby] = useState(false)
  const [renderer, setRenderer] = useState('fallback')
  // Once a scene is requested, pausing stops its loop without rebuilding GPU resources.
  const [requested, setRequested] = useState(false)

  useEffect(() => {
    settings.current = { effect, phase, paused: Boolean(still) }
    engineRef.current?.update(settings.current)
  }, [effect, phase, still])

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setNearby(entry.isIntersecting), { rootMargin: '200px' })
    observer.observe(hostRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!nearby || still || requested) return
    // Defer the GPU module until the arsenal approaches the viewport.
    let cancelled = false
    let engine
    import('../graphics/createChakraScene.js').then(({ createChakraScene }) => {
      if (cancelled) return
      engine = createChakraScene(hostRef.current, settings.current, () => setRenderer('fallback'))
      engineRef.current = engine
      setRequested(true)
      setRenderer(engine ? 'webgl' : 'fallback')
    }).catch(() => { if (!cancelled) { setRequested(true); setRenderer('fallback') } })
    return () => { cancelled = true }
  }, [nearby, still, requested])

  useEffect(() => () => {
    engineRef.current?.dispose()
    engineRef.current = null
  }, [])

  return (
    <div className="chakra-experience" data-renderer={renderer} data-paused={Boolean(still)}>
      <ChakraFallback />
      <div className="chakra-webgl" ref={hostRef} aria-hidden="true" />
      <span className="scene-hint">{renderer === 'webgl' ? still ? '3D CHAKRA · MOTION PAUSED' : 'LIVE 3D · DRAG TO ORBIT' : 'CHAKRA ENERGY FIELD'}</span>
      {renderer === 'webgl' && <div className="scene-controls" role="group" aria-label="3D chakra view">
        <button className="scene-control" aria-label="Rotate chakra left" title="Rotate left" onClick={() => engineRef.current?.rotate(-0.4)}><ChevronLeft size={13} /></button>
        <button className="scene-control" aria-label="Reset chakra view" title="Reset view" onClick={() => engineRef.current?.reset()}><RotateCcw size={11} /></button>
        <button className="scene-control" aria-label="Rotate chakra right" title="Rotate right" onClick={() => engineRef.current?.rotate(0.4)}><ChevronRight size={13} /></button>
      </div>}
    </div>
  )
}