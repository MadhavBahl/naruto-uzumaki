# Naruto Uzumaki — The Will of Fire

A compact, cinematic, unofficial Naruto tribute. React 19, Vite, Motion, Three.js, Lucide, and custom CSS. No backend, API keys, connectors, or paid services required.

## Run

- Install dependencies: `npm install`
- Start development: `npm run dev` (use the local URL printed by Vite)
- Production build: `npm run build`
- Preview production: `npm run preview`
- Lint: `npm run lint`
- Browser tests: `npx playwright install chromium`, then `npm test`

A **Naruto: development server** task is also included in VS Code.

## The experience

- Layered Naruto hero with pointer-driven perspective parallax, animated embers, film grain, and a three-dimensional chakra seal with orbiting glyphs. The portrait keeps its original size and composition during scrolling.
- Shinobi, Sage, and Kurama transformations with artwork, accent colors, and expanding energy-wave transitions.
- Spring-driven magnetic CTA, holographic story-card tilt, drifting chakra fragments, and a reading-progress line.
- Three interactive story chapters, from the beginning to Seventh Hokage.
- Real-time Three.js Rasengan, Shadow Clone, and Sage Mode visualizations: custom flowing-surface GLSL shaders, orbital filaments, a GPU particle field, splitting clone orbs, and charge/release shockwaves.
- Optional, original synthesized ambience. Sound starts off; no copyrighted soundtrack is used.
- Responsive mobile navigation, keyboard-operated tabs, accessible native credits dialog, animation pause control, and system reduced-motion support.

### Try the 3D experience

In **The Arsenal**, drag the orb to orbit it (horizontal swipe on mobile; vertical gestures still scroll). The left/right/reset buttons provide a keyboard-accessible alternative. Choose a technique and channel chakra to see it charge and release. Move over the hero and story card for the depth effects, or switch forms to trigger the energy wave.

### Motion and performance

- Three.js is a separate, lazily imported chunk loaded only near the arsenal. No 3D models, texture downloads, or image connectors are needed.
- The renderer caps resolution at 1.5× on desktop / 1.25× on touch devices, and animation at 60 / 30 fps respectively, with 900 / 420 GPU particles. There is no bloom postprocessing or frame-by-frame React state update.
- The WebGL animation loop stops outside the viewport, in hidden tabs, and when animations are paused. Geometries, materials, observers, event listeners, and the GPU context are disposed on unmount.
- Reduced motion skips the 3D download on initial load and uses the CSS fallback. OS preference changes are applied live. Explicit technique and view controls continue to work when motion is paused.
- Scrolling remains native, without hero zoom, pinning, or scroll-triggered camera movement. Depth responds to pointer movement and explicit form changes instead.
- Devices without WebGL2, failed 3D downloads, shader errors, and lost GPU contexts retain the CSS chakra visualization rather than an empty panel.
- Browser tests cover desktop/mobile interactions, real WebGL compilation, touch orbiting, GPU suspension, live motion-preference changes, context loss, fallback behavior, and automated accessibility checks.

## Artwork and rights

Character illustrations were sourced from [PNGimg’s Naruto collection](https://pngimg.com/images/fantasy/naruto), trimmed and converted to local WebP files. All five images together are approximately 560 KB; the initial hero is approximately 150 KB. They do not depend on third-party hotlinking at runtime.

| Local image | Source |
| --- | --- |
| Shinobi | [Naruto PNG29 / 109324](https://pngimg.com/image/109324) |
| Sage | [Naruto PNG52 / 109347](https://pngimg.com/image/109347) |
| Kurama | [Naruto PNG41 / 109336](https://pngimg.com/image/109336) |
| Young Naruto | [Naruto PNG50 / 109345](https://pngimg.com/image/109345) |
| Hokage | [Naruto PNG25 / 109320](https://pngimg.com/image/109320) |

**Public availability is not a commercial-use license.** Naruto and its characters belong to Masashi Kishimoto and their respective rights holders. This is an unaffiliated, non-commercial prototype. Verify source terms and secure the appropriate artwork permissions before commercial publication or redistribution. Replace the images with licensed assets if required. The footer includes visible credits and links.

To regenerate the optimized assets from their sources: `node scripts/prepare-artwork.mjs`. This is a development-only script; ordinary builds and page loads never download source artwork.

Barlow Condensed and DM Sans are self-hosted through Fontsource (SIL Open Font License). Japanese display glyphs use Noto Serif JP via Google Fonts with a local serif fallback. Lucide icons use the ISC license. Particle effects, chakra visuals, and audio are generated in code.

## Structure

- `src/App.jsx` — page sections and interactions
- `src/data.js` — transformation, chapter, and technique content
- `src/styles.css` — original design system and responsive layouts
- `src/advanced-motion.css` — isolated cinematic motion and 3D presentation layer
- `src/components/` — hero atmosphere, tilt card, magnetic CTA, chakra scene, leaf mark, and embers
- `src/graphics/createChakraScene.js` — Three.js renderer, GLSL shaders, pointer controls, and GPU lifecycle
- `src/hooks/useMotionPreference.js` — live reduced-motion subscription
- `src/hooks/useAmbientAudio.js` — opt-in synthesized sound
- `public/images/` — optimized local character art
- `tests/landing.spec.js` — desktop/mobile functional and accessibility checks
- `tests/advanced-motion.spec.js` — 3D, touch, lifecycle, and fallback regression tests
- `tests/hero-composition.spec.js` — stable artwork dimensions during scrolling and form-control regression checks

The original reference video remains untouched in `sample/` and is not included in the production build. Deploy the generated `dist/` folder to any static host.