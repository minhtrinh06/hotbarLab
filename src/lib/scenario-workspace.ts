import { createScenarioLibrary } from '../data/scenarios'
import type { HotbarPlan, SavedLayout, SavedScenario, Workspace } from '../types'

export function layoutFromScenario(scenario: SavedScenario): SavedLayout {
  return { id: scenario.id, group: scenario.group, playerId: scenario.playerId,
    name: scenario.plan.name, isExample: scenario.plan.isExample,
    flexSpotsEnabled: scenario.plan.flexSpotsEnabled,
    offhandItems: scenario.plan.offhandItems,
    slots: scenario.plan.hotbarSlots.map(({ slot, flex, items }) => ({ slot, flex, items })),
  }
}

export function ensureScenarioTemplates(workspace: Workspace): Workspace {
  if (workspace.scenarioTemplatesVersion === 1) return workspace
  const main = workspace.layouts.find((layout) => layout.id === 'default') ?? workspace.layouts[0]
  const plan: HotbarPlan = { version: 1, name: main.name, isExample: main.isExample,
    hotbarSlots: main.slots.map((slot, i) => ({ ...slot, binding: workspace.bindings.hotbar[i] })),
    offhand: workspace.bindings.offhand, otherBindings: workspace.bindings.other }
  const templates = createScenarioLibrary(plan).scenarios.slice(1).map(layoutFromScenario)
  return { ...workspace, scenarioTemplatesVersion: 1,
    layouts: [...workspace.layouts.map((layout): SavedLayout => ({ ...layout,
      group: layout.id === main.id ? 'main' : 'custom',
    })), ...templates.filter((template) => !workspace.layouts.some((layout) => layout.id === template.id))],
  }
}

export function importWorkspaceScenarios(workspace: Workspace, scenarios: SavedScenario[], useKeys: boolean): Workspace {
  if (!scenarios.length) return workspace
  const plan = scenarios[0].plan
  return { ...workspace, layouts: [...workspace.layouts, ...scenarios.map(layoutFromScenario)],
    bindings: useKeys ? { ...workspace.bindings, hotbar: plan.hotbarSlots.map((slot) => slot.binding), offhand: plan.offhand } : workspace.bindings,
  }
}

export function importScenarioContents(workspace: Workspace, sourceId: string): Workspace {
  const source = workspace.layouts.find((layout) => layout.id === sourceId)
  if (!source || source.id === workspace.activeLayoutId) return workspace
  return { ...workspace, layouts: workspace.layouts.map((layout) => layout.id === workspace.activeLayoutId
    ? { ...layout, isExample: false,
      flexSpotsEnabled: source.slots.some((slot) => slot.flex || slot.items.length > 1) || (source.flexSpotsEnabled ?? source.group === 'main'),
      slots: structuredClone(source.slots), offhandItems: structuredClone(source.offhandItems ?? []) }
    : layout) }
}
