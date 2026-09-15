import { expect, test } from '@playwright/test'

test('edits a flex slot and reaches export', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Build your muscle memory.' })).toBeVisible()
  await page.getByRole('button', { name: /Edit slot 5/ }).click()
  await expect(page.getByRole('heading', { name: 'Slot 5' })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('hotbar-lab-plan.png'), fullPage: true })

  await page.getByRole('button', { name: /Edit slot 1/ }).click()
  await page.getByRole('button', { name: 'Change binding 1' }).click()
  await page.keyboard.press('v')
  await page.waitForTimeout(350)
  await page.reload()
  await expect(page.getByRole('button', { name: /Edit slot 1:.*V/ })).toBeVisible()

  await page.getByRole('button', { name: 'Practice' }).click()
  await expect(page.getByRole('heading', { name: 'Test the scenario before the run.' })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('hotbar-lab-practice.png'), fullPage: true })
  await page.getByRole('button', { name: 'Clear' }).click()
  await page.getByText('Pickaxe', { exact: true }).click()
  await page.getByRole('button', { name: '10', exact: true }).click()
  await page.getByRole('button', { name: 'Start session →' }).click()
  await page.waitForTimeout(2100)
  for (let prompt = 0; prompt < 10; prompt += 1) {
    await page.keyboard.press('v')
    await page.waitForTimeout(470)
  }
  await expect(page.getByRole('heading', { name: '100% accuracy' })).toBeVisible()

  await page.getByRole('button', { name: 'Export' }).click()
  await expect(page.getByRole('heading', { name: 'Export without the cleanup.' })).toBeVisible()
  await expect(page.getByLabel('Editable preview')).toContainText('Flex: Gold Block')
  await page.locator('input[type="file"]').setInputFiles({ name: 'standardsettings.json', mimeType: 'application/json', buffer: Buffer.from('{"key_key.hotbar.1":"key.keyboard.1","keepMe":true}') })
  await expect(page.getByText('key_key.hotbar.1', { exact: true })).toBeVisible()
  await expect(page.getByText('key.keyboard.v', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download patched copy' })).toBeEnabled()
  await page.screenshot({ path: testInfo.outputPath('hotbar-lab-export.png'), fullPage: true })

  await page.setViewportSize({ width: 768, height: 900 })
  await page.getByRole('button', { name: 'Plan' }).click()
  await expect(page.getByRole('heading', { name: 'Build your muscle memory.' })).toBeVisible()
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  const mobileNav = await page.getByRole('navigation', { name: 'Main views' }).boundingBox()
  expect(Math.round((mobileNav?.y ?? 0) + (mobileNav?.height ?? 0))).toBe(900)
  await page.screenshot({ path: testInfo.outputPath('hotbar-lab-tablet.png'), fullPage: false })
})
