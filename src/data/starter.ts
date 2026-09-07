import { catalogItem } from './catalog'
import type { Binding, HotbarPlan, HotbarSlot, OtherBinding } from '../types'

export const key = (display: string, minecraftCode?: string, modifiers: string[] = []): Binding => ({
  display,
  minecraftCode,
  modifiers,
})

const slot = (
  number: HotbarSlot['slot'],
  binding: Binding,
  itemIds: string[],
  flex = false,
): HotbarSlot => ({
  slot: number,
  binding,
  flex,
  items: itemIds.map(catalogItem),
})

const other = (
  id: string,
  label: string,
  binding: Binding,
  jsonProperty?: OtherBinding['jsonProperty'],
): OtherBinding => ({ id, label, binding, enabledInPractice: true, promptType: 'text', jsonProperty })

export function createStarterPlan(): HotbarPlan {
  return {
    version: 1,
    name: 'Example MCSR setup',
    isExample: true,
    hotbarSlots: [
      slot(1, key('1', 'key.keyboard.1'), ['iron-pickaxe']),
      slot(2, key('2', 'key.keyboard.2'), ['iron-axe']),
      slot(3, key('3', 'key.keyboard.3'), ['dirt']),
      slot(4, key('F', 'key.keyboard.f'), ['oak-boat']),
      slot(5, key('Z', 'key.keyboard.z'), ['gold-block', 'crafting-table', 'red-bed', 'obsidian', 'fire-charge'], true),
      slot(6, key('X', 'key.keyboard.x'), ['iron-shovel']),
      slot(7, key('C', 'key.keyboard.c'), ['gold-ingot', 'flint-and-steel', 'fire-resistance', 'nether-brick', 'ender-eye'], true),
      slot(8, key('MB5', 'key.mouse.4'), ['ender-pearl', 'water-bucket'], true),
      slot(9, key('MB4', 'key.mouse.5'), ['cooked-salmon', 'gravel'], true),
    ],
    offhand: key('R', 'key.keyboard.r'),
    otherBindings: [
      other('sprint', 'Sprint Toggle', key('B', 'key.keyboard.b'), 'key_key.sprint'),
      other('pick-block', 'Pick Block', key('Tab', 'key.keyboard.tab'), 'key_key.pickItem'),
      other('wide-macro', 'Wide Macro', key('4', 'key.keyboard.4')),
      other('thin-macro', 'Thin Macro', key('Shift + 4', 'key.keyboard.4', ['Shift'])),
      other('eye-macro', 'Eye Measure Macro', key('5', 'key.keyboard.5')),
      other('overlay', 'NinjaBrain Bot Overlay', key('`', 'key.keyboard.grave.accent')),
      other('eye-left', 'Eye Measure Left', key('[', 'key.keyboard.left.bracket')),
      other('eye-right', 'Eye Measure Right', key(']', 'key.keyboard.right.bracket')),
      other('reset-nbb', 'Reset NinjaBrain Bot', key('Shift + [', 'key.keyboard.left.bracket', ['Shift'])),
    ],
  }
}
