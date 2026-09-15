import type { HotbarPlan, ItemRef } from '../types'

interface SlotContents {
  type: 'hotbar-lab/slot'
  version: 1
  flex: boolean
  items: ItemRef[]
}

export function copySlot(plan: HotbarPlan, selected: number | 'offhand'): string {
  const slot = selected === 'offhand' ? undefined : plan.hotbarSlots.find((entry) => entry.slot === selected)
  const contents: SlotContents = {
    type: 'hotbar-lab/slot', version: 1, flex: slot?.flex ?? false,
    items: slot?.items ?? plan.offhandItems ?? [],
  }
  return JSON.stringify(contents)
}

export function pasteSlot(plan: HotbarPlan, selected: number | 'offhand', text: string): HotbarPlan | null {
  try {
    const data = JSON.parse(text) as SlotContents
    if (!data || data.type !== 'hotbar-lab/slot' || data.version !== 1 || typeof data.flex !== 'boolean'
      || !Array.isArray(data.items) || !data.items.every((item) => item && typeof item.id === 'string'
        && typeof item.name === 'string' && typeof item.sprite === 'string'
        && (item.custom === undefined || typeof item.custom === 'boolean')
        && (item.minecraftId === undefined || typeof item.minecraftId === 'string'))) return null
    const items = data.items.map((item): ItemRef => ({
      id: item.id, name: item.name,
      sprite: /^\/assets\/items\/[a-zA-Z0-9_-]+\.(png|svg)$/.test(item.sprite) ? item.sprite : '/assets/items/custom.svg',
      ...(item.custom === undefined ? {} : { custom: item.custom }),
      ...(item.minecraftId === undefined ? {} : { minecraftId: item.minecraftId }),
    }))
    return selected === 'offhand'
      ? { ...plan, isExample: false, offhandItems: items }
      : { ...plan, isExample: false, hotbarSlots: plan.hotbarSlots.map((slot) => slot.slot === selected
        ? { ...slot, flex: plan.flexSpotsEnabled !== false && data.flex,
          items: plan.flexSpotsEnabled === false ? items.slice(0, 1) : items } : slot) }
  } catch {
    return null
  }
}
