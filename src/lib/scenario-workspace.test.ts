import { expect, it } from 'vitest'
import { activePlan, createWorkspace, deleteLayout, loadWorkspace, saveWorkspace } from './storage'
import { ensureScenarioTemplates, importScenarioContents, importWorkspaceScenarios } from './scenario-workspace'
import { importPlayerScenario, PLAYER_TEMPLATES } from '../data/scenarios'
import { resolveHotbar } from './inventory'

it('adds source scenarios once and preserves saved assignments and deleted templates', () => {
  const workspace = createWorkspace()
  expect(workspace.layouts.filter((layout) => layout.group === 'basic')).toHaveLength(12)
  expect(workspace.layouts.filter((layout) => layout.group === 'advanced')).toHaveLength(27)
  expect(workspace.layouts[0].slots.some((slot) => slot.flex)).toBe(true)
  expect(workspace.layouts.slice(1).every((layout) => layout.slots.every((slot) => !slot.flex))).toBe(true)
  workspace.destinations['mpk:0'] = { layoutId: 'template-ocean-ow', overrides: { 0: null } }
  const deleted = deleteLayout(workspace, 'template-ocean-ow')
  const storage = new Map<string, string>()
  saveWorkspace(deleted, { setItem: (k, v) => { storage.set(k, v) } })
  const restored = loadWorkspace({ getItem: (k) => storage.get(k) ?? null })
  expect(restored.layouts).toHaveLength(39)
  expect(restored.destinations['mpk:0']).toEqual({ layoutId: undefined, overrides: { 0: null } })
  expect(ensureScenarioTemplates(restored)).toEqual(restored)
})

it('imports six player sets and changes shared keys only when requested', () => {
  const workspace = createWorkspace()
  const base = activePlan(workspace)
  for (const player of PLAYER_TEMPLATES) {
    const scenarios = player.scenarios.map((scenario) => importPlayerScenario(player, scenario, base, false))
    const imported = importWorkspaceScenarios(workspace, scenarios, false)
    expect(imported.bindings).toEqual(workspace.bindings)
    expect(imported.layouts.slice(40).every((layout) => layout.slots.every((slot) => slot.flex === (slot.items.length > 1)))).toBe(true)
  }
  const doogile = PLAYER_TEMPLATES.find((player) => player.id === 'doogile')!
  const imported = importWorkspaceScenarios(workspace, [importPlayerScenario(doogile, doogile.scenarios[0], base, true)], true)
  expect(activePlan(imported).hotbarSlots[4].binding.display).toBe('R')
  expect(activePlan(workspace).hotbarSlots[4].binding.display).toBe('Z')
})

it('imports independent item pools without changing scenario identity, shared keys or destinations', () => {
  const workspace = createWorkspace()
  const source = workspace.layouts[0]
  source.offhandItems = [source.slots[0].items[0]]
  workspace.activeLayoutId = 'template-ocean-ow'
  workspace.destinations['mpk:0'] = { layoutId: workspace.activeLayoutId, overrides: { 0: null } }
  const target = workspace.layouts.find((layout) => layout.id === workspace.activeLayoutId)!
  const imported = importScenarioContents(workspace, source.id)
  const result = imported.layouts.find((layout) => layout.id === workspace.activeLayoutId)!
  expect(result).toEqual({ ...target, isExample: false, flexSpotsEnabled: true, slots: source.slots, offhandItems: source.offhandItems })
  expect(imported.bindings).toBe(workspace.bindings)
  expect(imported.destinations).toBe(workspace.destinations)
  expect(imported.activeLayoutId).toBe(workspace.activeLayoutId)
  expect(imported.defaultLayoutId).toBe(workspace.defaultLayoutId)
  result.slots[0].items[0].name = 'Changed copy'
  expect(source.slots[0].items[0].name).not.toBe('Changed copy')
  result.offhandItems![0].name = 'Changed offhand'
  expect(source.offhandItems[0].name).not.toBe('Changed offhand')
  expect(importScenarioContents(workspace, 'missing')).toBe(workspace)
  expect(importScenarioContents(workspace, workspace.activeLayoutId)).toBe(workspace)
})

it('uses sheet composite cues when arranging Minecraft exports', () => {
  const workspace = createWorkspace()
  workspace.layouts[0].slots = workspace.layouts[0].slots.map((slot) => ({ ...slot, items: [] }))
  workspace.layouts[0].slots[3].items = [{ id: 'obsidian-anchor', name: 'Obsidian / Anchor', sprite: '' }]
  const resolved = resolveHotbar({ id: 'example', target: 'mpk', name: 'Example', file: '', path: [], copies: [], missing: false,
    items: [{ slot: 0, id: 'minecraft:respawn_anchor', count: 1 }] }, workspace)
  expect(resolved[3]?.id).toBe('minecraft:respawn_anchor')
  expect(resolved[0]).toBeNull()
})
