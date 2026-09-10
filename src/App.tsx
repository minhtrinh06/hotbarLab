import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ITEM_CATALOG } from './data/catalog'
import { Layouts } from './components/Layouts'
import { MinecraftExports } from './components/MinecraftExports'
import { MINECRAFT_ITEMS } from './lib/inventory'
import { bindingSignature, bindingsMatch, findConflicts, keyboardEventToBinding, mouseEventToBinding } from './lib/bindings'
import { generateMarkdown, patchStandardSettings, safeFilename, type JsonPatchResult } from './lib/exports'
import { buildPromptPool, makeSequence, practiceSummary } from './lib/practice'
import { activePlan, createWorkspace, loadWorkspace, saveWorkspace, updateActivePlan, WORKSPACE_KEY } from './lib/storage'
import type { Binding, HotbarPlan, HotbarSlot, ItemRef, OtherBinding, PracticePrompt, PracticeResult, Workspace } from './types'

type View = 'plan' | 'practice' | 'export'

const EMPTY_BINDING: Binding = { display: '', modifiers: [] }

function MiniIcon({ name }: { name: 'grid' | 'target' | 'export' | 'reset' | 'warning' | 'download' }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
    target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/></>,
    export: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v4h16v-4"/></>,
    reset: <><path d="M4 7v5h5"/><path d="M5.5 11a7 7 0 1 1 1.2 6.6"/></>,
    warning: <><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17h.01"/></>,
    download: <><path d="M12 4v11M7 10l5 5 5-5"/><path d="M4 19h16"/></>,
  }
  return <svg className="mini-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function ItemImage({ item, className = '' }: { item: ItemRef; className?: string }) {
  return <img className={`item-sprite ${className}`} src={item.sprite} alt="" draggable={false} onError={(event) => { event.currentTarget.src = '/assets/items/custom.svg' }} />
}

function KeyCapture({ binding, onChange, compact = false }: { binding: Binding; onChange: (binding: Binding) => void; compact?: boolean }) {
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    if (!capturing) return
    const keydown = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'Escape') { setCapturing(false); return }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        onChange(EMPTY_BINDING)
        setCapturing(false)
        return
      }
      const next = keyboardEventToBinding(event)
      if (next) { onChange(next); setCapturing(false) }
    }
    const mousedown = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      onChange(mouseEventToBinding(event))
      setCapturing(false)
    }
    window.addEventListener('keydown', keydown, true)
    window.addEventListener('mousedown', mousedown, true)
    return () => {
      window.removeEventListener('keydown', keydown, true)
      window.removeEventListener('mousedown', mousedown, true)
    }
  }, [capturing, onChange])

  return (
    <button
      type="button"
      className={`key-capture ${capturing ? 'is-capturing' : ''} ${compact ? 'is-compact' : ''}`}
      onClick={() => setCapturing(true)}
      aria-label={capturing ? 'Press a key or mouse button' : `Change binding ${binding.display || 'unassigned'}`}
    >
      {capturing ? 'Press key…' : binding.display || 'Set key'}
    </button>
  )
}

function ConflictNotice({ plan, context }: { plan: HotbarPlan; context: 'plan' | 'practice' | 'export' }) {
  const conflicts = useMemo(() => findConflicts(plan), [plan])
  if (!conflicts.length) return null
  return (
    <div className="notice warning-notice" role="status">
      <MiniIcon name="warning" />
      <div>
        <strong>{conflicts.length} binding {conflicts.length === 1 ? 'conflict' : 'conflicts'}</strong>
        <span>{conflicts.map((conflict) => `${conflict.display}: ${conflict.labels.join(' / ')}`).join(' · ')}{context !== 'plan' ? ' — check these before continuing.' : ''}</span>
      </div>
    </div>
  )
}

