import { test, expect } from '@playwright/test'

test('Pages subpath serves artwork, navigation and the lazy 3D arsenal', async ({ page, baseURL }) => {
  const failures = []
  const origin = new URL(baseURL).origin
  page.on('pageerror', error => failures.push(error.message))
  page.on('response', response => {
    if (response.url().startsWith(origin) && response.status() >= 400) failures.push(`${response.status()} ${response.url()}`)
  })
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('opacity', '1')
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/naruto-uzumaki/favicon.svg')
  await expect(page.locator('link[rel="preload"]')).toHaveAttribute('href', '/naruto-uzumaki/images/naruto-shinobi.webp')

  for (const form of ['Shinobi', 'Sage', 'Kurama']) {
    await page.getByRole('tablist', { name: 'Naruto transformation' }).getByRole('tab', { name: new RegExp(form) }).click()
    const image = page.locator(`.character--${form.toLowerCase()}`)
    await expect(image).toHaveJSProperty('complete', true)
    await expect(image).not.toHaveJSProperty('naturalWidth', 0)
    await expect(image).toHaveAttribute('src', new RegExp('^/naruto-uzumaki/images/'))
  }
  await page.getByRole('link', { name: 'Discover his story' }).click()
  for (const chapter of ['01THE BEGINNING', '02THE GROWTH', '03THE LEGACY']) {
    await page.getByRole('tab', { name: chapter }).click()
    await expect(page.locator('.story-art-stage img')).toHaveCount(1)
    await expect(page.locator('.story-art-stage img')).not.toHaveJSProperty('naturalWidth', 0)
  }
  await page.locator('.chakra-stage').scrollIntoViewIfNeeded()
  await expect(page.locator('.chakra-experience')).toHaveAttribute('data-renderer', 'webgl', { timeout: 15000 })
  await page.getByRole('tab', { name: 'Rasenshuriken', exact: true }).click()
  await page.getByRole('button', { name: 'Infuse wind chakra' }).click()
  await expect(page.locator('.interaction-hint')).toContainText('Wind Release: Rasenshuriken.')
  await page.locator('.chakra-stage').scrollIntoViewIfNeeded()
  await expect(page.locator('.chakra-webgl canvas')).toHaveAttribute('data-wind-blades', '4')
  await page.goto('./#arsenal')
  await expect(page.getByRole('heading', { name: 'NOT JUST POWER. PURE WILL.' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('tab', { name: 'Rasenshuriken', exact: true })).toBeVisible()
  expect(failures).toEqual([])
})