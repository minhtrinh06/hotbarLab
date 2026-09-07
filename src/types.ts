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
  version: 1
  name: string
  isExample: boolean
  hotbarSlots: HotbarSlot[]
  offhand: Binding
  otherBindings: OtherBinding[]
}

export interface PracticePrompt {
  id: string
  label: string
  sourceLabel: string
  sprite?: string
  binding: Binding
}

export interface PracticeResult {
  prompt: PracticePrompt
  correct: boolean
  reactionMs: number
  entered: string
}
