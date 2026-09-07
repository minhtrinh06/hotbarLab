import type { HotbarPlan, SupportedJsonProperty } from '../types'
import { isExportableBinding } from './bindings'

export function escapeMarkdown(value: string): string {
  return value.replace(/([\\`*_[\]<>])/g, '\\$1')
}

export function generateMarkdown(plan: HotbarPlan): string {
  const lines = ['# Hot Bar', '']
  if (plan.offhand.display) lines.push(`**( ${escapeMarkdown(plan.offhand.display)} )** Offhand`)

  plan.hotbarSlots.forEach((slot) => {
    if (!slot.items.length && !slot.binding.display) return
    const names = slot.items.map((item) => escapeMarkdown(item.name)).join(' | ')
    const prefix = slot.flex && slot.items.length > 1 ? 'Flex: ' : ''
    const key = slot.binding.display ? ` **( ${escapeMarkdown(slot.binding.display)} )**` : ''
    lines.push(`${slot.slot}.${key} ${prefix}${names || 'Unassigned'}`)
  })

  const other = plan.otherBindings.filter((entry) => entry.label || entry.binding.display)
  if (other.length) {
    lines.push('', '# The Rest', '')
    other.forEach((entry) => {
      const key = entry.binding.display ? `**( ${escapeMarkdown(entry.binding.display)} )** ` : ''
      lines.push(`${key}${escapeMarkdown(entry.label || 'Unnamed action')}`)
    })
  }

  return `${lines.join('\n').trim()}\n`
}

export interface JsonChange {
  property: SupportedJsonProperty
  before: unknown
  after: string
}

export interface JsonPatchResult {
  output: string
  changes: JsonChange[]
}

export function patchStandardSettings(source: string, plan: HotbarPlan): JsonPatchResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(source)
  } catch {
    throw new Error('This file is not valid JSON. Choose an unmodified standardsettings.json file.')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('The JSON root must be an object.')
  }

  const object = parsed as Record<string, unknown>
  const updates: Array<[SupportedJsonProperty, string]> = []
  for (const slot of plan.hotbarSlots) {
    if (!isExportableBinding(slot.binding)) {
      throw new Error(`Slot ${slot.slot} needs a single Minecraft-compatible key before export.`)
    }
    updates.push([`key_key.hotbar.${slot.slot}`, slot.binding.minecraftCode!])
  }

  if (plan.offhand.display) {
    if (!isExportableBinding(plan.offhand)) throw new Error('Offhand needs a single Minecraft-compatible key before export.')
    updates.push(['key_key.swapOffhand', plan.offhand.minecraftCode!])
  }

  for (const entry of plan.otherBindings) {
    if (!entry.jsonProperty || !entry.binding.display) continue
    if (!isExportableBinding(entry.binding)) {
      throw new Error(`${entry.label} needs a single Minecraft-compatible key before export.`)
    }
    updates.push([entry.jsonProperty, entry.binding.minecraftCode!])
  }

  const changes: JsonChange[] = updates
    .filter(([property, value]) => object[property] !== value)
    .map(([property, value]) => ({ property, before: object[property], after: value }))

  updates.forEach(([property, value]) => { object[property] = value })
  return { output: `${JSON.stringify(object, null, 2)}\n`, changes }
}

export function safeFilename(name: string): string {
  const result = name.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').replace(/\s+/g, '-').replace(/\.+$/g, '')
  return result || 'hotbar-plan'
}
