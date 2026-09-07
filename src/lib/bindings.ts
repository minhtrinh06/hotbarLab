import type { Binding, HotbarPlan } from '../types'

const MODIFIER_ORDER = ['Control', 'Alt', 'Shift', 'Meta']

const KEYBOARD_CODES: Record<string, { display: string; code: string }> = {
  Space: { display: 'Space', code: 'key.keyboard.space' },
  Tab: { display: 'Tab', code: 'key.keyboard.tab' },
  Enter: { display: 'Enter', code: 'key.keyboard.enter' },
  Escape: { display: 'Esc', code: 'key.keyboard.escape' },
  Backquote: { display: '`', code: 'key.keyboard.grave.accent' },
  Minus: { display: '-', code: 'key.keyboard.minus' },
  Equal: { display: '=', code: 'key.keyboard.equal' },
  BracketLeft: { display: '[', code: 'key.keyboard.left.bracket' },
  BracketRight: { display: ']', code: 'key.keyboard.right.bracket' },
  Backslash: { display: '\\', code: 'key.keyboard.backslash' },
  Semicolon: { display: ';', code: 'key.keyboard.semicolon' },
  Quote: { display: "'", code: 'key.keyboard.apostrophe' },
  Comma: { display: ',', code: 'key.keyboard.comma' },
  Period: { display: '.', code: 'key.keyboard.period' },
  Slash: { display: '/', code: 'key.keyboard.slash' },
  ArrowUp: { display: 'Up', code: 'key.keyboard.up' },
  ArrowDown: { display: 'Down', code: 'key.keyboard.down' },
  ArrowLeft: { display: 'Left', code: 'key.keyboard.left' },
  ArrowRight: { display: 'Right', code: 'key.keyboard.right' },
  CapsLock: { display: 'Caps', code: 'key.keyboard.caps.lock' },
  Home: { display: 'Home', code: 'key.keyboard.home' },
  End: { display: 'End', code: 'key.keyboard.end' },
  PageUp: { display: 'Page Up', code: 'key.keyboard.page.up' },
  PageDown: { display: 'Page Down', code: 'key.keyboard.page.down' },
}

const modifierFromCode = (code: string) => {
  if (code.startsWith('Control')) return 'Control'
  if (code.startsWith('Alt')) return 'Alt'
  if (code.startsWith('Shift')) return 'Shift'
  if (code.startsWith('Meta')) return 'Meta'
  return undefined
}

export function keyboardEventToBinding(event: KeyboardEvent): Binding | null {
  if (modifierFromCode(event.code)) return null

  let key = KEYBOARD_CODES[event.code]
  if (event.code.startsWith('Key')) {
    const letter = event.code.slice(3)
    key = { display: letter, code: `key.keyboard.${letter.toLowerCase()}` }
  } else if (event.code.startsWith('Digit')) {
    const digit = event.code.slice(5)
    key = { display: digit, code: `key.keyboard.${digit}` }
  } else if (/^F\d{1,2}$/.test(event.code)) {
    key = { display: event.code, code: `key.keyboard.${event.code.toLowerCase()}` }
  }

  if (!key) {
    const fallback = event.key.length === 1 ? event.key.toUpperCase() : event.key
    key = { display: fallback, code: `key.keyboard.${event.key.toLowerCase().replaceAll(' ', '.')}` }
  }

  const modifiers = [
    event.ctrlKey ? 'Control' : '',
    event.altKey ? 'Alt' : '',
    event.shiftKey ? 'Shift' : '',
    event.metaKey ? 'Meta' : '',
  ].filter(Boolean).sort((a, b) => MODIFIER_ORDER.indexOf(a) - MODIFIER_ORDER.indexOf(b))

  return { display: [...modifiers, key.display].join(' + '), minecraftCode: key.code, modifiers }
}

export function mouseEventToBinding(event: MouseEvent | React.MouseEvent): Binding {
  const number = event.button + 1
  return { display: `MB${number}`, minecraftCode: `key.mouse.${number}`, modifiers: [] }
}

export function bindingSignature(binding: Binding): string {
  if (!binding.display) return ''
  return `${binding.modifiers.join('+')}|${binding.minecraftCode ?? binding.display.toLowerCase()}`
}

export function bindingsMatch(expected: Binding, actual: Binding): boolean {
  return bindingSignature(expected) === bindingSignature(actual)
}

export function isExportableBinding(binding: Binding): boolean {
  return Boolean(binding.display && binding.minecraftCode && binding.modifiers.length === 0)
}

export interface Conflict {
  signature: string
  labels: string[]
  display: string
}

export function findConflicts(plan: HotbarPlan): Conflict[] {
  const seen = new Map<string, { display: string; labels: string[] }>()
  const add = (label: string, binding: Binding) => {
    const signature = bindingSignature(binding)
    if (!signature) return
    const existing = seen.get(signature)
    if (existing) existing.labels.push(label)
    else seen.set(signature, { display: binding.display, labels: [label] })
  }

  plan.hotbarSlots.forEach((slot) => add(`Slot ${slot.slot}`, slot.binding))
  add('Offhand', plan.offhand)
  plan.otherBindings.forEach((entry) => add(entry.label || 'Unnamed action', entry.binding))

  return [...seen.entries()]
    .filter(([, value]) => value.labels.length > 1)
    .map(([signature, value]) => ({ signature, ...value }))
}
