export type SupportedJsonProperty =
  | `key_key.hotbar.${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | 'key_key.swapOffhand'
  | 'key_key.sprint'
  | 'key_key.pickItem'

export interface Binding {
  display: string
  minecraftCode?: string
  modifiers: string[]
}

export interface ItemRef {
  id: string
  name: string
  sprite: string
  custom?: boolean
  minecraftId?: string
}

export interface SavedLayout {
  group?: ScenarioGroup
  playerId?: string
  flexSpotsEnabled?: boolean
  offhandItems?: ItemRef[]
  id: string
  name: string
  isExample: boolean
  slots: Array<Pick<HotbarSlot, 'slot' | 'flex' | 'items'>>
}

export interface ItemOverride { id: string; count: number }
export interface DestinationSettings {
  layoutId?: string
  // Missing = automatic; null = intentionally empty.
  overrides: Record<string, ItemOverride | null>
}

export interface Workspace {
  scenarioTemplatesVersion?: 1
  version: 2
  activeLayoutId: string
  defaultLayoutId: string
  layouts: SavedLayout[]
  bindings: { hotbar: Binding[]; offhand: Binding; other: OtherBinding[] }
  destinations: Record<string, DestinationSettings>
}

export interface HotbarSlot {
  slot: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  binding: Binding
  flex: boolean
  items: ItemRef[]
}

export interface OtherBinding {
  id: string
  label: string
  binding: Binding
  enabledInPractice: boolean
  promptType: 'text' | 'item'
  itemId?: string
  jsonProperty?: 'key_key.sprint' | 'key_key.pickItem'
}

export interface HotbarPlan {
  flexSpotsEnabled?: boolean
  offhandItems?: ItemRef[]
  version: 1
  name: string
  isExample: boolean
  hotbarSlots: HotbarSlot[]
  offhand: Binding
  otherBindings: OtherBinding[]
}

export type PracticeGroup = 'hotbar' | 'minecraft' | 'macros' | 'ninjabrain' | 'other'

export interface PracticePrompt {
  id: string
  group: PracticeGroup
  label: string
  sourceLabel: string
  sprite?: string
  spriteStyle?: 'screenshot' | 'shield'
  binding: Binding
}

export interface PracticeResult {
  prompt: PracticePrompt
  correct: boolean
  reactionMs: number
  entered: string
}

export type ScenarioGroup = 'main' | 'basic' | 'advanced' | 'custom' | 'player'

export interface SavedScenario {
  id: string
  group: ScenarioGroup
  playerId?: string
  plan: HotbarPlan
}

export interface ScenarioLibrary {
  version: 1
  activeId: string
  defaultId: string
  scenarios: SavedScenario[]
}
