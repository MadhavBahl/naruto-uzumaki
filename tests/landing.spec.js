import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('artwork, transformations, story and all chakra techniques work', async ({ page }, testInfo) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('opacity', '1')
  await expect(page.locator('.hero-character')).toHaveJSProperty('complete', true)
  await expect(page.locator('.hero-character')).not.toHaveJSProperty('naturalWidth', 0)
  await page.screenshot({ path: testInfo.outputPath('hero.png'), scale: 'css' })

  const forms = page.getByRole('tablist', { name: 'Naruto transformation' })
  for (const name of ['Sage', 'Kurama', 'Shinobi']) {
    await forms.getByRole('tab', { name: new RegExp(name) }).click()
    await expect(forms.getByRole('tab', { name: new RegExp(name) })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator(`.character--${name.toLowerCase()}`)).toHaveCSS('opacity', '1')
    await expect(page.locator(`.character--${name.toLowerCase()}`)).not.toHaveJSProperty('naturalWidth', 0)
  }

  await page.getByRole('link', { name: 'Discover his story' }).click()
  await page.getByRole('tab', { name: '03THE LEGACY' }).click()
  await expect(page.getByRole('heading', { name: 'A promise, kept.' })).toBeVisible()
  await expect(page.getByAltText('Naruto wearing his Seventh Hokage cloak')).toHaveCSS('opacity', '1')
  await page.getByRole('button', { name: 'Next story chapter' }).click()
  await expect(page.getByRole('heading', { name: 'An unlikely hero.' })).toBeVisible()

  for (const [name, action, message] of [
    ['Rasengan', 'Channel your chakra', 'Rasengan released.'],
    ['Shadow Clone', 'Create shadow clones', 'Shadow clone jutsu.'],
    ['Sage Mode', 'Gather nature energy', 'Nature energy balanced.'],
    ['Rasenshuriken', 'Infuse wind chakra', 'Wind Release: Rasenshuriken.'],
  ]) {
    await page.getByRole('tab', { name, exact: true }).click()
    await page.getByRole('button', { name: action, exact: true }).click()
    await expect(page.getByRole('button', { name: 'Channeling chakra…' })).toBeDisabled()
    await expect(page.locator('.interaction-hint')).toContainText(message)
    await expect(page.getByRole('button', { name: 'Try it again' })).toBeEnabled()
  }
  // Changing a technique cancels the previous charge rather than releasing stale state.
  await page.getByRole('button', { name: 'Try it again' }).click()
  await page.getByRole('tab', { name: 'Rasengan', exact: true }).click()
  await expect(page.locator('.chakra-stage')).toHaveClass(/phase--idle/)
  await expect(page.getByRole('button', { name: 'Channel your chakra', exact: true })).toBeEnabled()

  for (const id of ['story', 'arsenal', 'ninja-way']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded()
    await expect(page.locator(`#${id} > div`).first()).toHaveCSS('opacity', '1')
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.screenshot({ path: testInfo.outputPath('full-page.png'), fullPage: true, scale: 'css' })
  expect(errors).toEqual([])
})

test('sound, navigation, motion control and credits are accessible', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Enable ambient sound' }).click()
  await expect(page.getByRole('button', { name: 'Mute ambient sound' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Mute ambient sound' }).click()
  await expect(page.getByRole('button', { name: 'Enable ambient sound' })).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: 'Pause animations' }).click()
  await expect(page.locator('.app')).toHaveClass(/motion-paused/)
  await page.getByRole('button', { name: 'Enable animations' }).click()

  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await expect(page.getByRole('navigation')).toBeVisible()
    await page.getByRole('link', { name: 'The story', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'false')
  } else {
    const tabs = page.getByRole('tablist', { name: 'Naruto transformation' })
    await tabs.getByRole('tab', { name: /Shinobi/ }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabs.getByRole('tab', { name: /Sage/ })).toBeFocused()
    await expect(tabs.getByRole('tab', { name: /Sage/ })).toHaveAttribute('aria-selected', 'true')
  }
  await page.getByRole('button', { name: 'ARTWORK & CREDITS' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close credits' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'ARTWORK & CREDITS' })).toBeFocused()
})

test('reduced motion, responsive overflow and accessibility audit', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.app')).toHaveClass(/motion-paused/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('opacity', '1')
  await page.getByRole('button', { name: 'Channel your chakra', exact: true }).click()
  await expect(page.locator('.interaction-hint')).toContainText('Rasengan released.')

  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.setViewportSize({ width: testInfo.project.name === 'mobile' ? 390 : 1440, height: 1000 })
  for (const id of ['home', 'story', 'arsenal', 'ninja-way']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded()
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(results.violations.map(violation => ({
      id: violation.id,
      nodes: violation.nodes.map(node => ({ target: node.target, message: node.failureSummary })),
    }))).toEqual([])
  }
})