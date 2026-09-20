import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function openScene(page) {
  await page.goto('/')
  await page.locator('.chakra-stage').scrollIntoViewIfNeeded()
  await expect(page.locator('.chakra-experience')).toHaveAttribute('data-renderer', 'webgl')
  const canvas = page.locator('.chakra-webgl canvas')
  await expect(canvas).toHaveAttribute('data-running', 'true')
  await expect.poll(async () => Number(await canvas.getAttribute('data-frame'))).toBeGreaterThan(2)
  return canvas
}

// Observe across real browser frames rather than imposing an arbitrary timeout.
async function nextFrames(page, count = 8) {
  await page.evaluate(count => new Promise(resolve => {
    function frame() { if (--count <= 0) resolve(); else requestAnimationFrame(frame) }
    requestAnimationFrame(frame)
  }), count)
}

test('live 3D compiles, orbits, transforms and passes accessibility checks', async ({ page }, testInfo) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  const canvas = await openScene(page)
  const initialView = await canvas.getAttribute('data-view')
  await page.getByRole('button', { name: 'Rotate chakra right' }).click()
  await page.locator('.chakra-stage').scrollIntoViewIfNeeded()
  await expect(canvas).not.toHaveAttribute('data-view', initialView)
  await page.getByRole('button', { name: 'Reset chakra view' }).click()
  // Mobile clicks can reveal only the controls; offscreen canvas rendering is intentionally paused.
  await page.locator('.chakra-stage').scrollIntoViewIfNeeded()
  await expect(canvas).toHaveAttribute('data-view', initialView)

  const box = await page.locator('.chakra-webgl').boundingBox()
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  if (testInfo.project.name === 'mobile') {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let offset = 10; offset <= 80; offset += 10) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + offset, y }] })
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await cdp.detach()
  } else {
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 90, y + 20, { steps: 9 })
    await page.mouse.up()
  }
  await expect(canvas).not.toHaveAttribute('data-view', initialView)
  await expect(page.locator('.chakra-webgl')).toHaveAttribute('data-dragging', 'false')
  await expect.poll(async () => Number(await canvas.getAttribute('data-drag-distance'))).toBeGreaterThan(30)

  for (const [name, effect, action] of [
    ['Rasengan', 'rasengan', 'Channel your chakra'],
    ['Shadow Clone', 'clones', 'Create shadow clones'],
    ['Sage Mode', 'sage', 'Gather nature energy'],
    ['Rasenshuriken', 'rasenshuriken', 'Infuse wind chakra'],
  ]) {
    await page.getByRole('tab', { name, exact: true }).click()
    await page.getByRole('button', { name: action, exact: true }).click()
    await page.locator('.chakra-stage').scrollIntoViewIfNeeded()
    await expect(canvas).toHaveAttribute('data-effect', effect)
    await expect(canvas).toHaveAttribute('data-phase', 'released')
    await expect(canvas).toHaveAttribute('data-wind-blades', effect === 'rasenshuriken' ? '4' : '0')
    await nextFrames(page, 20)
    await page.locator('.chakra-stage').screenshot({ path: testInfo.outputPath(`${effect}-3d.png`), scale: 'css' })
  }

  const results = await new AxeBuilder({ page }).include('#arsenal').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([])
  await page.getByRole('tab', { name: 'Rasengan', exact: true }).click()
  await page.locator('.chakra-stage').scrollIntoViewIfNeeded()
  await expect(canvas).toHaveAttribute('data-wind-blades', '0')
  expect(errors).toEqual([])
})

