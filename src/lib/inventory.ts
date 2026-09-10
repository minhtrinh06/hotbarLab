import metadata from '../data/templates.json'
import registry from '../data/minecraft-items.json'
import type { ItemRef, Workspace } from '../types'

export type ExportTarget = 'mpk' | 'map'
export interface Stack {
  slot: number
  id: string
  count: number
  potion?: string
  special?: boolean
  protected?: boolean
  label?: string
  alternatives?: string[]
  sourceSlot?: number
}
export interface Destination {
  id: string
  target: string
  name: string
  file: string
  path: (string | number)[]
  copies: (string | number)[][]
  missing: boolean
  items: Stack[]
}
export const DESTINATIONS: Destination[] = metadata.destinations
export const TEMPLATES = metadata.templates
export const MINECRAFT_ITEMS = registry
const itemsById = new Map(registry.map((item) => [item.id, item]))
export const itemName = (id: string) => itemsById.get(id)?.name ?? id
export const stackLimit = (id: string) => itemsById.get(id)?.stackSize

function matches(preference: ItemRef, stack: Stack): boolean {
  if (stack.alternatives?.some((id) => matches(preference, { ...stack, id, alternatives: undefined }))) return true
  if (preference.minecraftId) return stack.id === preference.minecraftId
  if (preference.custom) return false
  const id = stack.id.replace('minecraft:', '')
  switch (preference.id) {
    case 'iron-pickaxe': return id.endsWith('_pickaxe')
    case 'iron-axe': return id.endsWith('_axe')
    case 'iron-shovel': return id.endsWith('_shovel')
    case 'red-bed': return id.endsWith('_bed')
    case 'oak-boat': return id.endsWith('_boat')
    case 'dirt': return ['dirt', 'cobblestone', 'netherrack', 'nether_bricks', 'soul_sand', 'soul_soil'].includes(id) || id.endsWith('_planks')
    case 'water-bucket': return ['water_bucket', 'lava_bucket', 'bucket'].includes(id)
    case 'cooked-salmon': return ['cooked_salmon', 'cooked_cod', 'cooked_beef', 'cooked_porkchop', 'cooked_mutton', 'bread', 'golden_carrot'].includes(id)
    case 'fire-resistance': return ['minecraft:fire_resistance', 'minecraft:long_fire_resistance'].includes(stack.potion ?? '')
    default: return id === preference.id.replaceAll('-', '_')
  }
}

export function resolveHotbar(destination: Destination, workspace: Workspace): Array<Stack | null> {
  const settings = workspace.destinations[destination.id]
  const layout = workspace.layouts.find((entry) => entry.id === (settings?.layoutId ?? workspace.defaultLayoutId))
  if (!layout) throw new Error(`${destination.name}: assigned layout is missing.`)
  const result: Array<Stack | null> = Array(9).fill(null)
  const remaining = destination.items.map((item) => ({ ...item, sourceSlot: item.slot }))
  const place = (slot: number, index: number) => {
    result[slot] = { ...remaining.splice(index, 1)[0], slot }
  }
  for (const item of destination.items.filter((item) => item.protected)) {
    place(item.slot, remaining.findIndex((entry) => entry.slot === item.slot))
  }
  for (const slot of layout.slots) {
    const target = slot.slot - 1
    if (result[target]) continue
    for (const preference of slot.items) {
      const index = remaining.findIndex((stack) => matches(preference, stack))
      if (index !== -1) { place(target, index); break }
    }
  }
  // Reserve original positions before filling gaps, so an early collision doesn't move unrelated stacks.
  for (const item of [...remaining]) {
    if (!result[item.slot]) place(item.slot, remaining.findIndex((entry) => entry.sourceSlot === item.sourceSlot))
  }
  while (remaining.length) place(result.findIndex((item) => item === null), 0)

  for (const [slotKey, override] of Object.entries(settings?.overrides ?? {})) {
    const slot = Number(slotKey)
    if (!/^[0-8]$/.test(slotKey)) throw new Error('Invalid hotbar slot.')
    if (result[slot]?.protected) throw new Error(`${destination.name}: slot ${slot + 1} is a practice control.`)
    if (override === null) { result[slot] = null; continue }
    const limit = stackLimit(override.id)
    if (!limit || !Number.isInteger(override.count) || override.count < 1 || override.count > limit) {
      throw new Error(`${destination.name}, slot ${slot + 1}: choose a valid 1.16.1 item and quantity (1–${limit ?? '?'}).`)
    }
    const previous = result[slot]
    result[slot] = previous?.id === override.id
      ? { ...previous, count: override.count }
      : { slot, id: override.id, count: override.count }
  }
  return result
}

export function unmappedLabels(workspace: Workspace): string[] {
  return [...new Set(workspace.layouts.flatMap((layout) => layout.slots.flatMap((slot) =>
    slot.items.filter((item) => item.custom && !item.minecraftId).map((item) => item.name))))]
}
