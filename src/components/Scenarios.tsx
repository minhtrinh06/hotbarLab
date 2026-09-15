import { ScenarioPicker } from '../Scenarios'
import { blankScenario } from '../data/scenarios'
import { activePlan, deleteLayout } from '../lib/storage'
import { importScenarioContents, layoutFromScenario } from '../lib/scenario-workspace'
import type { ScenarioLibrary, Workspace } from '../types'

export function Scenarios({ workspace, onChange }: { workspace: Workspace; onChange: (workspace: Workspace) => void }) {
  const plan = activePlan(workspace)
  const library: ScenarioLibrary = { version: 1, activeId: workspace.activeLayoutId, defaultId: workspace.defaultLayoutId,
    scenarios: workspace.layouts.map((layout) => ({ id: layout.id, group: layout.group ?? 'custom', playerId: layout.playerId, plan: activePlan(workspace, layout.id) })) }
  const add = (duplicate: boolean) => {
    const scenario = { id: crypto.randomUUID(), group: 'custom' as const, plan: duplicate
      ? { ...structuredClone(plan), name: `${plan.name} (copy)`, isExample: false }
      : blankScenario(plan, 'New scenario') }
    onChange({ ...workspace, activeLayoutId: scenario.id, layouts: [...workspace.layouts, layoutFromScenario(scenario)] })
  }
  return <ScenarioPicker library={library} onSelect={(activeLayoutId) => onChange({ ...workspace, activeLayoutId })}
    onImport={(sourceId) => onChange(importScenarioContents(workspace, sourceId))}
    onNew={() => add(false)} onDuplicate={() => add(true)} onDefault={() => onChange({ ...workspace, defaultLayoutId: workspace.activeLayoutId })}
    onDelete={() => {
      if (window.confirm(`Delete “${plan.name}”? Its destinations will use the default scenario. Exact destination overrides are kept.`)) onChange(deleteLayout(workspace, workspace.activeLayoutId))
    }} />
}
