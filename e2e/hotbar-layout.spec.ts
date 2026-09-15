import { expect, test } from '@playwright/test'

test('the complete hotbar fits its panel at desktop, tablet, and phone widths', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /Edit slot 9:/ })).toBeVisible()

  for (const width of [1440, 1280, 1101, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 960 })
    // Test with the last slot's tooltip open: it used to extend the scroll area.
    await page.getByRole('button', { name: /Edit slot 9:/ }).hover()
    const layout = await page.locator('.hotbar-layout').evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      const controls = [...element.querySelectorAll('.hotbar-slot, .offhand-slot, .slot-key')]
      return {
        overflow: [getComputedStyle(element).overflowX, getComputedStyle(element).overflowY],
        allControlsFit: controls.every((control) => {
          const rect = control.getBoundingClientRect()
          return rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1
            && rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1
        }),
        slotCount: element.querySelectorAll('.hotbar-slot').length,
        documentFits: document.documentElement.scrollWidth <= window.innerWidth,
      }
    })
    expect(layout, `Hotbar at ${width}px`).toEqual({
      overflow: ['visible', 'visible'],
      allControlsFit: true,
      slotCount: 9,
      documentFits: true,
    })
    await page.getByRole('button', { name: /Edit slot 9:/ }).click()
    await expect(page.getByRole('heading', { name: 'Slot 9', exact: true })).toBeVisible()
    if (width === 1280 || width === 390) {
      await page.locator('.hotbar-stage').screenshot({ path: testInfo.outputPath(`hotbar-${width}.png`) })
    }
  }
})
