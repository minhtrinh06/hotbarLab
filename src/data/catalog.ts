import type { ItemRef } from '../types'
import sheetItems from './sheet-items.json'

const sprite = (id: string) => `/assets/items/${id}.png`

const ORIGINAL_ITEMS: ItemRef[] = [
  { id: 'iron-pickaxe', name: 'Pickaxe', sprite: sprite('iron-pickaxe') },
  { id: 'iron-axe', name: 'Axe', sprite: sprite('iron-axe') },
  { id: 'dirt', name: 'Blocks', sprite: sprite('dirt') },
  { id: 'oak-boat', name: 'Boat', sprite: sprite('oak-boat') },
  { id: 'gold-block', name: 'Gold Block', sprite: sprite('gold-block') },
  { id: 'crafting-table', name: 'Crafting Table', sprite: sprite('crafting-table') },
  { id: 'red-bed', name: 'Bed', sprite: sprite('red-bed') },
  { id: 'obsidian', name: 'Obsidian', sprite: sprite('obsidian') },
  { id: 'fire-charge', name: 'Fire Charge', sprite: sprite('fire-charge') },
  { id: 'iron-shovel', name: 'Shovel', sprite: sprite('iron-shovel') },
  { id: 'gold-ingot', name: 'Gold', sprite: sprite('gold-ingot') },
  { id: 'flint-and-steel', name: 'Flint and Steel', sprite: sprite('flint-and-steel') },
  { id: 'fire-resistance', name: 'Fire Res', sprite: sprite('fire-resistance') },
  { id: 'nether-brick', name: 'Nether Brick', sprite: sprite('nether-brick') },
  { id: 'ender-eye', name: 'Eyes', sprite: sprite('ender-eye') },
  { id: 'ender-pearl', name: 'Pearls', sprite: sprite('ender-pearl') },
  { id: 'water-bucket', name: 'Bucket', sprite: sprite('water-bucket') },
  { id: 'cooked-salmon', name: 'Food', sprite: sprite('cooked-salmon') },
  { id: 'gravel', name: 'Gravel', sprite: sprite('gravel') },
]

// Prefer the sheet's inventory renders; retain items absent from its catalogue.
export const ITEM_CATALOG: ItemRef[] = [
  ...ORIGINAL_ITEMS.map((item) => ({ ...item, sprite: sheetItems.find((entry) => entry.id === item.id)?.sprite ?? item.sprite })),
  ...sheetItems.filter((item) => !ORIGINAL_ITEMS.some((entry) => entry.id === item.id)),
]

export function catalogItem(id: string): ItemRef {
  const item = ITEM_CATALOG.find((entry) => entry.id === id)
  if (!item) throw new Error(`Unknown catalogue item: ${id}`)
  return { ...item }
}
