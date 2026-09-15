import { readFileSync } from 'node:fs'
import { read, stringify, type CompoundTag } from 'nbtify'
import { unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { createWorkspace, deleteLayout, loadWorkspace, saveWorkspace } from './storage'
import { DESTINATIONS, destinationLayout, resolveHotbar, type Destination } from './inventory'
import { exportMinecraft, inventoryAt } from './minecraft-export'

describe('practice hotbars', () => {
  it('automatically matches practice scenarios, keeps manual assignments, and falls back after deletion', () => {
    const workspace = createWorkspace()
    const expected = {
      'mpk:0': 'nether-terrain', 'mpk:1': 'nether-terrain', 'mpk:2': 'into-fort',
      'mpk:3': 'blinding', 'mpk:4': 'strong-hold', 'mpk:5': 'zero',
      'map:portal:blind': 'blinding', 'map:portal:stronghold': 'strong-hold',
      'map:portal:portalbreak': 'portal-break', 'map:inventory:0': 'blaze-bed',
      'map:inventory:1': 'blaze-tnt', 'map:inventory:2': 'blaze-bed-and-tnt',
      'map:inventory:3': 'blaze-bed-and-tnt', 'map:inventory:4': 'into-fort',
      'map:zero_practice_loadouts:0': 'zero', 'map:zero_practice_loadouts:1': 'zero',
      'map:zero_practice_loadouts:2': 'zero', 'map:zero_practice_loadouts:3': 'zero',
      'map:zero_practice_loadouts:4': 'zero',
      'map:bastion:1': 'nether-terrain', 'map:bastion:2': 'nether-terrain', 'map:bastion:3': 'nether-terrain',
    }
    for (const [id, scenario] of Object.entries(expected)) {
      expect(destinationLayout(DESTINATIONS.find((entry) => entry.id === id)!, workspace)?.id, id).toBe(`template-${scenario}`)
    }
    const destination = DESTINATIONS.find((entry) => entry.id === 'mpk:0')!
    const layout = destinationLayout(destination, workspace)!
    layout.name = 'My renamed terrain'
    layout.slots[8].items = [{ id: 'iron-axe', name: 'Iron axe', sprite: '' }]
    expect(resolveHotbar(destination, workspace)[8]?.id).toBe('minecraft:iron_axe')
    workspace.destinations[destination.id] = { layoutId: workspace.defaultLayoutId, overrides: { 8: null } }
    const saved = new Map<string, string>()
    saveWorkspace(workspace, { setItem: (key, value) => { saved.set(key, value) } })
    const restored = loadWorkspace({ getItem: (key) => saved.get(key) ?? null })
    expect(destinationLayout(destination, restored)?.id).toBe(workspace.defaultLayoutId)
    expect(resolveHotbar(destination, restored)[8]).toBeNull()
    restored.destinations[destination.id].layoutId = undefined
    expect(destinationLayout(destination, restored)?.name).toBe('My renamed terrain')
    expect(resolveHotbar(destination, restored)[8]).toBeNull()
    const deleted = deleteLayout(restored, layout.id)
    expect(destinationLayout(destination, deleted)?.id).toBe(deleted.defaultLayoutId)
    expect(destinationLayout(DESTINATIONS.find((entry) => entry.id === 'map:portal:custom')!, workspace)?.id).toBe(workspace.defaultLayoutId)
  })

  it('matches flex priorities, reserves original positions, and preserves every supplied stack', () => {
    const workspace = createWorkspace()
    const original = DESTINATIONS[0]
    workspace.destinations[original.id] = { layoutId: workspace.defaultLayoutId, overrides: {} }
    const result = resolveHotbar(original, workspace)
    expect(result[0]?.id).toBe('minecraft:iron_pickaxe')
    expect(result[1]?.id).toBe('minecraft:iron_axe')
    expect(result[2]?.id).toBe('minecraft:dirt')
    expect(result.filter(Boolean).map((item) => item!.sourceSlot).sort()).toEqual(original.items.map((item) => item.slot).sort())
    expect(result.filter(Boolean).map((item) => item!.count).sort()).toEqual(original.items.map((item) => item.count).sort())
    expect(original.items[0].id).toBe('minecraft:iron_axe')
    const collision: Destination = { ...original, items: [
      { slot: 0, id: 'minecraft:iron_pickaxe', count: 1 },
      { slot: 2, id: 'minecraft:obsidian', count: 12 },
      { slot: 4, id: 'minecraft:gold_block', count: 3 },
    ] }
    const flexible = resolveHotbar(collision, workspace)
    expect(flexible[4]?.id).toBe('minecraft:gold_block')
    expect(flexible[2]?.id).toBe('minecraft:obsidian')
    const random = DESTINATIONS.find((entry) => entry.id === 'map:inventory:3')!
    workspace.destinations[random.id] = { layoutId: workspace.defaultLayoutId, overrides: {} }
    expect(resolveHotbar(random, workspace)[4]?.alternatives).toContain('minecraft:white_bed')
  })

  it('keeps controls, empty presets, special data, and validates exact overrides', () => {
    const workspace = createWorkspace()
    const destination = DESTINATIONS.find((entry) => entry.id === 'mpk:2')!
    const automatic = resolveHotbar(destination, workspace)
    const potionSlot = automatic.findIndex((item) => item?.potion)
    expect(automatic[potionSlot]?.special).toBe(true)
    workspace.destinations[destination.id] = { overrides: { 0: { id: 'minecraft:ender_pearl', count: 17 } } }
    expect(() => resolveHotbar(destination, workspace)).toThrow('quantity')
    workspace.destinations[destination.id].overrides[0] = { id: 'minecraft:imaginary', count: 1 }
    expect(() => resolveHotbar(destination, workspace)).toThrow('valid')
    workspace.destinations[destination.id].overrides[0] = null
    expect(resolveHotbar(destination, workspace)[0]).toBeNull()
    const empty = DESTINATIONS.find((entry) => entry.id === 'map:bastion:1')!
    expect(resolveHotbar(empty, workspace)).toEqual(Array(9).fill(null))
    const control = DESTINATIONS.find((entry) => entry.items.some((item) => item.protected))!
    const slot = control.items.find((item) => item.protected)!.slot
    workspace.destinations[control.id] = { overrides: { [slot]: null } }
    expect(() => resolveHotbar(control, workspace)).toThrow('practice control')
  })

  it('exports every MPK barrel with exact slot commands and intact original triggers', async () => {
    const source = readFileSync('public/templates/mpk-0.6.nbt')
    const workspace = createWorkspace()
    workspace.layouts.find((layout) => layout.id === 'template-nether-terrain')!.slots[8].items = [{ id: 'iron-axe', name: 'Iron axe', sprite: '' }]
    workspace.destinations['mpk:0'] = { overrides: { 0: null, 1: { id: 'minecraft:diamond_pickaxe', count: 1 } } }
    const original = await read(source)
    const output = await read(await exportMinecraft(source, 'mpk', workspace))
    for (const id of ['mpk:0', 'mpk:1']) {
      const destination = DESTINATIONS.find((entry) => entry.id === id)!
      const actual = inventoryAt(output.data, destination.path) as CompoundTag[]
      expect(actual.find((item) => Number(item.Slot) === 8)?.id).toBe('minecraft:iron_axe')
    }
    expect(output.compression).toBeNull()
    for (const destination of DESTINATIONS.filter((entry) => entry.target === 'mpk')) {
      const expected = resolveHotbar(destination, workspace)
      const inventory = inventoryAt(output.data, destination.path) as CompoundTag[]
      const oldInventory = inventoryAt(original.data, destination.path) as CompoundTag[]
      expect(inventory.filter((item) => Number(item.Slot) >= 9)).toEqual(oldInventory.filter((item) => Number(item.Slot) >= 9))
      const parent = destination.path.slice(0, 5)
      const oldTriggers = inventoryAt(original.data, parent) as CompoundTag[]
      const triggers = inventoryAt(output.data, parent) as CompoundTag[]
      expect(triggers.slice(1, oldTriggers.length)).toEqual(oldTriggers.slice(1))
      const book = triggers.at(-1)!.tag as CompoundTag
      const pages = book.pages as string[]
      expect(pages).toHaveLength(9)
      for (let slot = 0; slot < 9; slot++) {
        const reserved = inventory.find((item) => Number(item.Slot) === slot)!
        expect(reserved.id).toBe(expected[slot]?.id ?? 'minecraft:barrier')
        expect(Number((reserved.tag as CompoundTag).HotbarLabSlot)).toBe(slot)
        expect(pages[slot]).toContain(`replaceitem entity @p hotbar.${slot} ${expected[slot]?.id ?? 'minecraft:air'}`)
        if (expected[slot]?.potion) expect(pages[slot]).toContain(expected[slot]!.potion)
        expect(pages[slot]).not.toContain('HotbarLabSlot')
      }
    }
    // Creative rows and the MPK command block remain intact.
    expect((output.data as CompoundTag)['1']).toEqual((original.data as CompoundTag)['1'])
    const originalRow = (original.data as CompoundTag)['0'] as CompoundTag[]
    const outputRow = (output.data as CompoundTag)['0'] as CompoundTag[]
    expect(outputRow.slice(6)).toEqual(originalRow.slice(6))
  })

  it('patches native map inventories and selected copies while retaining all unrelated files and NBT', async () => {
    const source = readFileSync('.cache/templates/mcsr-2.0.0.zip')
    const workspace = createWorkspace()
    workspace.layouts.find((layout) => layout.id === 'template-blinding')!.slots[8].items = [{ id: 'obsidian', name: 'Obsidian', sprite: '' }]
    const alternate = structuredClone(workspace.layouts[0])
    alternate.id = 'alternate'
    alternate.slots[0].items = [{ id: 'ender-pearl', name: 'Pearls', sprite: '' }]
    workspace.layouts.push(alternate)
    workspace.destinations['map:inventory:0'] = { layoutId: alternate.id, overrides: { 4: { id: 'minecraft:obsidian', count: 12 } } }
    workspace.destinations['map:bastion:1'] = { overrides: { 0: { id: 'minecraft:diamond_pickaxe', count: 1 } } }
    const generated = unzipSync(await exportMinecraft(source, 'map', workspace))
    const original = unzipSync(source)
    const prefix = 'Hotbar Lab - MCSR Practice/'
    const blind = DESTINATIONS.find((entry) => entry.id === 'map:portal:blind')!
    const blindInventory = inventoryAt((await read(generated[prefix + blind.file])).data, blind.path) as CompoundTag[]
    expect(blindInventory.find((item) => Number(item.Slot) === 8)?.id).toBe('minecraft:obsidian')
    expect(generated[`${prefix}level.dat`]).toBeDefined()
    const changed = new Set(DESTINATIONS.filter((entry) => entry.target === 'map').map((entry) => entry.file))
    expect(Object.keys(generated).length).toBe(Object.keys(original).length)
    for (const [file, bytes] of Object.entries(original)) {
      if (!changed.has(file)) expect(Buffer.compare(bytes, generated[prefix + file]), file).toBe(0)
    }
    for (const file of changed) {
      const before = await read(original[file])
      const after = await read(generated[prefix + file])
      expect(after.compression).toBe('gzip')
      for (const destination of DESTINATIONS.filter((entry) => entry.file === file)) {
        if (destination.missing && !workspace.destinations[destination.id]) continue
        const actual = inventoryAt(after.data, destination.path) as CompoundTag[]
        const expected = resolveHotbar(destination, workspace).filter(Boolean)
        expect(actual.map((item) => [Number(item.Slot), item.id, Number(item.Count)]))
          .toEqual(expected.map((item) => [item!.slot, item!.id, item!.count]))
        for (const copy of destination.copies) expect(inventoryAt(after.data, copy)).toEqual(actual)
        // Normalize only the fields we deliberately patched, then compare all remaining typed tags.
        for (const path of [destination.path, ...destination.copies]) {
          const parent = inventoryAt(after.data, path.slice(0, -1)) as CompoundTag
          parent[String(path.at(-1))] = inventoryAt(before.data, path)
        }
      }
      expect(stringify(after)).toBe(stringify(before))
    }
  }, 30_000)

  it('rejects changed or corrupt templates', async () => {
    await expect(exportMinecraft(new Uint8Array([1, 2, 3]), 'mpk', createWorkspace())).rejects.toThrow('verification')
  })
})
