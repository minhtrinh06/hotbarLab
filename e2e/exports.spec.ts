import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { read } from 'nbtify'
import { unzipSync } from 'fflate'

test('saves scenario layouts, shares keys, customizes destinations, and downloads working binary files', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/')
  await page.getByRole('button', { name: 'Duplicate layout' }).click()
  await page.getByRole('textbox', { name: 'Plan name' }).fill('Fortress layout')
  await page.getByRole('button', { name: /Edit slot 1:/ }).click()
  await page.getByRole('button', { name: 'Change binding 1', exact: true }).click()
  await page.keyboard.press('v')
  await page.getByLabel('Saved layout', { exact: true }).selectOption('default')
  await expect(page.getByRole('button', { name: /Edit slot 1:.*V/ })).toBeVisible()
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  await page.getByLabel('Preset barrel', { exact: true }).selectOption('mpk:2')
  await page.getByLabel('mpk assigned layout').selectOption({ label: 'Fortress layout' })
  const mpk = page.getByRole('region', { name: 'MPK export', exact: true })
  await mpk.getByRole('button', { name: 'Customize slot 1', exact: true }).click()
  await mpk.getByLabel('Slot 1 item ID', { exact: true }).fill('minecraft:obsidian')
  await mpk.getByLabel('Slot 1 quantity', { exact: true }).fill('12')
  await mpk.getByRole('button', { name: 'Apply slot 1', exact: true }).click()
  await expect(mpk.getByLabel('Export slot 1', { exact: true })).toContainText('Obsidian × 12')

  const map = page.getByRole('region', { name: 'Practice map export', exact: true })
  await page.getByLabel('Map loadout', { exact: true }).selectOption('map:bastion:1')
  await map.getByRole('button', { name: 'Customize slot 1', exact: true }).click()
  await map.getByLabel('Slot 1 item ID', { exact: true }).fill('minecraft:diamond_pickaxe')
  await map.getByRole('button', { name: 'Apply slot 1', exact: true }).click()
  await page.reload()
  await expect(page.getByLabel('Saved layout', { exact: true }).locator('option')).toHaveCount(2)
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  await page.getByLabel('Preset barrel', { exact: true }).selectOption('mpk:2')
  await expect(mpk.getByLabel('Export slot 1', { exact: true })).toContainText('Obsidian × 12')
  await expect(page.getByLabel('mpk assigned layout').locator('option:checked')).toHaveText('Fortress layout')

  const mpkDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download custom MPK', exact: true }).click()
  const nbtFile = await mpkDownload
  expect(nbtFile.suggestedFilename()).toBe('hotbar.nbt')
  const nbt = (await read(await readFile((await nbtFile.path())!))).data as any
  const barrels = nbt['0'].filter((item: any) => item.id === 'minecraft:barrel')
  expect(barrels).toHaveLength(6)
  expect(barrels[2].tag.BlockEntityTag.Items.at(-1).tag.pages[0]).toBe('replaceitem entity @p hotbar.0 minecraft:obsidian 12')

  const mapDownload = page.waitForEvent('download', { timeout: 60_000 })
  await page.getByRole('button', { name: 'Download custom practice map', exact: true }).click()
  const zip = await mapDownload
  const files = unzipSync(await readFile((await zip.path())!))
  expect(files['Hotbar Lab - MCSR Practice/level.dat']).toBeDefined()
  const storage = (await read(files['Hotbar Lab - MCSR Practice/data/command_storage_minecraft.dat'])).data as any
  expect(storage.data.contents['loadout.1'].hotbar[0].id).toBe('minecraft:diamond_pickaxe')

  await page.setViewportSize({ width: 768, height: 900 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('reports a failed template fetch and allows retry', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  await page.route('**/templates/mpk-0.6.nbt', (route) => route.fulfill({ status: 503, body: 'Unavailable' }))
  await page.getByRole('button', { name: 'Download custom MPK', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Could not download')
  await expect(page.getByRole('button', { name: 'Download custom MPK', exact: true })).toBeEnabled()
})
