import type { HotbarPlan } from '../types'
import { createStarterPlan } from '../data/starter'

export const STORAGE_KEY = 'hotbar-lab.plan.v1'

function isPlan(value: unknown): value is HotbarPlan {
  if (!value || typeof value !== 'object') return false
  const plan = value as Partial<HotbarPlan>
  return plan.version === 1
    && typeof plan.name === 'string'
    && Array.isArray(plan.hotbarSlots)
    && plan.hotbarSlots.length === 9
    && plan.hotbarSlots.every((slot, index) => slot.slot === index + 1 && Array.isArray(slot.items) && slot.binding)
    && Boolean(plan.offhand)
    && Array.isArray(plan.otherBindings)
}

export function loadPlan(storage: Pick<Storage, 'getItem'> = localStorage): HotbarPlan {
  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) return createStarterPlan()
  try {
    const parsed: unknown = JSON.parse(raw)
    return isPlan(parsed) ? parsed : createStarterPlan()
  } catch {
    return createStarterPlan()
  }
}

export function savePlan(plan: HotbarPlan, storage: Pick<Storage, 'setItem'> = localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(plan))
}
