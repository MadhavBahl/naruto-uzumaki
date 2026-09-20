import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, Group,
  Mesh, MeshBasicMaterial, PerspectiveCamera, Points, Scene, ShaderMaterial,
  SphereGeometry, TorusGeometry, Vector2, WebGLRenderer,
} from 'three'

const TAU = Math.PI * 2
const colors = { rasengan: '#63d6ff', clones: '#86f6b6', sage: '#ffb950' }

const sphereVertex = /* glsl */ `
  uniform float uTime;
  uniform float uCharge;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPosition;
  void main() {
    vec3 p = position;
    float ripple = sin(p.y * 18.0 + uTime * 3.0) * sin(p.x * 14.0 - uTime * 2.0);
    p += normal * ripple * (0.008 + uCharge * 0.016);
    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-viewPosition.xyz);
    vPosition = p;
    gl_Position = projectionMatrix * viewPosition;
  }
`

const sphereFragment = /* glsl */ `
  uniform float uTime;
  uniform float uCharge;
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPosition;
  void main() {
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.4);
    float longitude = atan(vPosition.z, vPosition.x);
    float latitude = asin(clamp(vPosition.y / length(vPosition), -1.0, 1.0));
    float flow = longitude * 5.0 + latitude * 13.0 - uTime * (2.2 + uCharge * 3.0);
    flow += sin(latitude * 9.0 + uTime) * 1.5;
    float veins = pow(abs(sin(flow)), 18.0);
    float filaments = pow(abs(sin(longitude * 11.0 - latitude * 17.0 + uTime * 2.0)), 35.0);
    float cloud = sin(latitude * 8.0 + sin(longitude * 4.0 - uTime)) * 0.5 + 0.5;
    float light = 0.22 + cloud * 0.16 + veins * 0.68 + filaments * 0.25 + fresnel * 0.75;
    vec3 color = uColor * light + vec3(0.65, 0.86, 1.0) * pow(veins, 3.0) * 0.3;
    color += uColor * uCharge * 0.2;
    gl_FragColor = vec4(color, 0.88);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const particleVertex = /* glsl */ `
  uniform float uTime;
  uniform float uCharge;
  uniform float uBurst;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    float angle = uTime * (0.16 + aSeed * 0.28) + aSeed * 30.0;
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec3 p = position;
    p.xz = rotation * p.xz;
    p *= 1.0 - uCharge * 0.3 + uBurst * (0.5 + aSeed);
    p.y += sin(uTime + aSeed * 60.0) * 0.09;
    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp((1.1 + aSeed * 2.5) * uPixelRatio * 3.0 / -viewPosition.z, 1.0, 6.0);
    vAlpha = (0.22 + aSeed * 0.6) * (1.0 + uCharge * 0.35);
  }
`

const particleFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float distanceToCenter = length(gl_PointCoord - 0.5);
    if (distanceToCenter > 0.5) discard;
    float glow = pow(1.0 - distanceToCenter * 2.0, 1.7);
    gl_FragColor = vec4(uColor, glow * vAlpha);
  }
`

