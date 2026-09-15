import sheet from './sheet-templates.json'
import { catalogItem } from './catalog'
import type { Binding, HotbarPlan, SavedScenario, ScenarioLibrary } from '../types'

export const TEMPLATE_SOURCE = sheet.source
export const PLAYER_TEMPLATES = sheet.players
export type PlayerTemplate = typeof PLAYER_TEMPLATES[number]
export type PlayerHotbar = PlayerTemplate['scenarios'][number]

export function scenarioLabel(name: string): string {
  const expanded = name.replace(/strong hold/g, 'stronghold').replace(/\bOW\b/g, 'overworld')
    .replace(/\bDT\b/g, 'desert temple').replace(/\bF&S\b/g, 'flint & steel')
    .replace(/\btnt\b/gi, 'TNT').replace(/\bbed&tnt\b/gi, 'bed & TNT')
  return expanded.charAt(0).toUpperCase() + expanded.slice(1)
}

export function blankScenario(base: HotbarPlan, name: string): HotbarPlan {
  return {
    ...structuredClone(base), name, isExample: false, flexSpotsEnabled: false, offhandItems: [],
    hotbarSlots: base.hotbarSlots.map((slot) => ({ ...structuredClone(slot), flex: false, items: [] })),
  }
}

export function createScenarioLibrary(main: HotbarPlan): ScenarioLibrary {
  return { version: 1, activeId: 'main', defaultId: 'main', scenarios: [
    { id: 'main', group: 'main', plan: { ...main, flexSpotsEnabled: main.flexSpotsEnabled ?? true } },
    ...sheet.scenarios.map((scenario): SavedScenario => ({
      id: `template-${scenario.id}`, group: scenario.group as 'basic' | 'advanced',
      plan: blankScenario(main, scenarioLabel(scenario.name)),
    })),
  ] }
}

function sheetBinding(value: string | null | undefined, fallback: Binding): Binding {
  if (!value) return structuredClone(fallback)
  const display = value.length === 1 ? value.toUpperCase() : value
  const code = /^MB[45]$/.test(value) ? `key.mouse.${Number(value.slice(2))}` : `key.keyboard.${value.toLowerCase()}`
  return { display, minecraftCode: code, modifiers: [] }
}

export function importPlayerScenario(player: PlayerTemplate, scenario: PlayerHotbar, base: HotbarPlan, usePlayerKeys: boolean): SavedScenario {
  const plan = blankScenario(base, `${player.name} · ${scenarioLabel(scenario.name)}`)
  plan.hotbarSlots = plan.hotbarSlots.map((slot, i) => ({
    ...slot, items: scenario.slots[i].map(catalogItem),
    binding: usePlayerKeys ? sheetBinding(player.keys[i], slot.binding) : slot.binding,
  }))
  plan.offhand = usePlayerKeys ? sheetBinding(player.offhandKey, base.offhand) : plan.offhand
  plan.offhandItems = scenario.offhand.map(catalogItem)
  return { id: crypto.randomUUID(), group: 'player', playerId: player.id, plan }
}

export function setFlexSpots(plan: HotbarPlan, enabled: boolean): HotbarPlan {
  return { ...plan, isExample: false, flexSpotsEnabled: enabled,
    hotbarSlots: plan.hotbarSlots.map((slot) => enabled ? slot : { ...slot, flex: false, items: slot.items.slice(0, 1) }),
  }
}