function Hotbar({ plan, selected, onSelect }: { plan: HotbarPlan; selected: number | 'offhand'; onSelect: (slot: number | 'offhand') => void }) {
  return (
    <div className="hotbar-scroll" aria-label="Minecraft hotbar planner">
      <div className="hotbar-wrap">
        <button className={`offhand-slot ${selected === 'offhand' ? 'is-selected' : ''}`} onClick={() => onSelect('offhand')} type="button">
          <span className="slot-number">F</span>
          <span className="offhand-mark">↔</span>
          <span className="slot-key">{plan.offhand.display || '—'}</span>
          <span className="slot-tooltip">Offhand · {plan.offhand.display || 'Unbound'}</span>
        </button>
        <div className="hotbar">
          {plan.hotbarSlots.map((slot) => {
            const primary = slot.items[0]
            const title = `${slot.flex ? 'Flex · ' : ''}${slot.items.map((item) => item.name).join(' / ') || 'Empty'} · ${slot.binding.display || 'Unbound'}`
            return (
              <button
                className={`hotbar-slot ${selected === slot.slot ? 'is-selected' : ''}`}
                key={slot.slot}
                onClick={() => onSelect(slot.slot)}
                type="button"
                aria-label={`Edit slot ${slot.slot}: ${title}`}
              >
                <span className="slot-number">{slot.slot}</span>
                {slot.flex && <span className="flex-mark">FLEX</span>}
                {primary ? <ItemImage item={primary} /> : <span className="empty-slot">+</span>}
                {slot.items.length > 1 && <span className="stack-count">{slot.items.length}</span>}
                <span className="slot-key">{slot.binding.display || '—'}</span>
                <span className="slot-tooltip">{title}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SlotEditor({ plan, selected, onPlan }: { plan: HotbarPlan; selected: number | 'offhand'; onPlan: (plan: HotbarPlan) => void }) {
  const [search, setSearch] = useState('')
  const [customName, setCustomName] = useState('')
  const slot = selected === 'offhand' ? undefined : plan.hotbarSlots.find((entry) => entry.slot === selected)

  useEffect(() => { setSearch(''); setCustomName('') }, [selected])

  const updateSlot = (update: (slot: HotbarSlot) => HotbarSlot) => {
    if (!slot) return
    onPlan({ ...plan, isExample: false, hotbarSlots: plan.hotbarSlots.map((entry) => entry.slot === slot.slot ? update(entry) : entry) })
  }

  const addItem = (item: ItemRef) => updateSlot((current) => ({ ...current, items: [...current.items, { ...item }], flex: current.flex || current.items.length > 0 }))
  const moveItem = (index: number, direction: -1 | 1) => updateSlot((current) => {
    const items = [...current.items]
    const target = index + direction
    if (target < 0 || target >= items.length) return current
    ;[items[index], items[target]] = [items[target], items[index]]
    return { ...current, items }
  })

  if (selected === 'offhand') {
    return (
      <aside className="editor-panel">
        <div className="panel-heading"><span className="eyebrow">SPECIAL BIND</span><h2>Offhand</h2></div>
        <p className="muted">Swap the held item with your offhand. This exports as <code>key_key.swapOffhand</code>.</p>
        <label className="field-label">Assigned key</label>
        <KeyCapture binding={plan.offhand} onChange={(binding) => onPlan({ ...plan, isExample: false, offhand: binding })} />
        <p className="field-help">Escape cancels. Backspace clears. Mouse buttons are captured as separate display labels and Minecraft codes.</p>
      </aside>
    )
  }

  if (!slot) return null
  const available = ITEM_CATALOG.filter((item) => !slot.items.some((assigned) => assigned.id === item.id) && item.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <aside className="editor-panel">
      <div className="panel-heading slot-editor-heading">
        <div><span className="eyebrow">HOTBAR SLOT</span><h2>Slot {slot.slot}</h2></div>
        <label className="switch-label"><input type="checkbox" checked={slot.flex} onChange={(event) => updateSlot((current) => ({ ...current, flex: event.target.checked }))} /><span>Flex</span></label>
      </div>
      <label className="field-label">Assigned key</label>
      <KeyCapture binding={slot.binding} onChange={(binding) => updateSlot((current) => ({ ...current, binding }))} />

      <div className="field-header"><label className="field-label">Assigned items</label><span>{slot.items.length}</span></div>
      <div className="assigned-list">
        {slot.items.length === 0 && <p className="empty-state">No items yet. Add one from the catalogue.</p>}
        {slot.items.map((item, index) => (
          <div className="assigned-item" key={`${item.id}-${index}`}>
            <ItemImage item={item} />
            <input
              value={item.name}
              aria-label={`Item ${index + 1} name`}
              onChange={(event) => updateSlot((current) => ({ ...current, items: current.items.map((entry, itemIndex) => itemIndex === index ? { ...entry, name: event.target.value } : entry) }))}
            />
            {item.custom && <select aria-label={`Minecraft item for ${item.name}`} value={item.minecraftId ?? ''} onChange={(event) => updateSlot((current) => ({ ...current, items: current.items.map((entry, itemIndex) => itemIndex === index ? { ...entry, minecraftId: event.target.value || undefined } : entry) }))}>
              <option value="">Text only</option>{MINECRAFT_ITEMS.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </select>}
            <div className="row-actions">
              <button type="button" disabled={index === 0} aria-label={`Move ${item.name} up`} onClick={() => moveItem(index, -1)}>↑</button>
              <button type="button" disabled={index === slot.items.length - 1} aria-label={`Move ${item.name} down`} onClick={() => moveItem(index, 1)}>↓</button>
              <button type="button" className="danger-text" aria-label={`Remove ${item.name}`} onClick={() => updateSlot((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))}>×</button>
            </div>
          </div>
        ))}
      </div>

      <div className="catalogue-block">
        <label className="field-label" htmlFor="catalogue-search">Add from catalogue</label>
        <input id="catalogue-search" className="search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search MCSR items" />
        <div className="catalogue-grid">
          {available.slice(0, 8).map((item) => (
            <button type="button" key={item.id} onClick={() => addItem(item)} title={`Add ${item.name}`}><ItemImage item={item} /><span>{item.name}</span></button>
          ))}
          {!available.length && <p className="empty-state">No matching unassigned items.</p>}
        </div>
      </div>

      <div className="custom-item-row">
        <input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Custom item or action" aria-label="Custom item name" />
        <button type="button" disabled={!customName.trim()} onClick={() => {
          addItem({ id: `custom-${crypto.randomUUID()}`, name: customName.trim(), sprite: '/assets/items/custom.svg', custom: true })
          setCustomName('')
        }}>Add</button>
      </div>
    </aside>
  )
}

function OtherBindings({ plan, onPlan }: { plan: HotbarPlan; onPlan: (plan: HotbarPlan) => void }) {
  const update = (id: string, patch: Partial<OtherBinding>) => onPlan({
    ...plan,
    isExample: false,
    otherBindings: plan.otherBindings.map((entry) => entry.id === id ? { ...entry, ...patch } : entry),
  })
  const move = (index: number, direction: -1 | 1) => {
    const otherBindings = [...plan.otherBindings]
    const target = index + direction
    if (target < 0 || target >= otherBindings.length) return
    ;[otherBindings[index], otherBindings[target]] = [otherBindings[target], otherBindings[index]]
    onPlan({ ...plan, isExample: false, otherBindings })
  }
  return (
    <section className="other-section">
      <div className="section-title-row">
        <div><span className="eyebrow">BEYOND THE HOTBAR</span><h2>Other bindings</h2></div>
        <button className="secondary-button" type="button" onClick={() => onPlan({
          ...plan,
          isExample: false,
          otherBindings: [...plan.otherBindings, { id: crypto.randomUUID(), label: 'New action', binding: EMPTY_BINDING, enabledInPractice: true, promptType: 'text' }],
        })}>+ Add action</button>
      </div>
      <div className="other-list">
        {plan.otherBindings.map((entry, index) => (
          <div className="other-row" key={entry.id}>
            <label className="practice-toggle" title="Include in practice"><input type="checkbox" checked={entry.enabledInPractice} onChange={(event) => update(entry.id, { enabledInPractice: event.target.checked })} /><span className="sr-only">Include {entry.label} in practice</span></label>
            <input className="action-name" value={entry.label} aria-label={`Action ${index + 1} name`} onChange={(event) => update(entry.id, { label: event.target.value })} />
            {entry.jsonProperty && <span className="standard-badge" title={`Exports to ${entry.jsonProperty}`}>STANDARD</span>}
            <KeyCapture compact binding={entry.binding} onChange={(binding) => update(entry.id, { binding })} />
            <div className="row-actions">
              <button type="button" disabled={index === 0} aria-label={`Move ${entry.label} up`} onClick={() => move(index, -1)}>↑</button>
              <button type="button" disabled={index === plan.otherBindings.length - 1} aria-label={`Move ${entry.label} down`} onClick={() => move(index, 1)}>↓</button>
              <button type="button" className="danger-text" aria-label={`Delete ${entry.label}`} onClick={() => onPlan({ ...plan, isExample: false, otherBindings: plan.otherBindings.filter((item) => item.id !== entry.id) })}>×</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function PlanView({ plan, onPlan }: { plan: HotbarPlan; onPlan: (plan: HotbarPlan) => void }) {
  const [selected, setSelected] = useState<number | 'offhand'>(5)
  return (
    <main className="view-shell">
      <ConflictNotice plan={plan} context="plan" />
      <div className="planner-grid">
        <section className="hotbar-stage">
          <div className="stage-copy"><span className="eyebrow">CURRENT LAYOUT</span><h1>Build your muscle memory.</h1><p>Choose a slot to edit its key and item pool.</p></div>
          <Hotbar plan={plan} selected={selected} onSelect={setSelected} />
          <div className="hotbar-legend"><span><i className="legend-key" /> Key</span><span><i className="legend-flex" /> Flex pool</span><span>Click any slot to edit</span></div>
        </section>
        <SlotEditor plan={plan} selected={selected} onPlan={onPlan} />
      </div>
      <OtherBindings plan={plan} onPlan={onPlan} />
    </main>
  )
}

function PracticeView({ plan }: { plan: HotbarPlan }) {
  const pool = useMemo(() => buildPromptPool(plan), [plan])
  const [included, setIncluded] = useState<Set<string>>(() => new Set(pool.map((prompt) => prompt.id)))
  const [sessionLength, setSessionLength] = useState(20)
  const [phase, setPhase] = useState<'setup' | 'countdown' | 'running' | 'feedback' | 'results'>('setup')
  const [countdown, setCountdown] = useState(3)
  const [sequence, setSequence] = useState<PracticePrompt[]>([])
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<PracticeResult[]>([])
  const [feedback, setFeedback] = useState<{ correct: boolean; entered: string } | null>(null)
  const startedAt = useRef(0)

  useEffect(() => {
    setIncluded((current) => new Set(pool.filter((prompt) => current.has(prompt.id) || ![...current].some((id) => pool.some((candidate) => candidate.id === id))).map((prompt) => prompt.id)))
  }, [pool])

  const selectedPool = pool.filter((prompt) => included.has(prompt.id))
  const current = sequence[index]

  const start = () => {
    if (!selectedPool.length) return
    setSequence(makeSequence(selectedPool, sessionLength))
    setResults([])
    setIndex(0)
    setCountdown(3)
    setFeedback(null)
    setPhase('countdown')
  }

  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown === 0) {
      setPhase('running')
      startedAt.current = performance.now()
      return
    }
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 650)
    return () => window.clearTimeout(timer)
  }, [phase, countdown])

  const answer = useCallback((binding: Binding) => {
    if (phase !== 'running' || !current) return
    const reactionMs = Math.max(1, Math.round(performance.now() - startedAt.current))
    const correct = bindingsMatch(current.binding, binding)
    const result = { prompt: current, correct, reactionMs, entered: binding.display }
    setResults((entries) => [...entries, result])
    setFeedback({ correct, entered: binding.display })
    setPhase('feedback')
    window.setTimeout(() => {
      if (index + 1 >= sequence.length) setPhase('results')
      else {
        setIndex((value) => value + 1)
        startedAt.current = performance.now()
        setFeedback(null)
        setPhase('running')
      }
    }, 420)
  }, [current, index, phase, sequence.length])

  useEffect(() => {
    if (phase !== 'running') return
    const keydown = (event: KeyboardEvent) => {
      event.preventDefault()
      const binding = keyboardEventToBinding(event)
      if (binding) answer(binding)
    }
    const mousedown = (event: MouseEvent) => {
      event.preventDefault()
      answer(mouseEventToBinding(event))
    }
    window.addEventListener('keydown', keydown, true)
    window.addEventListener('mousedown', mousedown, true)
    return () => {
      window.removeEventListener('keydown', keydown, true)
      window.removeEventListener('mousedown', mousedown, true)
    }
  }, [answer, phase])

  if (phase === 'countdown') return <main className="practice-arena centered-arena"><span className="eyebrow">GET READY</span><div className="countdown-number">{countdown || 'GO'}</div><p>Use the exact key shown in your plan.</p></main>

  if ((phase === 'running' || phase === 'feedback') && current) {
    return (
      <main className={`practice-arena centered-arena ${feedback ? (feedback.correct ? 'answer-correct' : 'answer-wrong') : ''}`}>
        <div className="practice-progress"><span>{index + 1} / {sequence.length}</span><i style={{ width: `${((index + 1) / sequence.length) * 100}%` }} /></div>
        <span className="eyebrow">{current.sourceLabel}</span>
        {current.sprite ? <img className="practice-sprite" src={current.sprite} alt={current.label} /> : <div className="text-prompt">{current.label}</div>}
        {current.sprite && <h1 className="practice-label">{current.label}</h1>}
        <p className="practice-hint">{feedback ? (feedback.correct ? `${feedback.entered} · correct` : `${feedback.entered} · expected ${current.binding.display}`) : 'Press the assigned key'}</p>
      </main>
    )
  }

  if (phase === 'results') {
    const summary = practiceSummary(results)
    return (
      <main className="view-shell results-view">
        <div className="results-heading"><span className="eyebrow">SESSION COMPLETE</span><h1>{summary.accuracy}% accuracy</h1><p>{results.filter((result) => result.correct).length} of {results.length} prompts correct.</p></div>
        <div className="metric-grid">
          <div><span>Median</span><strong>{summary.median}<small>ms</small></strong></div>
          <div><span>Best</span><strong>{summary.best}<small>ms</small></strong></div>
          <div><span>Slowest</span><strong>{summary.slowest}<small>ms</small></strong></div>
          <div><span>Most missed</span><strong className="metric-text">{summary.mostMissed}</strong></div>
        </div>
        <section className="results-table-wrap"><div className="section-title-row"><div><span className="eyebrow">BREAKDOWN</span><h2>By binding</h2></div><button className="primary-button" type="button" onClick={() => setPhase('setup')}>Practice again</button></div>
          <table className="results-table"><thead><tr><th>Binding</th><th>Correct</th><th>Median</th></tr></thead><tbody>{summary.grouped.map((group) => <tr key={group.label}><td>{group.label}</td><td>{group.correct}/{group.total}</td><td>{group.median} ms</td></tr>)}</tbody></table>
        </section>
      </main>
    )
  }

  return (
    <main className="view-shell practice-setup">
      <ConflictNotice plan={plan} context="practice" />
      <div className="practice-header"><div><span className="eyebrow">REACTION TRAINER</span><h1>Test the layout before the run.</h1><p>Every flex item maps back to its hotbar key.</p></div><button className="primary-button start-button" type="button" disabled={!selectedPool.length} onClick={start}>Start session <span>→</span></button></div>
      <section className="session-settings"><div><span className="field-label">Session length</span><div className="segmented">{[10, 20, 50].map((length) => <button type="button" className={sessionLength === length ? 'is-active' : ''} key={length} onClick={() => setSessionLength(length)}>{length}</button>)}</div></div><div className="selected-count"><strong>{selectedPool.length}</strong><span>prompts active</span></div></section>
      <section className="prompt-picker">
        <div className="section-title-row"><div><span className="eyebrow">PROMPT POOL</span><h2>Choose what to drill</h2></div><div className="text-actions"><button type="button" onClick={() => setIncluded(new Set(pool.map((prompt) => prompt.id)))}>Select all</button><button type="button" onClick={() => setIncluded(new Set())}>Clear</button></div></div>
        <div className="prompt-grid">{pool.map((prompt) => <label className={`prompt-card ${included.has(prompt.id) ? 'is-active' : ''}`} key={prompt.id}><input type="checkbox" checked={included.has(prompt.id)} onChange={() => setIncluded((currentSet) => { const next = new Set(currentSet); if (next.has(prompt.id)) next.delete(prompt.id); else next.add(prompt.id); return next })} />{prompt.sprite ? <img src={prompt.sprite} alt="" /> : <span className="text-glyph">Aa</span>}<span><strong>{prompt.label}</strong><small>{prompt.sourceLabel} · {prompt.binding.display || 'Unbound'}</small></span></label>)}</div>
      </section>
    </main>
  )
}

function downloadFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function ExportView({ plan, workspace, onWorkspace }: { plan: HotbarPlan; workspace: Workspace; onWorkspace: (workspace: Workspace) => void }) {
  const generated = useMemo(() => generateMarkdown(plan), [plan])
  const [markdown, setMarkdown] = useState(generated)
  const [jsonSource, setJsonSource] = useState('')
  const [jsonName, setJsonName] = useState('standardsettings.json')
  const [jsonResult, setJsonResult] = useState<JsonPatchResult | null>(null)
  const [jsonError, setJsonError] = useState('')

  useEffect(() => setMarkdown(generated), [generated])
  useEffect(() => {
    if (!jsonSource) return
    try { setJsonResult(patchStandardSettings(jsonSource, plan)); setJsonError('') }
    catch (error) { setJsonResult(null); setJsonError(error instanceof Error ? error.message : 'Could not patch settings.') }
  }, [jsonSource, workspace.bindings])

  const readJson = async (file?: File) => {
    setJsonResult(null)
    setJsonError('')
    if (!file) return
    setJsonName(file.name)
    try { const source = await file.text(); setJsonSource(source); setJsonResult(patchStandardSettings(source, plan)) }
    catch (error) { setJsonError(error instanceof Error ? error.message : 'Could not read this file.') }
  }

  return (
    <main className="view-shell export-view">
      <ConflictNotice plan={plan} context="export" />
      <div className="export-heading"><span className="eyebrow">TAKE IT WITH YOU</span><h1>Export without the cleanup.</h1><p>Exports are generated locally. Practice templates download on demand; your layouts stay in this browser.</p></div>
      <MinecraftExports workspace={workspace} onChange={onWorkspace} />
      <div className="export-grid">
        <section className="export-panel">
          <div className="export-panel-heading"><div><span className="file-type">MD</span><div><h2>Markdown plan</h2><p>Ready for Obsidian, GitHub, or any notes app.</p></div></div><button className="primary-button" type="button" onClick={() => downloadFile(markdown, `${safeFilename(plan.name)}.md`, 'text/markdown')}><MiniIcon name="download" /> Download</button></div>
          <label className="field-label" htmlFor="markdown-preview">Editable preview</label>
          <textarea id="markdown-preview" className="code-preview" value={markdown} onChange={(event) => setMarkdown(event.target.value)} spellCheck={false} />
          {markdown !== generated && <button className="text-button" type="button" onClick={() => setMarkdown(generated)}>Reset preview to current plan</button>}
        </section>
        <section className="export-panel json-panel">
          <div className="export-panel-heading"><div><span className="file-type json">JSON</span><div><h2>Standard settings</h2><p>Patch keybinds while preserving every other setting.</p></div></div></div>
          <label className="file-drop">
            <input type="file" accept=".json,application/json" onChange={(event) => void readJson(event.target.files?.[0])} />
            <span className="upload-mark">＋</span><strong>Choose standardsettings.json</strong><small>Processed on this device only</small>
          </label>
          {jsonError && <div className="inline-error" role="alert"><MiniIcon name="warning" />{jsonError}</div>}
          {jsonResult && <>
            <div className="diff-heading"><span className="field-label">Changes</span><span>{jsonResult.changes.length} fields</span></div>
            <div className="diff-list">{jsonResult.changes.length ? jsonResult.changes.map((change) => <div className="diff-row" key={change.property}><code>{change.property}</code><span className="before">{String(change.before ?? 'missing')}</span><span className="arrow">→</span><span className="after">{change.after}</span></div>) : <p className="empty-state">This file already matches the plan.</p>}</div>
            <button className="primary-button full-button" type="button" onClick={() => downloadFile(jsonResult.output, `${jsonName.replace(/\.json$/i, '')}.hotkeys.json`, 'application/json')}><MiniIcon name="download" /> Download patched copy</button>
          </>}
        </section>
      </div>
    </main>
  )
}

export default function App() {
  const [initial] = useState(() => {
    try { return { workspace: loadWorkspace(), error: '' } }
    catch (error) { return { workspace: createWorkspace(), error: error instanceof Error ? error.message : 'Could not read saved layouts.' } }
  })
  const [workspace, setWorkspace] = useState(initial.workspace)
  const [readError, setReadError] = useState(initial.error)
  const [saveError, setSaveError] = useState('')
  const plan = activePlan(workspace)
  const setPlan = (next: HotbarPlan) => setWorkspace((current) => updateActivePlan(current, next))
  const [view, setView] = useState<View>('plan')
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved')
  const [resetOpen, setResetOpen] = useState(false)

  useEffect(() => {
    if (readError) return
    setSaveState('saving')
    try { saveWorkspace(workspace); setSaveState('saved'); setSaveError('') }
    catch { setSaveError('Browser storage is full or unavailable. Changes have not been saved. Keep this tab open and free storage before continuing.') }
  }, [workspace, readError])

  const setCurrentPlan = (next: HotbarPlan) => setPlan(next)
  const views: Array<{ id: View; label: string; icon: 'grid' | 'target' | 'export' }> = [
    { id: 'plan', label: 'Plan', icon: 'grid' },
    { id: 'practice', label: 'Practice', icon: 'target' },
    { id: 'export', label: 'Export', icon: 'export' },
  ]

  if (readError) return <main className="view-shell"><h1>Saved layouts need attention</h1><p role="alert">{readError}</p>
    <button type="button" className="secondary-button" onClick={() => downloadFile(localStorage.getItem(WORKSPACE_KEY) ?? '', 'hotbar-lab-storage-backup.json', 'application/json')}>Download storage backup</button>
    <button type="button" className="danger-button" onClick={() => { if (window.confirm('Reset unreadable saved layouts? Download a backup first.')) { setWorkspace(createWorkspace()); setReadError('') } }}>Reset saved layouts</button>
  </main>

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setView('plan') }}><span className="brand-cube"><i /></span><span>HOTBAR <b>LAB</b></span></a>
        <div className="plan-identity"><input value={plan.name} aria-label="Plan name" onChange={(event) => setPlan({ ...plan, name: event.target.value, isExample: false })} /><span className={`save-status ${saveState}`}>{saveError ? 'Not saved' : saveState === 'saved' ? 'Saved locally' : 'Saving…'}</span>{plan.isExample && <span className="example-badge">EXAMPLE</span>}</div>
        <nav className="main-nav" aria-label="Main views">{views.map((item) => <button type="button" key={item.id} className={view === item.id ? 'is-active' : ''} onClick={() => setView(item.id)}><MiniIcon name={item.icon} />{item.label}</button>)}</nav>
        <button className="reset-button" type="button" onClick={() => setResetOpen(true)}><MiniIcon name="reset" /><span>Reset</span></button>
      </header>

      {saveError && <p className="notice inline-error" role="alert">{saveError}</p>}
      {view !== 'practice' && <Layouts workspace={workspace} onChange={setWorkspace} />}
      {view === 'plan' && <PlanView plan={plan} onPlan={setCurrentPlan} />}
      {view === 'practice' && <PracticeView key={workspace.activeLayoutId} plan={plan} />}
      {view === 'export' && <ExportView plan={plan} workspace={workspace} onWorkspace={setWorkspace} />}

      <footer className="footer"><span>HOTBAR LAB · MINECRAFT 1.16</span><span>Local-only · No account · No uploads</span></footer>

      {resetOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setResetOpen(false) }}><div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title"><span className="dialog-mark"><MiniIcon name="reset" /></span><h2 id="reset-title">Reset all layouts?</h2><p>This restores the example layout and shared bindings. All saved layouts, assignments, and exact overrides will be replaced.</p><div className="dialog-actions"><button className="secondary-button" type="button" onClick={() => setResetOpen(false)}>Cancel</button><button className="danger-button" type="button" onClick={() => { setWorkspace(createWorkspace()); setResetOpen(false); setView('plan') }}>Reset plan</button></div></div></div>}
    </div>
  )
}
