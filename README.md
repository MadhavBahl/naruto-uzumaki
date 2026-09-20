# Naruto Uzumaki — The Will of Fire

A compact, cinematic, unofficial Naruto tribute. React 19, Vite, Motion, Lucide, and custom CSS. No backend, API keys, connectors, or paid services required.

## Run

- Install dependencies: `npm install`
- Start development: `npm run dev` (use the local URL printed by Vite)
- Production build: `npm run build`
- Preview production: `npm run preview`
- Lint: `npm run lint`
- Browser tests: `npx playwright install chromium`, then `npm test`

A **Naruto: development server** task is also included in VS Code.

## The experience

- Layered Naruto hero with pointer parallax, animated embers, film grain, and a rotating chakra seal.
- Shinobi, Sage, and Kurama transformations with their own artwork and accent colors.
- Three interactive story chapters, from the beginning to Seventh Hokage.
- Rasengan, Shadow Clone, and Sage Mode chakra visualizations with charge/release interactions.
- Optional, original synthesized ambience. Sound starts off; no copyrighted soundtrack is used.
- Responsive mobile navigation, keyboard-operated tabs, accessible native credits dialog, animation pause control, and system reduced-motion support.

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
- `src/styles.css` — design system, effects, and responsive layouts
- `src/components/` — leaf mark and ember canvas
- `src/hooks/useAmbientAudio.js` — opt-in synthesized sound
- `public/images/` — optimized local character art
- `tests/landing.spec.js` — desktop/mobile functional and accessibility checks

The original reference video remains untouched in `sample/` and is not included in the production build. Deploy the generated `dist/` folder to any static host.