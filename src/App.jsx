import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, MotionConfig, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Flame, Menu, Pause, Play, Volume2, VolumeX, X, Zap } from 'lucide-react'
import LeafSymbol from './components/LeafSymbol.jsx'
import Embers from './components/Embers.jsx'
import useAmbientAudio from './hooks/useAmbientAudio.js'
import { chapters, forms, techniques } from './data.js'

function navigateTabs(event, index, count, select) {
  let next
  if (event.key === 'ArrowRight') next = (index + 1) % count
  if (event.key === 'ArrowLeft') next = (index - 1 + count) % count
  if (event.key === 'Home') next = 0
  if (event.key === 'End') next = count - 1
  if (next === undefined) return
  event.preventDefault()
  select(next)
  event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus()
}

function Reveal({ children, className = '', still, delay = 0 }) {
  return <motion.div className={className} initial={still ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: still ? 0 : 0.7, delay }}>{children}</motion.div>
}

function App() {
  const prefersReducedMotion = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const still = paused || prefersReducedMotion
  const [form, setForm] = useState(0)
  const [chapter, setChapter] = useState(0)
  const [technique, setTechnique] = useState(0)
  const [phase, setPhase] = useState('idle')
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const { enabled: audioEnabled, unavailable: audioUnavailable, toggle: toggleAudio } = useAmbientAudio()
  const creditsRef = useRef(null)
  const timers = useRef([])
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const artX = useSpring(x, { stiffness: 80, damping: 28 })
  const artY = useSpring(y, { stiffness: 80, damping: 28 })
  const currentForm = forms[form]
  const currentChapter = chapters[chapter]
  const currentTechnique = techniques[technique]

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id) })
    }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 })
    document.querySelectorAll('main > section[id]').forEach(section => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    if (!menuOpen) return
    const closeOnEscape = event => { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  function moveArtwork(event) {
    if (still || event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    x.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 22)
    y.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 15)
  }

  function selectTechnique(index) {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPhase('idle')
    setTechnique(index)
  }

  function activateTechnique() {
    if (phase === 'charging') return
    timers.current.forEach(clearTimeout)
    setPhase('charging')
    timers.current = [setTimeout(() => setPhase('released'), still ? 100 : 1600)]
  }

  const transition = { duration: still ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }

  return (
    <MotionConfig reducedMotion={still ? 'always' : 'never'}>
      <div className={`app ${still ? 'motion-paused' : ''}`} style={{ '--accent': currentForm.color }}>
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="site-header">
          <a className="brand" href="#home" aria-label="Uzumaki archive home" onClick={() => setMenuOpen(false)}>
            <LeafSymbol /><span>UZUMAKI<span className="brand-subtitle">THE SHINOBI ARCHIVE</span></span>
          </a>
          <nav id="main-nav" className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
            {[['story', 'The story'], ['arsenal', 'The arsenal'], ['ninja-way', 'The ninja way']].map(([id, label]) => (
              <a href={`#${id}`} key={id} className={activeSection === id ? 'active' : ''} aria-current={activeSection === id ? 'location' : undefined} onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
          </nav>
          <div className="header-controls">
            <button className="sound-button" onClick={toggleAudio} disabled={audioUnavailable} aria-pressed={audioEnabled} aria-label={audioUnavailable ? 'Ambient sound unavailable' : `${audioEnabled ? 'Mute' : 'Enable'} ambient sound`}>
              {audioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}<span>SOUND {audioEnabled ? 'ON' : 'OFF'}</span>
            </button>
            <button className="icon-button motion-toggle" onClick={() => setPaused(!paused)} aria-pressed={Boolean(still)} aria-label={still ? 'Enable animations' : 'Pause animations'} disabled={Boolean(prefersReducedMotion)} title={prefersReducedMotion ? 'Reduced motion follows your system preference' : 'Toggle animations'}>{still ? <Play size={14} /> : <Pause size={14} />}</button>
            <button className="icon-button menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </header>

        <main id="main">
          <section id="home" className={`hero hero--${currentForm.className}`} aria-label="Naruto Uzumaki" onPointerMove={moveArtwork} onPointerLeave={() => { x.set(0); y.set(0) }}>
            <div className="hero-grid" aria-hidden="true" />
            <div className="hero-glow" aria-hidden="true" />
            <div className="hero-watermark" aria-hidden="true">NARUTO</div>
            <div className="hero-art" aria-hidden="true">
              <div className="sun-disc"><div className="sun-orbit" /><span className="sun-kanji">忍</span></div>
              <motion.div className="character-parallax" style={{ x: still ? 0 : artX, y: still ? 0 : artY }}>
                <AnimatePresence mode="sync">
                  <motion.img className={`hero-character character--${currentForm.className}`} key={currentForm.name} src={currentForm.image} alt="" width="1400" height="1500" fetchPriority="high" initial={{ opacity: 0, x: still ? 0 : 45, filter: still ? 'none' : 'blur(6px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: still ? 0 : -30 }} transition={transition} />
                </AnimatePresence>
              </motion.div>
              <span className="vertical-japanese" lang="ja">うずまきナルト</span>
              <div className="art-coordinate">LAND OF FIRE · SHINOBI ARCHIVE<br /><span>HIDDEN LEAF VILLAGE</span></div>
            </div>
            <Embers paused={still} />
            <div className="hero-content">
              <motion.p className="eyebrow hero-eyebrow" initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.7 }}><span className="live-dot" /> A LEGEND ISN’T BORN. IT’S MADE.</motion.p>
              <motion.h1 initial={still ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.2 }}><span>NARUTO</span><span className="outline-text">UZUMAKI<span className="title-period">.</span></span></motion.h1>
              <motion.div initial={still ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.35 }}>
                <div className="hero-caption"><span className="short-line" /><p>THE WILL OF FIRE</p><span lang="ja">火の意志</span></div>
                <p className="hero-description">An outcast. A dreamer. A little too loud.<br />The shinobi who turned “never” into his ninja way.</p>
                <div className="hero-actions">
                  <a className="button button-primary" href="#story">Discover his story <ArrowUpRight size={18} /></a>
                  <a className="text-link" href="#arsenal"><span className="small-play"><Play size={11} fill="currentColor" /></span>Feel the chakra</a>
                </div>
                <div className="hero-dossier"><LeafSymbol /><span>KONOHAGAKURE<span>HIDDEN LEAF · LAND OF FIRE</span></span><span className="dossier-divider" /><span>NO. 012607<span>SHINOBI REGISTRATION</span></span></div>
              </motion.div>
            </div>
            <div className="hero-bottom">
              <a href="#story" className="scroll-cue"><span className="scroll-line" /><span>SCROLL TO BEGIN</span><ArrowDown size={13} /></a>
              <div className="form-picker">
                <div className="form-caption" id="form-panel" role="tabpanel" aria-labelledby={`form-${form}`}><span className="form-caption-line" /><span aria-live="polite">{currentForm.label}</span><span>{currentForm.number} / 03</span></div>
                <div className="form-tabs" role="tablist" aria-label="Naruto transformation">
                  {forms.map((item, index) => <button key={item.name} role="tab" id={`form-${index}`} aria-selected={form === index} aria-controls="form-panel" tabIndex={form === index ? 0 : -1} onClick={() => setForm(index)} onKeyDown={event => navigateTabs(event, index, forms.length, setForm)}><span lang="ja">{item.japanese}</span>{item.name}{form === index && <motion.span layoutId="form-indicator" className="form-indicator" transition={transition} />}</button>)}
                </div>
              </div>
              <span className="hero-edition">CHARACTER ARCHIVE<span>VOL. 01 — UZUMAKI</span></span>
            </div>
          </section>

          <div className="manifesto-strip" aria-label="Never give up. Never go back. That is my ninja way.">
            <span>NEVER GIVE UP.</span><span className="strip-star" aria-hidden="true">✳</span><span>NEVER GO BACK.</span><span className="strip-star" aria-hidden="true">✳</span><span>THAT’S MY NINJA WAY.</span><LeafSymbol />
          </div>

          <section id="story" className="story-section section-shell" aria-labelledby="story-heading">
            <Reveal still={still} className="section-heading"><p className="eyebrow"><span className="section-number">01 /</span> THE STORY</p><span className="section-aside">EVERY LEGEND STARTS SOMEWHERE.</span></Reveal>
            <div className="story-layout">
              <Reveal still={still} className="story-copy">
                <h2 id="story-heading">FROM THE OUTSIDE.<br />TO <span>THE VERY TOP.</span></h2>
                <div className="chapter-tabs" role="tablist" aria-label="Chapters of Naruto’s story">
                  {chapters.map((item, index) => <button key={item.number} id={`chapter-${index}`} role="tab" aria-selected={chapter === index} aria-controls="chapter-panel" tabIndex={chapter === index ? 0 : -1} onClick={() => setChapter(index)} onKeyDown={event => navigateTabs(event, index, chapters.length, setChapter)}><span>{item.number}</span>{item.era}</button>)}
                </div>
                <div id="chapter-panel" role="tabpanel" aria-labelledby={`chapter-${chapter}`} tabIndex={0}>
                  <AnimatePresence mode="wait"><motion.div key={chapter} initial={{ opacity: 0, y: still ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: still ? 0 : 0.2 }}><h3>{currentChapter.title}</h3><p className="body-copy">{currentChapter.description}</p><p className="chapter-tag"><span />{currentChapter.tag}</p></motion.div></AnimatePresence>
                </div>
              </Reveal>
              <Reveal still={still} className="story-art-card" delay={0.1}>
                <div className="card-topline"><span>THE MAKING OF A HOKAGE</span><ArrowUpRight size={16} /></div>
                <span className="story-kanji" aria-hidden="true" lang="ja">{currentChapter.japanese}</span>
                <div className="story-art-stage"><AnimatePresence mode="sync"><motion.img key={chapter} src={currentChapter.image} alt={currentChapter.alt} loading="lazy" width="700" height="1100" initial={{ opacity: 0, x: still ? 0 : 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: still ? 0 : -25 }} transition={transition} /></AnimatePresence></div>
                <span className="story-image-label">UZUMAKI<br /><b>NARUTO</b></span>
                <div className="story-card-bottom"><span><b>{currentChapter.number}</b> / 03</span><div><button className="icon-button" aria-label="Previous story chapter" onClick={() => setChapter((chapter + 2) % 3)}><ChevronLeft size={17} /></button><button className="icon-button" aria-label="Next story chapter" onClick={() => setChapter((chapter + 1) % 3)}><ChevronRight size={17} /></button></div></div>
              </Reveal>
            </div>
          </section>

          <section id="arsenal" className="arsenal-section section-shell" aria-labelledby="arsenal-heading">
            <Reveal still={still} className="section-heading"><p className="eyebrow"><span className="section-number">02 /</span> THE ARSENAL</p><span className="section-aside">A LITTLE CHAKRA. LIMITLESS POSSIBILITIES.</span></Reveal>
            <div className="arsenal-layout">
              <Reveal still={still} className={`chakra-stage effect--${currentTechnique.effect} phase--${phase}`}>
                <div className="chakra-grid" aria-hidden="true" />
                <span className="chakra-coordinate coordinate-top">CHAKRA VISUALIZATION / {String(technique + 1).padStart(2, '0')}</span>
                <div className="chakra-outer-ring" aria-hidden="true"><span /><span /><span /><span /></div>
                <div className="chakra-system" aria-hidden="true">
                  <div className="chakra-aura" /><div className="chakra-orbit orbit-one" /><div className="chakra-orbit orbit-two" /><div className="chakra-orbit orbit-three" />
                  <div className="chakra-satellite satellite-one" /><div className="chakra-satellite satellite-two" />
                  <div className="chakra-core"><div className="core-swirl" /><span className="core-center" /></div><div className="release-ring" />
                </div>
                <span className="chakra-japanese" lang="ja">{currentTechnique.japanese}</span>
                <div className="chakra-stage-bottom"><span><span className="live-dot" />{phase === 'charging' ? 'GATHERING CHAKRA' : phase === 'released' ? 'TECHNIQUE ACTIVATED' : 'CHAKRA READY'}</span><span>{phase === 'charging' ? '充填' : '準備'}</span></div>
              </Reveal>
              <Reveal still={still} className="arsenal-copy" delay={0.1}>
                <h2 id="arsenal-heading">NOT JUST POWER.<br /><span>PURE WILL.</span></h2>
                <div className="technique-tabs" role="tablist" aria-label="Ninja techniques">{techniques.map((item, index) => <button key={item.name} role="tab" id={`technique-${index}`} aria-selected={technique === index} aria-controls="technique-panel" tabIndex={technique === index ? 0 : -1} onClick={() => selectTechnique(index)} onKeyDown={event => navigateTabs(event, index, techniques.length, selectTechnique)}>{item.name}</button>)}</div>
                <div id="technique-panel" role="tabpanel" aria-labelledby={`technique-${technique}`} tabIndex={0}>
                  <span className="technique-classification">{currentTechnique.classification}</span>
                  <h3>{currentTechnique.name}<span lang="ja">{currentTechnique.japanese}</span></h3>
                  <p className="body-copy">{currentTechnique.description}</p>
                  <button className={`button chakra-button ${phase === 'charging' ? 'is-charging' : ''}`} onClick={activateTechnique} disabled={phase === 'charging'}>{phase === 'released' ? <Check size={17} /> : <Zap size={17} />}<span>{phase === 'charging' ? 'Channeling chakra…' : phase === 'released' ? 'Try it again' : currentTechnique.action}</span><ArrowUpRight size={17} /></button>
                  <p className="interaction-hint" aria-live="polite">{phase === 'released' ? currentTechnique.message : phase === 'charging' ? 'Focus. You’ve got this.' : 'Go on. There’s a shinobi in you, too.'}</p>
                </div>
              </Reveal>
            </div>
          </section>

          <section id="ninja-way" className="ninja-way-section section-shell" aria-labelledby="way-heading">
            <Reveal still={still}>
              <div className="quote-mark"><Flame size={25} strokeWidth={1.4} /></div>
              <p className="eyebrow">03 / THE NINJA WAY</p>
              <h2 id="way-heading">A BIG DREAM.<br />AN <span>UNBREAKABLE</span> SPIRIT.</h2>
              <p>It was never about being the strongest.<br />It was about never giving up on the people who matter.</p>
              <a href="#home" className="back-to-top">CARRY THE FIRE <ArrowUpRight size={15} /></a>
            </Reveal>
            <span className="quote-watermark" aria-hidden="true" lang="ja">忍道</span>
          </section>
        </main>

        <footer className="site-footer"><a href="#home" className="footer-brand"><LeafSymbol /><span>THE WILL OF FIRE.</span></a><p>A fan-made tribute. Built with a little chakra.</p><button className="credits-link" onClick={() => creditsRef.current.showModal()}>ARTWORK & CREDITS <ArrowUpRight size={12} /></button><span className="footer-japanese" lang="ja">だってばよ!</span></footer>

        <dialog ref={creditsRef} className="credits-dialog" aria-labelledby="credits-heading" onClick={event => { if (event.target === event.currentTarget) creditsRef.current.close() }}>
          <div className="credits-content"><button className="icon-button close-dialog" aria-label="Close credits" onClick={() => creditsRef.current.close()}><X size={22} /></button><LeafSymbol /><p className="eyebrow">MADE BY A FAN, FOR THE FANS.</p><h2 id="credits-heading">Behind the archive.</h2><p>This is an unofficial, non-commercial design tribute. Naruto and its characters belong to Masashi Kishimoto and their respective rights holders. This site is not affiliated with or endorsed by them.</p><h3>Character artwork</h3><p>Transparent character illustrations sourced from <a href="https://pngimg.com/images/fantasy/naruto" target="_blank" rel="noreferrer">PNGimg’s Naruto collection <ArrowUpRight size={12} /></a>, optimized and served locally.</p><ul><li><a href="https://pngimg.com/image/109324" target="_blank" rel="noreferrer">Shinobi artwork</a></li><li><a href="https://pngimg.com/image/109347" target="_blank" rel="noreferrer">Sage Mode artwork</a></li><li><a href="https://pngimg.com/image/109336" target="_blank" rel="noreferrer">Kurama Mode artwork</a></li><li><a href="https://pngimg.com/image/109345" target="_blank" rel="noreferrer">Young Naruto artwork</a></li><li><a href="https://pngimg.com/image/109320" target="_blank" rel="noreferrer">Hokage artwork</a></li></ul><p className="credits-note">Source availability does not establish a reuse license. Obtain the appropriate permissions before commercial use or redistribution.</p><h3>Everything else</h3><p>Original CSS chakra effects and synthesized ambience. Barlow Condensed & DM Sans fonts (SIL Open Font License). Lucide icons (ISC license).</p><a className="text-link" href="https://naruto-official.com/en" target="_blank" rel="noreferrer">Visit the official Naruto website <ArrowRight size={15} /></a></div>
        </dialog>
      </div>
    </MotionConfig>
  )
}

export default App