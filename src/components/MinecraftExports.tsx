import { useEffect, useRef, useState } from 'react'
import type { DestinationSettings, ItemOverride, Workspace } from '../types'
import { DESTINATIONS, MINECRAFT_ITEMS, TEMPLATES, defaultDestinationLayout, destinationLayout, itemName, resolveHotbar, stackLimit, unmappedLabels, type ExportTarget, type Stack } from '../lib/inventory'

function SlotOverride({ slot, stack, override, onChange }: {
  slot: number; stack: Stack | null; override: ItemOverride | null | undefined
  onChange: (value: ItemOverride | null | undefined) => void
}) {
  const [id, setId] = useState(override?.id ?? stack?.id ?? 'minecraft:stone')
  const [count, setCount] = useState(override?.count ?? stack?.count ?? 1)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { setId(override?.id ?? stack?.id ?? 'minecraft:stone'); setCount(override?.count ?? stack?.count ?? 1) }, [override, stack?.id, stack?.count])
  return <div className="export-slot" aria-label={`Export slot ${slot + 1}`}>
    <strong>Slot {slot + 1}</strong>
    <span>{stack ? `${stack.label ?? itemName(stack.id)} × ${stack.count}` : 'Empty'}</span>
    {stack?.alternatives && <small>Random choice: {stack.alternatives.map(itemName).join(' / ')}</small>}
    {stack?.potion && <small>{stack.potion.replace('minecraft:', '').replaceAll('_', ' ')}</small>}
    {stack?.special && <small>Original special item data retained</small>}
    {stack?.protected ? <small>Practice control · kept in place</small> : <>
      <small>{override === undefined ? 'Automatic' : override === null ? 'Explicitly empty' : 'Exact override'}</small>
      <div className="slot-actions">
        <button type="button" onClick={() => setEditing(!editing)} aria-expanded={editing}>Customize slot {slot + 1}</button>
        <button type="button" onClick={() => { onChange(null); setEditing(false) }}>Empty</button>
        <button type="button" disabled={override === undefined} onClick={() => { onChange(undefined); setEditing(false) }}>Automatic</button>
      </div>
      {editing && <form onSubmit={(event) => {
        event.preventDefault()
        const normalized = id.startsWith('minecraft:') ? id : `minecraft:${id}`
        const limit = stackLimit(normalized)
        if (!limit || !Number.isInteger(count) || count < 1 || count > limit) { setError(`Choose a valid item and quantity from 1 to ${limit ?? 'its stack limit'}.`); return }
        onChange({ id: normalized, count }); setEditing(false); setError('')
      }}>
        <label>Item ID<input list="minecraft-items" aria-label={`Slot ${slot + 1} item ID`} value={id} onChange={(event) => setId(event.target.value)} /></label>
        <label>Quantity<input type="number" min="1" max={stackLimit(id) ?? 64} step="1" required aria-label={`Slot ${slot + 1} quantity`} value={count} onChange={(event) => setCount(event.target.valueAsNumber)} /></label>
        <button type="submit" className="secondary-button">Apply slot {slot + 1}</button>
        {error && <p role="alert" className="inline-error">{error}</p>}
      </form>}
    </>}
  </div>
}

