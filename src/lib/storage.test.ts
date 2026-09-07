import { describe, expect, it } from 'vitest'
import { createStarterPlan } from '../data/starter'
import { loadPlan, savePlan, STORAGE_KEY } from './storage'

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
