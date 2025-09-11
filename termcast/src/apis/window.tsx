export enum PopToRootType {
  Default = 'default',
  Immediate = 'immediate',
  Suspended = 'suspended',
}

interface CloseMainWindowOptions {
  clearRootSearch?: boolean
  popToRootType?: PopToRootType
}

// TODO does not do anything
export async function closeMainWindow({
  clearRootSearch,
  popToRootType = PopToRootType.Default,
}: CloseMainWindowOptions = {}): Promise<void> {
  return
  // try {
  //     const currentPid = process.pid

  //     // On macOS, request accessibility permissions if needed
  //     if (process.platform === 'darwin') {
  //         windowManager.requestAccessibility()
  //     }

  //     // Get all windows
  //     const windows = windowManager.getWindows()

  //     // Find a window that's not the current process
  //     const previousWindow = windows.find((win) => {
  //         try {
  //             if (!win.isVisible) return false
  //             if (overlayWindows.includes(win.getTitle())) return false

  //             return win.processId !== currentPid
  //         } catch {
  //             return false
  //         }
  //     })

  //     if (previousWindow) {
  //         // Bring the previous window to focus
  //         previousWindow.bringToTop()
  //         logger.log(`Switched focus to window: ${previousWindow.getTitle()}`)
  //     } else {
  //         logger.log('No previous window found to focus')
  //     }

  //     // Minimize or hide the current window
  //     // const currentWindow = windowManager.getActiveWindow()
  //     // if (currentWindow) {
  //     //     currentWindow.minimize()
  //     // }

  //     // TODO: Handle clearRootSearch behavior when main window functionality is implemented
  //     // TODO: Handle popToRootType behavior when navigation stack is implemented
  // } catch (error) {
  //     logger.error('Failed to close main window:', error)
  //     throw error
  // }
}