function ExportPanel({ target, workspace, onChange }: {
  target: ExportTarget; workspace: Workspace; onChange: (workspace: Workspace) => void
}) {
  const destinations = DESTINATIONS.filter((entry) => entry.target === target)
  const [destinationId, setDestinationId] = useState(destinations[0].id)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const worker = useRef<Worker | null>(null)
  useEffect(() => () => worker.current?.terminate(), [])
  // Changing any layout invalidates an in-flight export of the old workspace.
  useEffect(() => { worker.current?.terminate(); worker.current = null; setStatus('') }, [workspace])
  const destination = destinations.find((entry) => entry.id === destinationId)!
  const settings = workspace.destinations[destination.id] ?? { overrides: {} }
  let slots: Array<Stack | null> = []
  let previewError = ''
  try { slots = resolveHotbar(destination, workspace) } catch (error) { previewError = error instanceof Error ? error.message : 'Invalid scenario.' }
  const update = (next: DestinationSettings) => onChange({ ...workspace, destinations: { ...workspace.destinations, [destination.id]: next } })
  const download = () => {
    setError(''); setStatus('Starting export…')
    const task = new Worker(new URL('../lib/export.worker.ts', import.meta.url), { type: 'module' })
    worker.current = task
    task.onerror = () => { setError('The export worker stopped. Please retry.'); setStatus(''); task.terminate(); worker.current = null }
    task.onmessage = (event: MessageEvent<{ progress?: string; error?: string; buffer?: ArrayBuffer }>) => {
      if (event.data.progress) setStatus(event.data.progress)
      if (event.data.error) { setError(event.data.error); setStatus(''); task.terminate(); worker.current = null }
      if (event.data.buffer) {
        const url = URL.createObjectURL(new Blob([event.data.buffer], { type: target === 'mpk' ? 'application/octet-stream' : 'application/zip' }))
        const link = document.createElement('a')
        link.href = url; link.download = target === 'mpk' ? 'hotbar.nbt' : 'Hotbar-Lab-MCSR-Practice.zip'
        link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
        setStatus(''); task.terminate(); worker.current = null
      }
    }
    task.postMessage({ target, workspace })
  }
  return <section className="export-panel minecraft-panel" aria-label={target === 'mpk' ? 'MPK export' : 'Practice map export'}>
    <div className="export-panel-heading"><div>{target === 'mpk' ? <img className="export-barrel-icon" src="/assets/practice/barrel.png" alt="" /> : <span className="file-type">ZIP</span>}<div>
      <h2>{target === 'mpk' ? 'MiniPracticeKit' : 'MCSR Practice Map'}</h2>
      <p>Version {TEMPLATES[target].version} · Minecraft Java 1.16.1 · {destinations.length} destinations</p>
    </div></div></div>
    <label className="field-label">{target === 'mpk' ? 'Preset barrel' : 'Map loadout'}
      <select aria-label={target === 'mpk' ? 'Preset barrel' : 'Map loadout'} value={destinationId} onChange={(event) => setDestinationId(event.target.value)}>
        {destinations.map((entry) => {
          const assigned = destinationLayout(entry, workspace)
          return <option key={entry.id} value={entry.id}>{entry.name} — {assigned?.name}</option>
        })}
      </select>
    </label>
    <label className="field-label">Assigned scenario<select aria-label={`${target} assigned scenario`} value={settings.layoutId ?? ''} onChange={(event) => update({ ...settings, layoutId: event.target.value || undefined })}>
      <option value="">Automatic — {defaultDestinationLayout(destination, workspace)?.name}</option>
      {workspace.layouts.map((layout) => <option key={layout.id} value={layout.id}>{layout.name}</option>)}
    </select></label>
    <p className="field-help">Rearrange supplied hotbar items using the scenario’s priority order. Exact overrides apply to this destination. Other inventory slots and armor are retained.</p>
    {!destination.items.length && <p className="field-help">This saved loadout starts empty. Use Customize to add exact items.</p>}
    {previewError && <p role="alert" className="inline-error">{previewError}</p>}
    <div className="export-slots" key={destinationId}>{slots.map((stack, slot) => <SlotOverride key={slot} slot={slot} stack={stack} override={settings.overrides[slot]} onChange={(override) => {
      const overrides = { ...settings.overrides }
      if (override === undefined) delete overrides[slot]; else overrides[slot] = override
      update({ ...settings, overrides })
    }} />)}</div>
    <button type="button" className="text-button" disabled={!Object.keys(settings.overrides).length} onClick={() => update({ ...settings, overrides: {} })}>Restore automatic placement for this destination</button>
    {target === 'map' && <p className="field-help">Supported: portal, fortress, zero/one-cycle, and bastion saved loadouts. Overworld drills, movement, search crafting, and queue games retain their original behavior. Select a loadout in the map as usual; empty loadouts stay empty until customized.</p>}
    <button type="button" className="primary-button full-button" disabled={!!status || !!previewError} onClick={download}>{target === 'mpk' ? 'Download custom MPK' : 'Download custom practice map'}</button>
    {status && <div role="status">{status} <button type="button" onClick={() => { worker.current?.terminate(); worker.current = null; setStatus('') }}>Cancel export</button></div>}
    {error && <p role="alert" className="inline-error">{error}</p>}
    <p className="field-help">{target === 'mpk'
      ? 'Close Minecraft and back up your existing hotbar.nbt. Put the download in your instance’s .minecraft folder, then load creative saved hotbar 1. Customized barrels use MPK’s AUTO commands to retain exact slots.'
      : 'The base map download is about 93 MB. Extract the ZIP into your instance’s saves folder. Open “Hotbar Lab - MCSR Practice” in Java 1.16.1. Keep level.dat directly inside that world folder.'} <a href={TEMPLATES[target].source} target="_blank" rel="noreferrer">Original project</a></p>
  </section>
}

export function MinecraftExports({ workspace, onChange }: { workspace: Workspace; onChange: (workspace: Workspace) => void }) {
  const unmapped = unmappedLabels(workspace)
  return <>
    <datalist id="minecraft-items">{MINECRAFT_ITEMS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</datalist>
    {unmapped.length > 0 && <p className="notice" role="status">Text-only preferences have no Minecraft item mapping and are ignored: {unmapped.join(', ')}. Map them in the slot editor.</p>}
    <div className="minecraft-export-grid">
      <ExportPanel target="mpk" workspace={workspace} onChange={onChange} />
      <ExportPanel target="map" workspace={workspace} onChange={onChange} />
    </div>
  </>
}
