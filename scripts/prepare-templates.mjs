// Regenerate preview metadata after deliberately updating the pinned templates.
// Usage: node scripts/prepare-templates.mjs /path/to/1.16.1/items.json
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { read } from 'nbtify'
import { unzipSync } from 'fflate'

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const mpk = readFileSync('public/templates/mpk-0.6.nbt')
const map = readFileSync('public/templates/mcsr-2.0.0.zip')
const files = unzipSync(map)
const destinations = []
const label = (text) => { try { return JSON.parse(text).text ?? text } catch { return text } }
function add(id, target, name, file, path, items, copies = []) {
  destinations.push({ id, target, name, file, path, copies, missing: items === undefined, items: (items ?? []).map((item) => ({
    slot: Number(item.Slot), id: item.id, count: Number(item.Count),
    ...(item.tag?.Potion ? { potion: item.tag.Potion } : {}),
    ...(item.tag ? { special: true } : {}),
    ...(file === 'data/command_storage_inventory.dat' && item.tag?.BlockEntityTag?.Items
      ? { alternatives: [...new Set(item.tag.BlockEntityTag.Items.map((choice) => choice.id))] } : {}),
    ...(item.id === 'minecraft:egg'
      ? { protected: true, label: label(item.tag?.display?.Name ?? 'Practice reset egg') } : {}),
  })).filter((item) => item.slot < 9) })
}
const nbt = (await read(mpk)).data
nbt['0'].forEach((barrel, index) => {
  if (barrel.id !== 'minecraft:barrel') return
  const chest = barrel.tag.BlockEntityTag.Items.findIndex((item) => item.id === 'minecraft:chest')
  add(`mpk:${index}`, 'mpk', label(barrel.tag.display.Name), 'mpk-0.6.nbt',
    ['0', index, 'tag', 'BlockEntityTag', 'Items', chest, 'tag', 'BlockEntityTag', 'Items'],
    barrel.tag.BlockEntityTag.Items[chest].tag.BlockEntityTag.Items)
})
for (const [namespace, group] of [['portal', 'Portal'], ['inventory', 'Fortress'], ['zero_practice_loadouts', 'Zero / One Cycle'], ['minecraft', 'Bastion']]) {
  const file = `data/command_storage_${namespace}.dat`
  const contents = (await read(files[file])).data.data.contents
  const base = ['data', 'contents']
  if (namespace === 'portal') {
    contents.levels.levels.forEach((level, index) => add(`map:portal:${level.name}`, 'map', `${group} · ${label(level.text)}`, file,
      [...base, 'levels', 'levels', index, 'loadout', 'hotbar'], level.loadout.hotbar))
  } else if (namespace === 'minecraft') {
    for (let i = 1; i <= 3; i++) add(`map:bastion:${i}`, 'map', `${group} · Loadout ${i}`, file,
      [...base, `loadout.${i}`, 'hotbar'], contents[`loadout.${i}`].hotbar)
  } else {
    contents.loadouts.loadouts.forEach((loadout, index) => add(`map:${namespace}:${index}`, 'map', `${group} · ${label(loadout.name)}`, file,
      [...base, 'loadouts', 'loadouts', index, 'hotbar'], loadout.hotbar,
      Number(loadout.selected) === 1 ? [[...base, 'loadouts', 'selected', 'hotbar']] : []))
  }
}
writeFileSync('src/data/templates.json', JSON.stringify({
  templates: {
    mpk: { file: 'mpk-0.6.nbt', sha256: hash(mpk), source: 'https://github.com/Knawk/mc-MiniPracticeKit', version: '0.6' },
    map: { file: 'mcsr-2.0.0.zip', sha256: hash(map), source: 'https://github.com/Dibedy/The-MCSR-Practice-Map/releases/tag/latest', version: '2.0.0' },
  }, destinations,
}, null, 2) + '\n')
if (process.argv[2]) {
  const items = JSON.parse(readFileSync(process.argv[2], 'utf8'))
  writeFileSync('src/data/minecraft-items.json', JSON.stringify(items.map(({ name, displayName, stackSize }) =>
    ({ id: `minecraft:${name}`, name: displayName, stackSize }))) + '\n')
}
