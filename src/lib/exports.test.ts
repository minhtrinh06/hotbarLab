import { describe, expect, it } from 'vitest'
import { createStarterPlan } from '../data/starter'
import { generateMarkdown, patchStandardSettings, safeFilename } from './exports'

describe('Markdown export', () => {
  it('keeps slot and flex item order', () => {
    const markdown = generateMarkdown(createStarterPlan())
    expect(markdown).toContain('5. **( Z )** Flex: Gold Block | Crafting Table | Bed | Obsidian | Fire Charge')
    expect(markdown.indexOf('1. **( 1 )** Pickaxe')).toBeLessThan(markdown.indexOf('9. **( MB4 )** Flex: Food | Gravel'))
    expect(markdown).not.toContain('Pasted image')
  })

  it('escapes Markdown-sensitive labels', () => {
    const plan = createStarterPlan()
    plan.hotbarSlots[0].items[0].name = 'Pick_axe *test*'
    expect(generateMarkdown(plan)).toContain('Pick\\_axe \\*test\\*')
  })

  it('creates safe filenames', () => {
    expect(safeFilename(' My: Plan / Test ')).toBe('My-Plan-Test')
  })
})

describe('standardsettings patch', () => {
  it('changes supported keys and preserves unrelated settings', () => {
    const plan = createStarterPlan()
    plan.hotbarSlots[0].binding = { display: 'Q', minecraftCode: 'key.keyboard.q', modifiers: [] }
    const source = JSON.stringify({ fov: 100, renderDistance: 5, 'key_key.hotbar.1': 'key.keyboard.1' })
    const result = patchStandardSettings(source, plan)
    const parsed = JSON.parse(result.output)
    expect(parsed.fov).toBe(100)
    expect(parsed.renderDistance).toBe(5)
    expect(parsed['key_key.hotbar.1']).toBe('key.keyboard.q')
    expect(parsed['key_key.hotbar.9']).toBe('key.mouse.5')
  })

  it('rejects malformed and non-object JSON', () => {
    expect(() => patchStandardSettings('{bad', createStarterPlan())).toThrow('not valid JSON')
    expect(() => patchStandardSettings('[]', createStarterPlan())).toThrow('root must be an object')
  })

  it('rejects modifier chords for Minecraft properties', () => {
    const plan = createStarterPlan()
    plan.hotbarSlots[0].binding = { display: 'Shift + 1', minecraftCode: 'key.keyboard.1', modifiers: ['Shift'] }
    expect(() => patchStandardSettings('{}', plan)).toThrow('Slot 1')
  })
})