/** One renderer, no postprocessing, no frame-time React updates, and explicit GPU cleanup. */
export function createChakraScene(host, initial, onLost) {
  const canvas = document.createElement('canvas')
  // Probe before Three's constructor so unavailable WebGL is an ordinary fallback.
  let context
  try {
    context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' })
  } catch { return null }
  if (!context) return null
  let renderer
  try {
    renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true })
  } catch {
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return null
  }

  const compact = matchMedia('(pointer: coarse)').matches || innerWidth < 760
  const pixelRatio = Math.min(devicePixelRatio || 1, compact ? 1.25 : 1.5)
  renderer.setPixelRatio(pixelRatio)
  renderer.setClearColor(0x000000, 0)
  host.appendChild(canvas)
  const scene = new Scene()
  const camera = new PerspectiveCamera(42, 1, 0.1, 40)
  camera.position.z = 4.6
  const world = new Group()
  world.rotation.set(-0.12, 0.2, -0.15)
  scene.add(world)
  const color = new Color(colors[initial.effect])
  const targetColor = color.clone()
  const uniforms = {
    uTime: { value: 0 }, uCharge: { value: 0 }, uBurst: { value: 0 },
    uPixelRatio: { value: pixelRatio }, uColor: { value: color },
  }
  const coreGeometry = new SphereGeometry(0.72, compact ? 40 : 64, compact ? 24 : 40)
  const coreMaterial = new ShaderMaterial({
    uniforms, vertexShader: sphereVertex, fragmentShader: sphereFragment,
    transparent: true, depthWrite: false,
  })

  function makeOrb() {
    const group = new Group()
    const core = new Mesh(coreGeometry, coreMaterial)
    group.add(core)
    const strands = []
    for (let index = 0; index < 7; index++) {
      const material = new MeshBasicMaterial({ color, transparent: true, opacity: 0.18 + index % 3 * 0.12, blending: AdditiveBlending, depthWrite: false })
      const strand = new Mesh(new TorusGeometry(0.76 + index * 0.025, 0.004 + index % 2 * 0.003, 4, compact ? 80 : 120, TAU * 0.84), material)
      strand.rotation.set(index * 0.58, index * 0.72, index * 0.4)
      group.add(strand)
      strands.push(strand)
    }
    return { group, core, strands }
  }

  const central = makeOrb()
  world.add(central.group)
  const clones = [makeOrb(), makeOrb()]
  clones.forEach(orb => { orb.group.visible = false; world.add(orb.group) })

  // A Fresnel atmosphere provides a soft rim without an expensive bloom pass.
  const atmosphere = new Mesh(new SphereGeometry(0.84, 32, 24), new ShaderMaterial({
    uniforms, vertexShader: sphereVertex,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 3.0);
        gl_FragColor = vec4(uColor, rim * 0.25);
      }
    `,
    transparent: true, blending: AdditiveBlending, depthWrite: false,
  }))
  central.group.add(atmosphere)

  const orbits = new Group()
  const orbitMaterials = []
  for (let index = 0; index < 3; index++) {
    const material = new MeshBasicMaterial({ color, transparent: true, opacity: index === 0 ? 0.26 : 0.13, blending: AdditiveBlending, depthWrite: false })
    const ring = new Mesh(new TorusGeometry(1.23 + index * 0.16, 0.006, 4, 160, TAU * (index ? 0.88 : 1)), material)
    ring.rotation.set(index * 0.9 + 0.65, index * 0.6, index * 1.4)
    orbits.add(ring)
    orbitMaterials.push(material)
  }
  world.add(orbits)

  const particleCount = compact ? 420 : 900
  const positions = new Float32Array(particleCount * 3)
  const seeds = new Float32Array(particleCount)
  for (let index = 0; index < particleCount; index++) {
    // Deterministic golden-angle distribution: no per-frame buffer allocations.
    const seed = ((index * 73 + 19) % 997) / 997
    const angle = index * 2.399963
    const latitude = Math.acos(1 - 2 * (index + 0.5) / particleCount)
    const radius = 1.0 + seed * 1.28
    positions[index * 3] = Math.sin(latitude) * Math.cos(angle) * radius
    positions[index * 3 + 1] = Math.cos(latitude) * radius * 0.75
    positions[index * 3 + 2] = Math.sin(latitude) * Math.sin(angle) * radius
    seeds[index] = seed
  }
  const particleGeometry = new BufferGeometry()
  particleGeometry.setAttribute('position', new BufferAttribute(positions, 3))
  particleGeometry.setAttribute('aSeed', new BufferAttribute(seeds, 1))
  const particles = new Points(particleGeometry, new ShaderMaterial({
    uniforms, vertexShader: particleVertex, fragmentShader: particleFragment,
    transparent: true, blending: AdditiveBlending, depthWrite: false,
  }))
  world.add(particles)

  const shockwave = new Mesh(new TorusGeometry(0.85, 0.006, 6, 128), new MeshBasicMaterial({ color, transparent: true, opacity: 0, side: DoubleSide, blending: AdditiveBlending, depthWrite: false }))
  scene.add(shockwave)
  const targetRotation = new Vector2(0.2, -0.12)
  const pointer = new Vector2()
  let settings = { ...initial }
  let visible = false
  let disposed = false
  let lost = false
  let dragging = false
  let dragX = 0
  let dragY = 0
  let dragDistance = 0
  let simulationTime = 0
  let lastFrame = 0
  let releaseTime = -100
  let frame = 0
  let frameCount = 0
  let charge = 0
  let cloneSpread = 0
  let shaderFailed = false
  const interval = 1000 / (compact ? 30 : 60)

  renderer.debug.onShaderError = () => { shaderFailed = true }

  function draw(delta = 0) {
    const smoothing = delta ? 1 - Math.exp(-delta * 6) : 1
    simulationTime += delta
    const charging = settings.phase === 'charging'
    charge += ((charging ? 1 : 0) - charge) * smoothing
    color.lerp(targetColor, smoothing)
    uniforms.uTime.value = simulationTime
    uniforms.uCharge.value = charge
    const elapsed = simulationTime - releaseTime
    const burst = elapsed >= 0 && elapsed < 1.7 ? Math.sin(Math.min(elapsed / 1.7, 1) * Math.PI) : 0
    uniforms.uBurst.value = burst
    const cloneTarget = settings.effect === 'clones' ? settings.phase === 'released' ? 1 : 0.58 : 0
    cloneSpread += (cloneTarget - cloneSpread) * smoothing
    central.group.scale.setScalar((1 + charge * 0.16 - burst * 0.08) * (1 - cloneSpread * 0.32))
    central.group.rotation.y = simulationTime * 0.13
    central.core.rotation.z = simulationTime * 0.06
    central.strands.forEach((strand, index) => {
      strand.rotation.z = index * 0.4 + simulationTime * (0.16 + index * 0.028) * (1 + charge * 1.2)
      strand.material.color.copy(color)
    })
    clones.forEach((orb, index) => {
      orb.group.visible = cloneSpread > 0.01
      orb.group.position.set((index ? 1 : -1) * cloneSpread * 1.45, Math.sin(simulationTime + index * Math.PI) * 0.13, -0.2)
      orb.group.scale.setScalar(cloneSpread * 0.6)
      orb.group.rotation.y = simulationTime * (index ? -0.3 : 0.3)
      orb.strands.forEach(strand => strand.material.color.copy(color))
    })
    orbits.rotation.y = simulationTime * 0.07
    orbits.rotation.z = settings.effect === 'sage' ? simulationTime * -0.1 : simulationTime * 0.06
    orbits.scale.setScalar(settings.effect === 'sage' ? 1.08 + charge * 0.08 : 1)
    orbitMaterials.forEach(material => material.color.copy(color))
    world.rotation.y += (targetRotation.x + pointer.x * 0.12 - world.rotation.y) * smoothing
    world.rotation.x += (targetRotation.y - pointer.y * 0.08 - world.rotation.x) * smoothing
    particles.rotation.y = -simulationTime * 0.05
    shockwave.visible = burst > 0
    shockwave.scale.setScalar(1 + Math.max(0, elapsed) * 2.8)
    shockwave.material.opacity = burst * (1 - Math.min(elapsed / 1.7, 1)) * 0.65
    shockwave.material.color.copy(color)
    renderer.render(scene, camera)
    canvas.dataset.frame = String(++frameCount)
    canvas.dataset.view = `${targetRotation.x.toFixed(2)},${targetRotation.y.toFixed(2)}`
    canvas.dataset.phase = settings.phase
    canvas.dataset.effect = settings.effect
  }

  function fail() {
    if (lost || disposed) return
    lost = true
    cancelAnimationFrame(frame)
    canvas.dataset.running = 'false'
    onLost()
  }

  function tick(now) {
    if (disposed || lost || !visible || document.hidden || settings.paused) return
    if (!lastFrame) lastFrame = now - interval
    const elapsed = now - lastFrame
    if (elapsed >= interval - 0.5) {
      draw(Math.min(elapsed / 1000, 0.05))
      lastFrame = now
      if (shaderFailed) { fail(); return }
    }
    frame = requestAnimationFrame(tick)
  }

  function syncLoop() {
    cancelAnimationFrame(frame)
    lastFrame = 0
    const running = !disposed && !lost && visible && !document.hidden && !settings.paused
    canvas.dataset.running = String(running)
    if (running) frame = requestAnimationFrame(tick)
  }

  function renderOnDemand() {
    if (!disposed && !lost && visible && !document.hidden) draw()
  }

  function resize() {
    const width = host.clientWidth
    const height = host.clientHeight
    if (!width || !height || disposed || lost) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    // Keep the same framing on narrow displays instead of cropping the orbital field.
    camera.position.z = camera.aspect < 1.12 ? 5.1 : 4.6
    camera.updateProjectionMatrix()
    renderOnDemand()
  }

  function pointerDown(event) {
    if (settings.paused || event.button !== 0 || !event.isPrimary) return
    dragging = true
    dragDistance = 0
    dragX = event.clientX
    dragY = event.clientY
    host.setPointerCapture(event.pointerId)
    host.dataset.dragging = 'true'
  }

  function pointerMove(event) {
    if (settings.paused) return
    if (dragging) {
      const dx = event.clientX - dragX
      const dy = event.clientY - dragY
      targetRotation.x += dx * 0.007
      if (event.pointerType === 'mouse') targetRotation.y = Math.max(-0.8, Math.min(0.8, targetRotation.y + dy * 0.005))
      dragDistance += Math.abs(dx)
      dragX = event.clientX
      dragY = event.clientY
      canvas.dataset.dragDistance = String(dragDistance)
    } else if (event.pointerType === 'mouse') {
      const rect = host.getBoundingClientRect()
      pointer.set((event.clientX - rect.left) / rect.width - 0.5, (event.clientY - rect.top) / rect.height - 0.5)
    }
  }

  function pointerUp(event) {
    dragging = false
    host.dataset.dragging = 'false'
    if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId)
  }
  function pointerLeave() { pointer.set(0, 0) }
  function contextLost(event) { event.preventDefault(); fail() }

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    syncLoop()
    if (settings.paused) renderOnDemand()
  }, { threshold: 0.01 })
  intersection.observe(host)
  const sizeObserver = new ResizeObserver(resize)
  sizeObserver.observe(host)
  host.addEventListener('pointerdown', pointerDown)
  host.addEventListener('pointermove', pointerMove)
  host.addEventListener('pointerup', pointerUp)
  host.addEventListener('pointercancel', pointerUp)
  host.addEventListener('lostpointercapture', pointerUp)
  host.addEventListener('pointerleave', pointerLeave)
  canvas.addEventListener('webglcontextlost', contextLost)
  document.addEventListener('visibilitychange', syncLoop)
  resize()

  return {
    update(next) {
      if (disposed || lost) return
      if (next.effect !== settings.effect || next.phase === 'idle') releaseTime = -100
      if (next.phase === 'released' && settings.phase !== 'released' && !next.paused) releaseTime = simulationTime
      settings = { ...next }
      targetColor.set(colors[next.effect])
      // Paused mode still reflects explicit tab/technique changes in a single frame.
      if (settings.paused) { releaseTime = -100; renderOnDemand() }
      syncLoop()
    },
    rotate(amount) { targetRotation.x += amount; if (settings.paused) renderOnDemand() },
    reset() { targetRotation.set(0.2, -0.12); pointer.set(0, 0); if (settings.paused) renderOnDemand() },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      intersection.disconnect()
      sizeObserver.disconnect()
      document.removeEventListener('visibilitychange', syncLoop)
      host.removeEventListener('pointerdown', pointerDown)
      host.removeEventListener('pointermove', pointerMove)
      host.removeEventListener('pointerup', pointerUp)
      host.removeEventListener('pointercancel', pointerUp)
      host.removeEventListener('lostpointercapture', pointerUp)
      host.removeEventListener('pointerleave', pointerLeave)
      canvas.removeEventListener('webglcontextlost', contextLost)
      const geometries = new Set()
      const materials = new Set()
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry)
        if (object.material) materials.add(object.material)
      })
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(material => material.dispose())
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}