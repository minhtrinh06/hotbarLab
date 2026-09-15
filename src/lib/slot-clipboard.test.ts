import { expect, it } from 'vitest'
import { createStarterPlan } from '../data/starter'
import { copySlot, pasteSlot } from './slot-clipboard'

it('copies independent item pools and custom mappings while retaining the destination key', () => {
  const plan = createStarterPlan()
  plan.hotbarSlots[4].items.push({ id: 'custom-one', name: 'My block', sprite: '/assets/items/custom.svg', custom: true, minecraftId: 'minecraft:dirt' })
  const result = pasteSlot(plan, 1, copySlot(plan, 5))!
  expect(result.hotbarSlots[0]).toEqual({ ...plan.hotbarSlots[0], flex: true, items: plan.hotbarSlots[4].items })
  expect(result.offhand).toBe(plan.offhand)
  expect(result.otherBindings).toBe(plan.otherBindings)
  result.hotbarSlots[0].items[0].name = 'Changed'
  expect(plan.hotbarSlots[4].items[0].name).not.toBe('Changed')
  expect(result.isExample).toBe(false)
})

it('supports offhand and copying empty slots', () => {
  const plan = createStarterPlan()
  const offhand = pasteSlot(plan, 'offhand', copySlot(plan, 1))!
  expect(offhand.offhandItems).toEqual(plan.hotbarSlots[0].items)
  expect(pasteSlot(plan, 2, copySlot(offhand, 'offhand'))!.hotbarSlots[1].items).toEqual(offhand.offhandItems)
  const cleared = pasteSlot(plan, 5, copySlot(plan, 'offhand'))!
  expect(cleared.hotbarSlots[4]).toEqual({ ...plan.hotbarSlots[4], flex: false, items: [] })
})

it('respects a disabled scenario-wide flex setting when pasting a pool', () => {
  const source = createStarterPlan()
  const destination = { ...source, flexSpotsEnabled: false }
  const result = pasteSlot(destination, 1, copySlot(source, 5))!
  expect(result.flexSpotsEnabled).toBe(false)
  expect(result.hotbarSlots[0]).toEqual({ ...destination.hotbarSlots[0], flex: false, items: source.hotbarSlots[4].items.slice(0, 1) })
})

it('ignores unrelated or malformed clipboard data and sanitizes external sprite URLs', () => {
  const plan = createStarterPlan()
  for (const text of ['hello', 'null', '{}', '{', JSON.stringify({ type: 'hotbar-lab/slot', version: 1, flex: true, items: [null] })]) {
    expect(pasteSlot(plan, 1, text)).toBeNull()
  }
  const data = JSON.parse(copySlot(plan, 1))
  data.items[0].sprite = 'https://example.com/tracker.png'
  expect(pasteSlot(plan, 1, JSON.stringify(data))!.hotbarSlots[0].items[0].sprite).toBe('/assets/items/custom.svg')
})
