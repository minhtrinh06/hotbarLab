import { exportMinecraft } from './minecraft-export'
import { TEMPLATES, type ExportTarget } from './inventory'
import type { Workspace } from '../types'

self.onmessage = async (event: MessageEvent<{ target: ExportTarget; workspace: Workspace }>) => {
  try {
    const { target, workspace } = event.data
    self.postMessage({ progress: 'Downloading practice template…' })
    const response = await fetch(`${import.meta.env.BASE_URL}templates/${TEMPLATES[target].file}`)
    if (!response.ok) throw new Error('Could not download the practice template. Check your connection and retry.')
    const bytes = await exportMinecraft(new Uint8Array(await response.arrayBuffer()), target, workspace,
      (progress) => self.postMessage({ progress }))
    const buffer = new Uint8Array(bytes).buffer
    self.postMessage({ buffer }, { transfer: [buffer] })
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Could not export this template.' })
  }
}
