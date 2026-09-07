import { describe, expect, it } from 'vitest'
import { createStarterPlan } from '../data/starter'
import { bindingsMatch } from './bindings'
import { buildPromptPool, makeSequence, median, practiceSummary } from './practice'

describe('practice engine', () => {
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
