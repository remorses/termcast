import { logger } from 'termcast/src/logger'
import { useStore, ToastData } from 'termcast/src/state'
import { PopToRootType } from 'termcast/src/apis/window'

// Re-export PopToRootType from window module
export { PopToRootType } from 'termcast/src/apis/window'

export async function showHUD(
  title: string,
  options?: {
    clearRootSearch?: boolean
    popToRootType?: PopToRootType
  },
): Promise<void> {
  const onHide = () => {
    useStore.setState({ toast: null, toastWithPrimaryAction: false })
  }

  const toastData: ToastData = {
    id: Math.random().toString(36).substring(7),
    title,
    style: 'SUCCESS',
    onHide,
  }

  // Show the HUD component in the toast area (bottom of screen)
  useStore.setState({
    toast: toastData,
    toastWithPrimaryAction: false,
  })

  // HUD auto-hides after 2 seconds
  setTimeout(onHide, 2000)

  // TODO: Handle closeMainWindow behavior with clearRootSearch and popToRootType options
  // This would need to be implemented based on the actual window management system

  logger.log('showHUD:', title, options)

  return Promise.resolve()
}
