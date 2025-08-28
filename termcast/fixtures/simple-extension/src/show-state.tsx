import { Detail } from "@termcast/api"
import { useStore } from "@termcast/api/state"

export default function ShowState() {
  const state = useStore()
  
  const { devElement, packageJson, ...filteredState } = state
  
  const stateJson = JSON.stringify(filteredState, null, 2)
  
  return <Detail markdown={`\`\`\`json\n${stateJson}\n\`\`\``} />
}