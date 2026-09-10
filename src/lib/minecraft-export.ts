import { Int8, read, write, stringify, type CompoundTag, type NBTData, type Tag } from 'nbtify'
import { unzipSync, zipSync } from 'fflate'
import type { Workspace } from '../types'
import { DESTINATIONS, TEMPLATES, resolveHotbar, type Destination, type ExportTarget, type Stack } from './inventory'

function at(root: unknown, path: (string | number)[]): unknown {
  return path.reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object' || !(key in value)) throw new Error(`Template structure changed at ${path.join('.')}.`)
    return (value as Record<string | number, unknown>)[key]
  }, root)
}

function put(root: unknown, path: (string | number)[], value: unknown) {
  const parent = at(root, path.slice(0, -1)) as Record<string | number, unknown>
  parent[path[path.length - 1]] = value
}

function materialize(stack: Stack, original: CompoundTag[]): CompoundTag {
  const source = stack.sourceSlot === undefined ? undefined : original.find((item) => Number(item.Slot) === stack.sourceSlot)
  return { ...source, id: stack.id, Slot: new Int8(stack.slot), Count: new Int8(stack.count) }
}

export async function verifyTemplate(bytes: Uint8Array, target: ExportTarget) {
  const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer)
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  if (hash !== TEMPLATES[target].sha256) throw new Error('The practice template failed verification. Reload and try again.')
}

function patchDestination(root: unknown, destination: Destination, workspace: Workspace) {
  const original = destination.missing ? [] : at(root, destination.path) as CompoundTag[]
  if (!Array.isArray(original)) throw new Error(`${destination.name}: expected an inventory list.`)
  const resolved = resolveHotbar(destination, workspace)
  const hotbar = resolved.filter((item): item is Stack => item !== null).map((item) => materialize(item, original))
  const other = original.filter((item) => Number(item.Slot) >= 9)
  if (!hotbar.length && destination.missing) return

  if (destination.target === 'mpk') {
    // MPK picks up chest contents. Unique temporary tags prevent merging, and
    // placeholders reserve empty slots until its supported AUTO book applies exact slots.
    const reserved = resolved.map((stack, slot) => {
      const item = stack ? materialize(stack, original) : { id: 'minecraft:barrier', Slot: new Int8(slot), Count: new Int8(1) }
      return { ...item, tag: { ...(item.tag as CompoundTag | undefined), HotbarLabSlot: new Int8(slot) } }
    })
    put(root, destination.path, [...reserved, ...other])
    const barrelItems = at(root, destination.path.slice(0, 5)) as CompoundTag[]
    const bookSlot = Array.from({ length: 27 }, (_, slot) => slot).find((slot) => !barrelItems.some((item) => Number(item.Slot) === slot))
    if (bookSlot === undefined) throw new Error('The MPK barrel has no room for its layout commands.')
    const pages = resolved.map((stack, slot) => {
      const item = stack ? materialize(stack, original) : null
      const tag = item?.tag ? stringify(item.tag as CompoundTag) : ''
      return `replaceitem entity @p hotbar.${slot} ${item?.id ?? 'minecraft:air'}${tag}${item ? ` ${Number(item.Count)}` : ''}`
    })
    barrelItems.push({ id: 'minecraft:writable_book', Count: new Int8(1), Slot: new Int8(bookSlot),
      tag: { display: { Name: '{"text":"AUTO"}', Lore: ['{"text":"Hotbar Lab · exact hotbar slots"}'] }, pages } })
  } else {
    put(root, destination.path, [...hotbar, ...other])
    for (const path of destination.copies) put(root, path, hotbar)
  }
}

export async function exportMinecraft(bytes: Uint8Array, target: ExportTarget, workspace: Workspace,
  progress: (message: string) => void = () => {}): Promise<Uint8Array> {
  progress('Verifying template…')
  await verifyTemplate(bytes, target)
  const destinations = DESTINATIONS.filter((entry) => entry.target === target)
  if (target === 'mpk') {
    const nbt = await read(bytes, { endian: 'big', compression: null })
    for (const destination of destinations) patchDestination(nbt.data, destination, workspace)
    return write(nbt)
  }
  progress('Opening practice map…')
  const files = unzipSync(bytes)
  if (!files['level.dat']) throw new Error('Expected level.dat at the root of the supported map.')
  const documents = new Map<string, NBTData>()
  for (const destination of destinations) {
    progress(`Applying ${destination.name}…`)
    if (!documents.has(destination.file)) {
      if (!files[destination.file]) throw new Error(`Missing map inventory: ${destination.file}`)
      documents.set(destination.file, await read(files[destination.file], { endian: 'big', compression: 'gzip' }))
    }
    patchDestination(documents.get(destination.file)!.data, destination, workspace)
  }
  for (const [file, document] of documents) files[file] = new Uint8Array(await write(document))
  progress('Packing customized world…')
  return zipSync(Object.fromEntries(Object.entries(files).map(([path, data]) => [`Hotbar Lab - MCSR Practice/${path}`, data])), { level: 1 })
}

// Exported for checking the exact typed tags without reducing them to plain JSON.
export function inventoryAt(root: unknown, path: (string | number)[]): Tag | undefined {
  return at(root, path) as Tag | undefined
}
