import { describe, expect, it } from 'vitest'
import { createStarterPlan } from '../data/starter'
import { bindingsMatch } from './bindings'
import { buildPromptPool, makeSequence, median, practiceSummary } from './practice'

describe('practice engine', () => {
  it('groups slot items and built-in actions without depending on editable labels', () => {
    const plan = createStarterPlan()
    plan.otherBindings.forEach((action) => { action.label = 'Renamed action' })
    const pool = buildPromptPool(plan)
    expect(pool.filter((prompt) => prompt.group === 'hotbar')).toHaveLength(19)
    expect(pool.filter((prompt) => prompt.group === 'minecraft').map((prompt) => prompt.id)).toEqual(['offhand', 'other-sprint', 'other-pick-block'])
    expect(pool.filter((prompt) => prompt.group === 'macros')).toHaveLength(3)
    expect(pool.filter((prompt) => prompt.group === 'ninjabrain')).toHaveLength(4)
    expect(pool.every((prompt) => prompt.sprite)).toBe(true)
    expect(pool.find((prompt) => prompt.id === 'other-eye-macro')?.sprite).toBe(pool.find((prompt) => prompt.id === 'other-thin-macro')?.sprite)
  })

  it('keeps custom actions available and respects disabled or unbound actions and custom item cues', () => {
    const plan = createStarterPlan()
    plan.otherBindings[0].enabledInPractice = false
    plan.otherBindings[1].binding.display = ''
    plan.otherBindings[2].promptType = 'item'
    plan.otherBindings[2].itemId = 'ender-eye'
    plan.otherBindings.push({ id: 'custom', label: 'Custom action', binding: plan.offhand, promptType: 'text', enabledInPractice: true })
    const pool = buildPromptPool(plan)
    expect(pool.some((prompt) => prompt.id === 'other-sprint')).toBe(false)
    expect(pool.some((prompt) => prompt.id === 'other-pick-block')).toBe(false)
    expect(pool.find((prompt) => prompt.id === 'other-custom')?.group).toBe('other')
    expect(pool.find((prompt) => prompt.id === 'other-wide-macro')?.sprite).toBe('/assets/items/ender-eye.png')
    expect(pool.find((prompt) => prompt.id === 'other-wide-macro')?.spriteStyle).toBeUndefined()
  })

  it('maps every flex item back to its parent binding', () => {
    const pool = buildPromptPool(createStarterPlan())
    const craftingTable = pool.find((prompt) => prompt.label === 'Crafting Table')!
    expect(craftingTable.sourceLabel).toBe('Slot 5')
    expect(bindingsMatch(craftingTable.binding, { display: 'Z', minecraftCode: 'key.keyboard.z', modifiers: [] })).toBe(true)
  })

  it('avoids immediate repeats', () => {
    const pool = buildPromptPool(createStarterPlan()).slice(0, 3)
    const sequence = makeSequence(pool, 20, () => 0)
    sequence.slice(1).forEach((prompt, index) => expect(prompt.id).not.toBe(sequence[index].id))
  })

  it('calculates reaction stats', () => {
    const prompt = buildPromptPool(createStarterPlan())[0]
    const summary = practiceSummary([
      { prompt, correct: true, reactionMs: 200, entered: '1' },
      { prompt, correct: false, reactionMs: 400, entered: '2' },
    ])
    expect(summary.accuracy).toBe(50)
    expect(summary.median).toBe(300)
    expect(summary.mostMissed).toBe(prompt.label)
    expect(median([10, 30, 20])).toBe(20)
  })
})