test('GPU loop stops offscreen, while paused, and in a hidden tab', async ({ page }) => {
  const canvas = await openScene(page)
  await page.getByRole('button', { name: 'Pause animations' }).click()
  await page.locator('.chakra-stage').scrollIntoViewIfNeeded()
  await expect(canvas).toHaveAttribute('data-running', 'false')
  await nextFrames(page)
  const pausedFrame = await canvas.getAttribute('data-frame')
  await nextFrames(page)
  await expect(canvas).toHaveAttribute('data-frame', pausedFrame)
  await page.getByRole('tab', { name: 'Rasenshuriken', exact: true }).click()
  await page.locator('.chakra-stage').scrollIntoViewIfNeeded()
  await expect(canvas).toHaveAttribute('data-wind-blades', '4')
  await expect(canvas).toHaveAttribute('data-running', 'false')
  // Still allow deliberate keyboard/button view changes when animation is paused.
  const view = await canvas.getAttribute('data-view')
  await page.getByRole('button', { name: 'Rotate chakra left' }).click()
  await expect(canvas).not.toHaveAttribute('data-view', view)
  await page.getByRole('button', { name: 'Enable animations' }).click()
  await page.locator('.chakra-stage').scrollIntoViewIfNeeded()
  await expect(canvas).toHaveAttribute('data-running', 'true')

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(canvas).toHaveAttribute('data-running', 'false')
  const offscreenFrame = await canvas.getAttribute('data-frame')
  await nextFrames(page)
  await expect(canvas).toHaveAttribute('data-frame', offscreenFrame)
  await page.locator('.chakra-stage').scrollIntoViewIfNeeded()
  await expect(canvas).toHaveAttribute('data-running', 'true')

  // Headless Chromium does not hide tabs on bringToFront; exercise visibilitychange explicitly.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(canvas).toHaveAttribute('data-running', 'false')
  const hiddenFrame = await canvas.getAttribute('data-frame')
  await nextFrames(page)
  await expect(canvas).toHaveAttribute('data-frame', hiddenFrame)
  await page.evaluate(() => {
    delete document.hidden
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(canvas).toHaveAttribute('data-running', 'true')
})

test('WebGL unavailability retains functional CSS effects', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl2') return null
      return original.call(this, type, ...args)
    }
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Channel your chakra', exact: true }).click()
  await expect(page.locator('.interaction-hint')).toContainText('Rasengan released.')
  await expect(page.locator('.chakra-experience')).toHaveAttribute('data-renderer', 'fallback')
  await expect(page.locator('.chakra-fallback')).toBeVisible()
  await expect(page.locator('.chakra-webgl canvas')).toHaveCount(0)
  await page.getByRole('tab', { name: 'Rasenshuriken', exact: true }).click()
  await page.getByRole('button', { name: 'Infuse wind chakra' }).click()
  await expect(page.locator('.interaction-hint')).toContainText('Wind Release: Rasenshuriken.')
  await expect(page.locator('.wind-shuriken')).toBeVisible()
  await expect(page.locator('.wind-blade')).toHaveCount(4)
  await page.getByRole('tab', { name: 'Rasengan', exact: true }).click()
  await expect(page.locator('.wind-shuriken')).not.toBeVisible()
})

test('reduced motion avoids downloading 3D and context loss stops the renderer', async ({ page }) => {
  const gpuRequests = []
  page.on('request', request => { if (request.url().includes('createChakraScene')) gpuRequests.push(request.url()) })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('.chakra-stage').scrollIntoViewIfNeeded()
  await page.getByRole('tab', { name: 'Rasenshuriken', exact: true }).click()
  await page.getByRole('button', { name: 'Infuse wind chakra' }).click()
  await expect(page.locator('.interaction-hint')).toContainText('Wind Release: Rasenshuriken.')
  await expect(page.locator('.wind-shuriken')).toBeVisible()
  await expect(page.locator('.wind-rotor')).toHaveCSS('animation-name', 'none')
  await expect(page.locator('.chakra-webgl canvas')).toHaveCount(0)
  expect(gpuRequests).toEqual([])
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.locator('.chakra-stage').scrollIntoViewIfNeeded()
  await expect(page.locator('.chakra-experience')).toHaveAttribute('data-renderer', 'webgl')
  const canvas = page.locator('.chakra-webgl canvas')
  await expect(canvas).toHaveAttribute('data-running', 'true')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(canvas).toHaveAttribute('data-running', 'false')
  await expect(page.locator('.app')).toHaveClass(/motion-paused/)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(canvas).toHaveAttribute('data-running', 'true')
  await canvas.evaluate(element => element.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext())
  await expect(page.locator('.chakra-experience')).toHaveAttribute('data-renderer', 'fallback')
  await expect(canvas).toHaveAttribute('data-running', 'false')
  await expect(page.locator('.chakra-fallback')).toBeVisible()
  await expect(page.locator('.wind-shuriken')).toBeVisible()
  await page.getByRole('tab', { name: 'Sage Mode', exact: true }).click()
  await page.getByRole('button', { name: 'Gather nature energy' }).click()
  await expect(page.locator('.interaction-hint')).toContainText('Nature energy balanced.')
})

test('fourth technique supports keyboard navigation and narrow layouts', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const tabs = page.getByRole('tablist', { name: 'Ninja techniques' })
  await expect(tabs.getByRole('tab')).toHaveCount(4)
  await tabs.getByRole('tab', { name: 'Rasengan', exact: true }).focus()
  await page.keyboard.press('End')
  const windTab = tabs.getByRole('tab', { name: 'Rasenshuriken', exact: true })
  await expect(windTab).toBeFocused()
  await expect(windTab).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel', { name: 'Rasenshuriken' })).toContainText('S-RANK · WIND RELEASE')
  await page.keyboard.press('ArrowRight')
  await expect(tabs.getByRole('tab', { name: 'Rasengan', exact: true })).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(windTab).toBeFocused()

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.setViewportSize({ width: testInfo.project.name === 'mobile' ? 390 : 1440, height: 1000 })
  await page.locator('.chakra-stage').scrollIntoViewIfNeeded()
  await page.locator('#arsenal').screenshot({ path: testInfo.outputPath('rasenshuriken-fallback.png'), scale: 'css' })
  const results = await new AxeBuilder({ page }).include('#arsenal').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([])
})