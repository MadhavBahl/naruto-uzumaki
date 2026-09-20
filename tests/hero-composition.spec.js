import { test, expect } from '@playwright/test'

async function portraitSize(page) {
  return page.locator('.hero-character').evaluate(element => {
    const { width, height } = element.getBoundingClientRect()
    return { width, height }
  })
}

test('scrolling preserves the hero composition and form controls', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.mouse.move(0, 0)
  await expect(page.locator('.hero-character')).toHaveCSS('opacity', '1')
  await expect(page.locator('.hero-character')).toHaveCSS('transform', 'none')
  await expect(page.locator('.character-parallax')).toHaveCSS('transform', 'none')
  const originalSize = await portraitSize(page)

  for (const fraction of [0.24, 0.52, 0.86, 0]) {
    await page.evaluate(fraction => window.scrollTo({
      top: document.querySelector('#home').offsetHeight * fraction,
      behavior: 'instant',
    }), fraction)
    await expect(page.locator('.hero-art')).toHaveCSS('transform', 'none')
    await expect(page.locator('.hero-art')).toHaveCSS('opacity', '1')
    await expect(page.locator('.hero-watermark')).toHaveCSS('transform', 'none')
    const size = await portraitSize(page)
    expect(size.width).toBeCloseTo(originalSize.width, 1)
    expect(size.height).toBeCloseTo(originalSize.height, 1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }

  for (const name of ['Sage', 'Kurama', 'Shinobi']) {
    await page.getByRole('tablist', { name: 'Naruto transformation' }).getByRole('tab', { name: new RegExp(name) }).click()
    await expect(page.locator(`.character--${name.toLowerCase()}`)).toHaveCSS('opacity', '1')
    await expect(page.locator('.hero-art')).toHaveCSS('transform', 'none')
  }
  // Mobile tab clicks scroll the page; return to the header before moving off the hero.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.mouse.move(0, 0)
  await expect(page.locator('.character-parallax')).toHaveCSS('transform', 'none')
  await page.screenshot({ path: testInfo.outputPath('hero-restored.png'), scale: 'css' })
  await page.getByRole('link', { name: 'Discover his story' }).click()
  await expect(page).toHaveURL(/#story$/)
  await expect(page.getByRole('heading', { name: 'FROM THE OUTSIDE. TO THE VERY TOP.' })).toBeInViewport()
})