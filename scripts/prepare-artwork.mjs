import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const images = [
  ['naruto-shinobi', 29, 1400],
  ['naruto-sage', 52, 1000],
  ['naruto-kurama', 41, 1000],
  ['naruto-young', 50, 700],
  ['naruto-hokage', 25, 800],
]

await mkdir(new URL('../public/images/', import.meta.url), { recursive: true })
for (const [name, number, width] of images) {
  const url = `https://pngimg.com/uploads/naruto/naruto_PNG${number}.png`
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`Artwork download failed: ${response.status} ${url}`)
  const image = Buffer.from(await response.arrayBuffer())
  const result = await sharp(image).trim().resize({ width, withoutEnlargement: true }).webp({ quality: 88 }).toFile(
    new URL(`../public/images/${name}.webp`, import.meta.url).pathname,
  )
  console.log(`${name}: ${Math.round(result.size / 1024)} KB`)
}