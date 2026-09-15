import { describe, expect, it } from 'vitest'
import { createStarterPlan } from '../data/starter'
import { loadPlan, savePlan, STORAGE_KEY } from './storage'
import { activePlan, deleteLayout, loadWorkspace, saveWorkspace, updateActivePlan, WORKSPACE_KEY } from './storage'
import { setFlexSpots } from '../data/scenarios'

describe('plan storage', () => {
  it('round-trips valid plans', () => {
    const values = new Map<string, string>()
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) }
    const plan = createStarterPlan()
    plan.name = 'My setup'
    savePlan(plan, storage)
    expect(loadPlan(storage).name).toBe('My setup')
  })

  it('falls back on corrupt data', () => {
    const storage = { getItem: (key: string) => key === STORAGE_KEY ? '{nope' : null }
    expect(loadPlan(storage).isExample).toBe(true)
  })
})

it('migrates v1, shares bindings, persists independent layouts and cleans deleted assignments', () => {
  const values = new Map<string, string>()
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
  const plan = createStarterPlan()
  plan.name = 'My original'
  savePlan(plan, storage)
  let workspace = loadWorkspace(storage)
  expect(activePlan(workspace)).toEqual(plan)
  workspace.layouts.push({ ...structuredClone(workspace.layouts[0]), id: 'second', name: 'Second' })
  workspace.activeLayoutId = 'second'
  const edited = activePlan(workspace)
  edited.hotbarSlots[0] = { ...edited.hotbarSlots[0], items: [], binding: { display: 'V', modifiers: [], minecraftCode: 'key.keyboard.v' } }
  workspace = updateActivePlan(workspace, edited)
  expect(activePlan(workspace, 'default').hotbarSlots[0].binding.display).toBe('V')
  expect(activePlan(workspace, 'default').hotbarSlots[0].items).not.toHaveLength(0)
  workspace.destinations['mpk:0'] = { layoutId: 'second', overrides: { 0: null } }
  saveWorkspace(workspace, storage)
  expect(loadWorkspace(storage)).toEqual(workspace)
  workspace = deleteLayout(workspace, 'second')
  expect(workspace.activeLayoutId).toBe('default')
  expect(workspace.destinations['mpk:0']).toEqual({ layoutId: undefined, overrides: { 0: null } })
  expect(values.get(STORAGE_KEY)).toContain('My original')
  values.set(WORKSPACE_KEY, '{broken')
  expect(() => loadWorkspace(storage)).toThrow('could not be read')
})

it('preserves existing pools and saves scenario-wide flex changes independently', () => {
  let workspace = loadWorkspace({ getItem: () => null })
  // Older saved flags can be stale after editing while the master control was absent.
  workspace.layouts[0].flexSpotsEnabled = false
  expect(activePlan(workspace).flexSpotsEnabled).toBe(true)
  workspace.layouts.push({ ...structuredClone(workspace.layouts[0]), id: 'copy', name: 'Copy' })
  workspace.activeLayoutId = 'copy'
  workspace = updateActivePlan(workspace, setFlexSpots(activePlan(workspace), false))
  expect(activePlan(workspace).flexSpotsEnabled).toBe(false)
  expect(activePlan(workspace).hotbarSlots.every((slot) => !slot.flex && slot.items.length <= 1)).toBe(true)
  expect(activePlan(workspace, 'default').hotbarSlots[4].items).toHaveLength(5)
  const restored = loadWorkspace({ getItem: (key) => key === WORKSPACE_KEY ? JSON.stringify(workspace) : null })
  expect(activePlan(restored).flexSpotsEnabled).toBe(false)
  expect(activePlan(restored, 'default').flexSpotsEnabled).toBe(true)
})
