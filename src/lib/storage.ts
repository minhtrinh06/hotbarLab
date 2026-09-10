import type { Binding, HotbarPlan, Workspace } from '../types'
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

export const WORKSPACE_KEY = 'hotbar-lab.workspace.v2'

export function createWorkspace(plan = createStarterPlan()): Workspace {
  return {
    version: 2, activeLayoutId: 'default', defaultLayoutId: 'default',
    layouts: [{ id: 'default', name: plan.name, isExample: plan.isExample,
      slots: plan.hotbarSlots.map(({ slot, flex, items }) => ({ slot, flex, items })) }],
    bindings: { hotbar: plan.hotbarSlots.map((slot) => slot.binding), offhand: plan.offhand, other: plan.otherBindings },
    destinations: {},
  }
}

export function activePlan(workspace: Workspace, id = workspace.activeLayoutId): HotbarPlan {
  const layout = workspace.layouts.find((entry) => entry.id === id)!
  return { version: 1, name: layout.name, isExample: layout.isExample,
    hotbarSlots: layout.slots.map((slot, index) => ({ ...slot, binding: workspace.bindings.hotbar[index] })),
    offhand: workspace.bindings.offhand, otherBindings: workspace.bindings.other }
}

export function updateActivePlan(workspace: Workspace, plan: HotbarPlan): Workspace {
  return { ...workspace,
    layouts: workspace.layouts.map((layout) => layout.id !== workspace.activeLayoutId ? layout : {
      ...layout, name: plan.name, isExample: plan.isExample,
      slots: plan.hotbarSlots.map(({ slot, flex, items }) => ({ slot, flex, items })),
    }),
    bindings: { hotbar: plan.hotbarSlots.map((slot) => slot.binding), offhand: plan.offhand, other: plan.otherBindings },
  }
}

export function deleteLayout(workspace: Workspace, id: string): Workspace {
  if (workspace.layouts.length === 1) return workspace
  const layouts = workspace.layouts.filter((layout) => layout.id !== id)
  const defaultLayoutId = workspace.defaultLayoutId === id ? layouts[0].id : workspace.defaultLayoutId
  return { ...workspace, layouts, defaultLayoutId,
    activeLayoutId: workspace.activeLayoutId === id ? defaultLayoutId : workspace.activeLayoutId,
    destinations: Object.fromEntries(Object.entries(workspace.destinations).map(([key, setting]) =>
      [key, setting.layoutId === id ? { ...setting, layoutId: undefined } : setting])),
  }
}

const isBinding = (value: unknown): value is Binding => {
  const binding = value as Binding | null
  return !!binding && typeof binding.display === 'string' && Array.isArray(binding.modifiers)
    && binding.modifiers.every((entry) => typeof entry === 'string')
    && (binding.minecraftCode === undefined || typeof binding.minecraftCode === 'string')
}

export function loadWorkspace(storage: Pick<Storage, 'getItem'> = localStorage): Workspace {
  const raw = storage.getItem(WORKSPACE_KEY)
  if (raw) {
    try {
      const w: Workspace = JSON.parse(raw)
      if (w.version !== 2 || !Array.isArray(w.layouts) || !w.layouts.length
        || !w.layouts.every((layout) => typeof layout.id === 'string' && typeof layout.name === 'string'
          && layout.slots.length === 9 && layout.slots.every((slot, i) => slot.slot === i + 1
            && Array.isArray(slot.items) && slot.items.every((item) => typeof item.id === 'string'
              && typeof item.name === 'string' && typeof item.sprite === 'string')))
        || new Set(w.layouts.map((layout) => layout.id)).size !== w.layouts.length
        || !w.layouts.some((layout) => layout.id === w.activeLayoutId)
        || !w.layouts.some((layout) => layout.id === w.defaultLayoutId)
        || w.bindings.hotbar.length !== 9 || !w.bindings.hotbar.every(isBinding)
        || !isBinding(w.bindings.offhand) || !w.bindings.other.every((entry) => isBinding(entry.binding))
        || !w.destinations || Array.isArray(w.destinations)
        || !Object.values(w.destinations).every((setting) => setting && setting.overrides
          && (!setting.layoutId || w.layouts.some((layout) => layout.id === setting.layoutId))
          && Object.entries(setting.overrides).every(([slot, item]) => /^[0-8]$/.test(slot)
            && (item === null || (typeof item.id === 'string' && Number.isInteger(item.count) && item.count > 0))))) {
        throw new Error('Invalid workspace')
      }
      return w
    } catch {
      // Keep corrupt v2 data available for recovery rather than silently replacing it.
      throw new Error('Saved layouts could not be read. Back up browser storage before resetting it.')
    }
  }
  return createWorkspace(loadPlan(storage))
}

export function saveWorkspace(workspace: Workspace, storage: Pick<Storage, 'setItem'> = localStorage) {
  storage.setItem(WORKSPACE_KEY, JSON.stringify(workspace))
}
