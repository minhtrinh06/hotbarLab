import type { HotbarPlan, OtherBinding, PracticeGroup, PracticePrompt, PracticeResult } from '../types'
import { ITEM_CATALOG } from '../data/catalog'

export const PRACTICE_GROUPS: { id: PracticeGroup; label: string; description: string }[] = [
  { id: 'hotbar', label: 'Hotbar slots 1–9', description: 'All assigned items, including flex slots' },
  { id: 'minecraft', label: 'Minecraft hotkeys', description: 'Offhand, pick block & sprint' },
  { id: 'macros', label: 'Macros', description: 'Thin, wide & eye measure' },
  { id: 'ninjabrain', label: 'Ninja Brain', description: 'Overlay, left, right & reset' },
  { id: 'other', label: 'Custom hotkeys', description: 'Your additional actions' },
]

const ACTION_ICONS: Record<string, string> = {
  sprint: 'leather-boots.png',
  'pick-block': 'grass-block.png',
  'wide-macro': 'wide-macro.png',
  'thin-macro': 'thin-macro.png',
  'eye-macro': 'thin-macro.png',
  overlay: 'ninjabrain.jpg',
  'eye-left': 'arrow-left.svg',
  'eye-right': 'arrow-right.svg',
  'reset-nbb': 'reset.svg',
}

function actionGroup(action: OtherBinding): PracticeGroup {
  if (action.jsonProperty || ['sprint', 'pick-block'].includes(action.id)) return 'minecraft'
  if (['wide-macro', 'thin-macro', 'eye-macro'].includes(action.id)) return 'macros'
  if (['overlay', 'eye-left', 'eye-right', 'reset-nbb'].includes(action.id)) return 'ninjabrain'
  return 'other'
}

export function buildPromptPool(plan: HotbarPlan): PracticePrompt[] {
  const prompts: PracticePrompt[] = []
  for (const slot of plan.hotbarSlots) {
    for (const item of slot.items) {
      prompts.push({
        id: `slot-${slot.slot}-${item.id}`,
        group: 'hotbar',
        label: item.name,
        sourceLabel: `Slot ${slot.slot}`,
        sprite: item.sprite,
        binding: slot.binding,
      })
    }
  }
  if (plan.offhand.display) {
    prompts.push({ id: 'offhand', group: 'minecraft', label: 'Offhand', sourceLabel: 'Offhand', sprite: '/assets/practice/offhand.png', spriteStyle: 'shield', binding: plan.offhand })
  }
  for (const action of plan.otherBindings) {
    if (!action.enabledInPractice || !action.binding.display) continue
    const item = action.itemId ? ITEM_CATALOG.find((entry) => entry.id === action.itemId) : undefined
    const group = actionGroup(action)
    const icon = ACTION_ICONS[action.id] ?? (action.jsonProperty === 'key_key.sprint' ? ACTION_ICONS.sprint : action.jsonProperty === 'key_key.pickItem' ? ACTION_ICONS['pick-block'] : undefined)
    prompts.push({
      id: `other-${action.id}`,
      group,
      label: action.label || 'Unnamed action',
      sourceLabel: action.label || 'Unnamed action',
      sprite: action.promptType === 'item' ? item?.sprite : icon ? `/assets/practice/${icon}` : undefined,
      spriteStyle: action.promptType !== 'item' && group === 'macros' ? 'screenshot' : undefined,
      binding: action.binding,
    })
  }
  return prompts
}

export function makeSequence(pool: PracticePrompt[], length: number, random = Math.random): PracticePrompt[] {
  if (!pool.length) return []
  const sequence: PracticePrompt[] = []
  for (let index = 0; index < length; index += 1) {
    let choices = pool
    if (pool.length > 1 && sequence.length) choices = pool.filter((prompt) => prompt.id !== sequence[index - 1].id)
    sequence.push(choices[Math.floor(random() * choices.length)])
  }
  return sequence
}

export function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

export function practiceSummary(results: PracticeResult[]) {
  const times = results.map((result) => result.reactionMs)
  const grouped = new Map<string, { label: string; correct: number; total: number; times: number[] }>()
  for (const result of results) {
    const current = grouped.get(result.prompt.sourceLabel) ?? { label: result.prompt.sourceLabel, correct: 0, total: 0, times: [] }
    current.total += 1
    if (result.correct) current.correct += 1
    current.times.push(result.reactionMs)
    grouped.set(result.prompt.sourceLabel, current)
  }
  const misses = new Map<string, number>()
  results.filter((result) => !result.correct).forEach((result) => misses.set(result.prompt.label, (misses.get(result.prompt.label) ?? 0) + 1))
  const mostMissed = [...misses.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None'
  return {
    accuracy: results.length ? Math.round((results.filter((result) => result.correct).length / results.length) * 100) : 0,
    median: median(times),
    best: times.length ? Math.min(...times) : 0,
    slowest: times.length ? Math.max(...times) : 0,
    mostMissed,
    grouped: [...grouped.values()].map((group) => ({ ...group, median: median(group.times) })),
  }
}
