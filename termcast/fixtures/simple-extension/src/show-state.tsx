import { Detail, ActionPanel, Action } from "@termcast/cli"
import { useStore } from "@termcast/cli/state"

export default function ShowState() {
  const state = useStore()

  const { devElement, packageJson, ...filteredState } = state

  const stateJson = JSON.stringify(filteredState, null, 2)

  return (
    <Detail
      markdown={`\`\`\`json\n${stateJson}\n\`\`\``}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard content={stateJson} title="Copy state as JSON" />
        </ActionPanel>
      }
    />
  )
}
