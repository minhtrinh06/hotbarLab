import { useEffect, useRef, useState } from 'react'
import { catalogItem } from './data/catalog'
import { PLAYER_TEMPLATES, scenarioLabel, TEMPLATE_SOURCE, type PlayerHotbar, type PlayerTemplate } from './data/scenarios'
import type { SavedScenario, ScenarioLibrary } from './types'

const GROUPS = [
  { id: 'main', label: 'Main hotbar', description: 'Your full item pool' },
  { id: 'basic', label: 'Basics', description: '12 essential scenarios' },
  { id: 'advanced', label: 'Advanced', description: '27 more situations' },
  { id: 'player', label: 'Imported players', description: 'Your editable copies' },
  { id: 'custom', label: 'Custom', description: 'Your own scenarios' },
]

export function ScenarioPicker({ library, onSelect, onImport, onNew, onDuplicate, onDefault, onDelete }: {
  library: ScenarioLibrary; onSelect: (id: string) => void; onNew: () => void;
  onImport: (id: string) => void;
  onDuplicate: () => void; onDefault: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState<'choose' | 'import' | null>(null)
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const root = useRef<HTMLElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const importTrigger = useRef<HTMLButtonElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const current = library.scenarios.find((scenario) => scenario.id === library.activeId)!
  const close = () => { setOpen(null); (open === 'import' ? importTrigger : trigger).current?.focus() }
  useEffect(() => {
    if (!open) return
    search.current?.focus()
    const dismiss = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(null) }
    window.addEventListener('pointerdown', dismiss)
    return () => window.removeEventListener('pointerdown', dismiss)
  }, [open])
  const matches = library.scenarios.filter((scenario) => (open !== 'import' || scenario.id !== current.id)
    && `${scenario.plan.name} ${scenario.group}`.toLowerCase().includes(query.toLowerCase()))
  const choose = (scenario: SavedScenario) => {
    if (open === 'import') {
      onImport(scenario.id)
      setMessage(`Imported items and Flex settings from ${scenario.plan.name} into ${current.plan.name}.`)
    } else { onSelect(scenario.id); setMessage('') }
    close()
  }
  return <section className="scenario-toolbar workspace-scenarios" aria-label="Scenarios" ref={root} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(null) }}>
    <div className="scenario-picker">
      <span className="field-label">Scenarios</span>
      <button ref={trigger} className={`scenario-trigger ${open === 'choose' ? 'is-open' : ''}`} type="button" aria-expanded={open === 'choose'} aria-controls="scenario-popover" aria-haspopup="dialog" onClick={() => { setOpen(open === 'choose' ? null : 'choose'); setQuery('') }}>
        <span><small>{current.group === 'main' ? 'MAIN HOTBAR' : current.group.toUpperCase()}</small><strong>{current.plan.name}</strong></span><span aria-hidden="true">⌄</span>
      </button>
      {open && <div id="scenario-popover" className="scenario-popover" role="dialog" aria-label={open === 'import' ? 'Import from another scenario' : 'Choose scenario'} onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close() }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('.scenario-option'))
          const index = options.indexOf(document.activeElement as HTMLButtonElement)
          options[(index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length]?.focus()
        }
      }}>
        {open === 'import' && <p className="scenario-import-help">Choose a source to replace all hotbar and offhand items in <strong>{current.plan.name}</strong>, including empty slots. Your scenario name and keybinds stay the same.</p>}
        <div className="scenario-search"><span aria-hidden="true">⌕</span><input ref={search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a scenario…" aria-label="Find a scenario" /></div>
        <div className="scenario-options">
          {GROUPS.map((group) => {
            const entries = matches.filter((scenario) => scenario.group === group.id)
            if (!entries.length) return null
            return <section key={group.id} aria-label={group.label} className="scenario-group"><div className="scenario-group-heading"><h3>{group.label}</h3><span>{group.description}</span></div>
              {entries.map((scenario) => <button className={`scenario-option ${scenario.id === current.id ? 'is-active' : ''}`} key={scenario.id} type="button" aria-current={scenario.id === current.id ? 'true' : undefined} onClick={() => choose(scenario)}>
                {scenario.playerId && <img src={`/assets/players/${scenario.playerId}.png`} alt="" />}<span>{scenario.plan.name}</span>{scenario.id === library.defaultId && <small>Default</small>}<b aria-hidden="true">{scenario.id === current.id ? '✓' : ''}</b>
              </button>)}
            </section>
          })}
          {!matches.length && <p className="empty-state">No matching scenarios.</p>}
        </div>
        <div className="scenario-popover-footer">Changes save automatically on this device.</div>
      </div>}
    </div>
    <div className="scenario-actions"><button className="secondary-button" onClick={onNew}>+ New scenario</button><button className="secondary-button" onClick={onDuplicate}>Duplicate</button><button ref={importTrigger} type="button" className="secondary-button" aria-expanded={open === 'import'} aria-controls="scenario-popover" aria-haspopup="dialog" disabled={library.scenarios.length < 2} onClick={() => { setOpen(open === 'import' ? null : 'import'); setQuery('') }}>Import from another scenario</button><button className="text-button" disabled={current.id === library.defaultId} onClick={onDefault}>{current.id === library.defaultId ? 'Default scenario' : 'Make default'}</button><button className="text-button danger-text" disabled={current.group === 'main'} onClick={onDelete}>Delete scenario</button></div>
    <p className="scenario-help">Rename above. Scenarios share keybinds. Practice presets automatically use the matching scenario, or your default when no match is available.</p>
    {message && <p className="scenario-help" role="status">{message}</p>}
  </section>
}

