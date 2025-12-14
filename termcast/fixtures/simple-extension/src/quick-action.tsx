import { showHUD, Clipboard } from '@raycast/api'

export default async function QuickAction() {
  const timestamp = new Date().toISOString()
  await Clipboard.copy(timestamp)
  await showHUD(`Copied: ${timestamp}`)
}
