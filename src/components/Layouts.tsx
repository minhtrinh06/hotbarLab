import type { Workspace } from '../types'
import { deleteLayout } from '../lib/storage'

export function Layouts({ workspace, onChange }: { workspace: Workspace; onChange: (workspace: Workspace) => void }) {
  const active = workspace.layouts.find((layout) => layout.id === workspace.activeLayoutId)!
  const add = (duplicate: boolean) => {
    const id = crypto.randomUUID()
    const layout = { ...structuredClone(active), id, name: duplicate ? `${active.name} copy` : 'New layout', isExample: false }
    if (!duplicate) layout.slots = layout.slots.map((slot) => ({ ...slot, items: [], flex: false }))
    onChange({ ...workspace, activeLayoutId: id, layouts: [...workspace.layouts, layout] })
  }
  return <section className="layout-toolbar" aria-label="Saved layouts">
    <label>Saved layout <select aria-label="Saved layout" value={active.id} onChange={(event) => onChange({ ...workspace, activeLayoutId: event.target.value })}>
      {workspace.layouts.map((layout) => <option key={layout.id} value={layout.id}>{layout.name}{workspace.defaultLayoutId === layout.id ? ' (default)' : ''}</option>)}
    </select></label>
    <button type="button" className="secondary-button" onClick={() => add(false)}>New layout</button>
    <button type="button" className="secondary-button" onClick={() => add(true)}>Duplicate layout</button>
    <button type="button" className="secondary-button" disabled={active.id === workspace.defaultLayoutId} onClick={() => onChange({ ...workspace, defaultLayoutId: active.id })}>Make default</button>
    <button type="button" className="text-button" disabled={workspace.layouts.length === 1} onClick={() => {
      if (window.confirm(`Delete “${active.name}”? Its destinations will use the default layout. Exact destination overrides are kept.`)) onChange(deleteLayout(workspace, active.id))
    }}>Delete layout</button>
    <p className="field-help">Rename above. All layouts share keybinds. Unassigned practice presets use your default layout.</p>
  </section>
}