export function PlayerTemplates({ onImport }: { onImport: (player: PlayerTemplate, scenarios: PlayerHotbar[], useKeys: boolean) => void }) {
  const [playerId, setPlayerId] = useState(PLAYER_TEMPLATES[0].id)
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [useKeys, setUseKeys] = useState(false)
  const [message, setMessage] = useState('')
  const player = PLAYER_TEMPLATES.find((entry) => entry.id === playerId)!
  const scenario = player.scenarios[scenarioIndex]
  const hasKeys = player.keys.some(Boolean)
  const doImport = (all: boolean) => {
    const scenarios = all ? player.scenarios : [scenario]
    onImport(player, scenarios, useKeys)
    setMessage(`Imported ${scenarios.length} ${scenarios.length === 1 ? 'scenario' : 'scenarios'} from ${player.name}. Find your copies under Imported players.`)
  }
  return <section className="player-templates" aria-labelledby="player-templates-title">
    <div className="section-title-row"><div><span className="eyebrow">LEARN FROM THE RUNNERS</span><h2 id="player-templates-title">Pro player templates</h2></div><a href={TEMPLATE_SOURCE} target="_blank" rel="noreferrer">View source sheet ↗</a></div>
    <p className="muted">Explore their hotbars, then import an editable copy with your keys or theirs.</p>
    <div className="player-grid" role="group" aria-label="Pro players">{PLAYER_TEMPLATES.map((entry) => <button type="button" className={`player-card ${entry.id === playerId ? 'is-active' : ''}`} key={entry.id} aria-pressed={entry.id === playerId} onClick={() => { setPlayerId(entry.id); setScenarioIndex(0); setUseKeys(false); setMessage('') }}><img src={`/assets/players/${entry.id}.png`} alt="" /><span><strong>{entry.name}</strong><small>{entry.scenarios.length} scenarios{entry.legacy ? ' · Legacy' : ''}</small></span></button>)}</div>
    <div className="player-preview">
      <div className="player-scenarios" role="group" aria-label={`${player.name} scenarios`}>{player.scenarios.map((entry, i) => <button key={entry.id} type="button" aria-pressed={i === scenarioIndex} className={i === scenarioIndex ? 'is-active' : ''} onClick={() => setScenarioIndex(i)}>{scenarioLabel(entry.name)}</button>)}</div>
      <div className="player-preview-main"><div className="preview-heading"><h3>{scenarioLabel(scenario.name)}</h3><span>{player.name}</span></div>
        <div className="preview-hotbar" aria-label={`${player.name} hotbar preview`}>{scenario.slots.map((items, i) => <div className="preview-slot" key={i}><small>{i + 1}</small>{items.length ? <img src={catalogItem(items[0]).sprite} alt={catalogItem(items[0]).name} title={catalogItem(items[0]).name} /> : <span aria-label="Empty slot">—</span>}<kbd>{player.keys[i] || '—'}</kbd></div>)}</div>
        {scenario.offhand.length > 0 && <div className="preview-offhand"><span>Offhand</span>{scenario.offhand.map((id) => <img key={id} src={catalogItem(id).sprite} alt={catalogItem(id).name} title={catalogItem(id).name} />)}</div>}
        <div className="player-import-controls"><label className="switch-label"><input type="checkbox" checked={useKeys} disabled={!hasKeys} onChange={(event) => setUseKeys(event.target.checked)} /><span>Use player keybinds</span></label><span className="field-help">{hasKeys ? (useKeys ? 'Updates shared hotbar and offhand keys for all scenarios.' : 'Keeps your current keybinds.') : 'Keybinds not recorded. Your keys are kept.'}</span><div className="import-buttons"><button className="secondary-button" onClick={() => doImport(false)}>Import this scenario</button><button className="primary-button" onClick={() => doImport(true)}>Import all {player.scenarios.length}</button></div></div>
        <p className="player-source-note">{player.legacy ? 'Legacy snapshot: the sheet labels Infume’s template “old.” ' : ''}{player.id === 'lowkey' ? 'The sheet notes that Lowkey’s template may not be updated after March 13. ' : ''}Sheet snapshots may differ from current play. Combined icons represent the sheet’s item alternatives.</p>
      </div>
    </div>
    {message && <p className="import-message" role="status">✓ {message}</p>}
  </section>
}
