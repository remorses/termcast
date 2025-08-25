import Cocoa
import Carbon.HIToolbox

class AppDelegate: NSObject, NSApplicationDelegate {
    private var statusItem: NSStatusItem!
    private var isOverlayActive = false
    private var clickMonitor: Any?
    private let bundleID = "com.mitchellh.ghostty"
    private var permissionTimer: Timer?
    private var permissionStatusItem: NSMenuItem?
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        print("App launched!")
        
        // Create menu bar icon first
        setupStatusBarItem()
        
        // Check permissions and start polling
        checkAndRequestPermissions()
        startPermissionPolling()
        
        // Setup hotkey
        setupHotkey()
        
        print("Ready! Use Cmd+Space or menu to toggle Ghostty overlay")
    }
    
    func checkAndRequestPermissions() {
        let trusted = AXIsProcessTrusted()
        print("Accessibility trusted: \(trusted)")
        updatePermissionStatus(trusted)
        
        if !trusted {
            // Just trigger the system prompt, no custom alert
            let options: NSDictionary = [
                kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true
            ]
            AXIsProcessTrustedWithOptions(options)
        }
    }
    
    func startPermissionPolling() {
        // Poll every 2 seconds to check if permissions were granted
        permissionTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { [weak self] _ in
            let trusted = AXIsProcessTrusted()
            self?.updatePermissionStatus(trusted)
            
            if trusted {
                print("Permissions granted! Stopping polling.")
                self?.permissionTimer?.invalidate()
                self?.permissionTimer = nil
            }
        }
    }
    
    func updatePermissionStatus(_ trusted: Bool) {
        if let statusItem = permissionStatusItem {
            if trusted {
                statusItem.title = "✅ Permissions Granted"
            } else {
                statusItem.title = "⚠️ Need Accessibility Permission"
            }
        }
    }
    
    func setupStatusBarItem() {
        print("Setting up status bar item")
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        
        if let button = statusItem.button {
            button.title = "👻"
            button.toolTip = "Ghostty Overlay"
        }
        
        updateMenu()
        print("Status bar item created")
    }
    
    func updateMenu() {
        let menu = NSMenu()
        
        let toggleItem = NSMenuItem(title: "Toggle Ghostty Overlay", action: #selector(toggleGhosttyOverlay), keyEquivalent: " ")
        toggleItem.keyEquivalentModifierMask = [.command]
        toggleItem.target = self
        menu.addItem(toggleItem)
        
        menu.addItem(NSMenuItem.separator())
        
        // Permission status
        let trusted = AXIsProcessTrusted()
        let statusTitle = trusted ? "✅ Permissions Granted" : "⚠️ Need Accessibility Permission"
        permissionStatusItem = NSMenuItem(title: statusTitle, action: #selector(checkPermissionStatus), keyEquivalent: "")
        permissionStatusItem?.target = self
        menu.addItem(permissionStatusItem!)
        
        menu.addItem(NSMenuItem.separator())
        
        let quitItem = NSMenuItem(title: "Quit", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        menu.addItem(quitItem)
        
        statusItem.menu = menu
    }
    
    @objc func checkPermissionStatus() {
        let trusted = AXIsProcessTrusted()
        
        if trusted {
            let alert = NSAlert()
            alert.messageText = "Permissions OK"
            alert.informativeText = "Accessibility permissions are properly configured!"
            alert.alertStyle = .informational
            alert.runModal()
        } else {
            // Open settings
            if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility") {
                NSWorkspace.shared.open(url)
            }
        }
    }
    
    func setupHotkey() {
        print("Setting up global hotkey monitor for Cmd+Space")
        NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { [weak self] event in
            // Check for Cmd+Space (keyCode 49 is Space)
            if event.modifierFlags.contains(.command) && !event.modifierFlags.contains([.option, .control, .shift]) && event.keyCode == 49 {
                print("Global hotkey Cmd+Space detected!")
                DispatchQueue.main.async {
                    self?.toggleGhosttyOverlay()
                }
            }
        }
        
        // Also monitor when app is active
        NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            if event.modifierFlags.contains(.command) && !event.modifierFlags.contains([.option, .control, .shift]) && event.keyCode == 49 {
                print("Local hotkey Cmd+Space detected!")
                self?.toggleGhosttyOverlay()
                return nil // Consume event
            }
            return event
        }
    }
    
    @objc func toggleGhosttyOverlay() {
        print("Toggling Ghostty overlay")
        
        // Re-check permissions each time
        let trusted = AXIsProcessTrusted()
        print("Current permission status: \(trusted)")
        
        if !trusted {
            // Just trigger the system prompt
            let options: NSDictionary = [
                kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true
            ]
            AXIsProcessTrustedWithOptions(options)
            return  // Don't proceed without permissions
        }
        
        let runningApps = NSRunningApplication.runningApplications(withBundleIdentifier: bundleID)
        
        if isOverlayActive {
            // Hide Ghostty
            print("Hiding Ghostty")
            if let app = runningApps.first {
                app.hide()
            }
            isOverlayActive = false
            removeClickMonitor()
        } else {
            // Show and position Ghostty
            showGhosttyOverlay()
        }
    }
    
    func showGhosttyOverlay() {
        print("Showing Ghostty overlay")
        
        // Check if Ghostty is already running
        let runningApps = NSRunningApplication.runningApplications(withBundleIdentifier: bundleID)
        
        if let runningApp = runningApps.first {
            // Ghostty is already running, just show and position it
            print("Ghostty already running, showing it")
            runningApp.unhide()
            runningApp.activate(options: [])
            
            // Still position it in case it moved
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                self.positionGhosttyWindow(app: runningApp)
            }
        } else {
            // Launch Ghostty with geometry argument
            if let appURL = NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleID) {
                print("Found Ghostty at: \(appURL.path)")
                
                // Get screen dimensions for centering
                guard let screen = NSScreen.main else { return }
                let screenFrame = screen.frame
                
                // Ghostty uses character columns and rows, not pixels
                // Typical terminal: 120 columns x 34 rows
                let columns = 120
                let rows = 34
                
                // Estimate pixel dimensions (roughly 7.5px per column, 20px per row)
                let estimatedWidth: CGFloat = CGFloat(columns) * 7.5
                let estimatedHeight: CGFloat = CGFloat(rows) * 20
                
                // Calculate center position
                let x = Int(screenFrame.origin.x + (screenFrame.width - estimatedWidth) / 2)
                let y = Int(screenFrame.origin.y + (screenFrame.height - estimatedHeight) / 2)
                
                // Launch with correct Ghostty arguments
                let process = Process()
                process.executableURL = appURL.appendingPathComponent("Contents/MacOS/ghostty")
                process.arguments = [
                    "--window-width=\(columns)",
                    "--window-height=\(rows)",
                    "--window-position-x=\(x)",
                    "--window-position-y=\(y)"
                ]
                
                do {
                    try process.run()
                    print("Launched Ghostty with width=\(columns) height=\(rows) at position (\(x), \(y))")
                    
                    // Mark overlay as active
                    isOverlayActive = true
                    setupClickMonitor()
                    
                    // No need to position window since we set geometry
                } catch {
                    print("Error launching Ghostty with Process: \(error)")
                    // Fallback to regular launch
                    fallbackLaunchGhostty()
                }
            } else {
                print("Ghostty not found")
                let alert = NSAlert()
                alert.messageText = "Ghostty Not Found"
                alert.informativeText = "Could not find Ghostty application"
                alert.runModal()
            }
        }
    }
    
    func fallbackLaunchGhostty() {
        // Fallback method using NSWorkspace
        if let appURL = NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleID) {
            let config = NSWorkspace.OpenConfiguration()
            config.activates = true
            
            NSWorkspace.shared.openApplication(at: appURL, configuration: config) { [weak self] (app, error) in
                if let error = error {
                    print("Error opening Ghostty: \(error)")
                } else if let app = app {
                    print("Ghostty opened via fallback, PID: \(app.processIdentifier)")
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        self?.positionGhosttyWindow(app: app)
                    }
                }
            }
        }
    }
    
    func positionGhosttyWindow(app: NSRunningApplication) {
        print("Positioning Ghostty window")
        
        // Get the AX element for the app
        let axApp = AXUIElementCreateApplication(app.processIdentifier)
        
        // Try to get the focused window
        var focusedWindow: CFTypeRef?
        var windows: CFTypeRef?
        
        // First try to get focused window
        if AXUIElementCopyAttributeValue(axApp, kAXFocusedWindowAttribute as CFString, &focusedWindow) == .success,
           let window = focusedWindow {
            positionWindow(window as! AXUIElement)
            return
        }
        
        // Otherwise get first window
        if AXUIElementCopyAttributeValue(axApp, kAXWindowsAttribute as CFString, &windows) == .success,
           let windowList = windows as? [AXUIElement],
           let firstWindow = windowList.first {
            positionWindow(firstWindow)
        }
    }
    
    func positionWindow(_ window: AXUIElement) {
        guard let screen = NSScreen.main else { return }
        
        let screenFrame = screen.frame
        let width: CGFloat = 900
        let height: CGFloat = 600
        
        // Center position
        let x = screenFrame.origin.x + (screenFrame.width - width) / 2
        let y = screenFrame.origin.y + (screenFrame.height - height) / 2
        
        var position = CGPoint(x: x, y: y)
        var size = CGSize(width: width, height: height)
        
        // Set size
        let sizeValue = AXValueCreate(.cgSize, &size)!
        AXUIElementSetAttributeValue(window, kAXSizeAttribute as CFString, sizeValue)
        
        // Set position
        let posValue = AXValueCreate(.cgPoint, &position)!
        AXUIElementSetAttributeValue(window, kAXPositionAttribute as CFString, posValue)
        
        // Raise window
        AXUIElementPerformAction(window, kAXRaiseAction as CFString)
        
        print("Window positioned at (\(x), \(y)) with size \(width)x\(height)")
        
        isOverlayActive = true
        setupClickMonitor()
    }
    
    func setupClickMonitor() {
        removeClickMonitor()
        
        print("Setting up click monitor")
        clickMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown]) { [weak self] event in
            guard let self = self, self.isOverlayActive else { return }
            
            // Check if click is outside Ghostty
            DispatchQueue.main.async {
                if let frontApp = NSWorkspace.shared.frontmostApplication,
                   frontApp.bundleIdentifier != self.bundleID {
                    print("Click detected outside Ghostty, hiding")
                    self.hideGhostty()
                }
            }
        }
    }
    
    func removeClickMonitor() {
        if let monitor = clickMonitor {
            NSEvent.removeMonitor(monitor)
            clickMonitor = nil
            print("Click monitor removed")
        }
    }
    
    func hideGhostty() {
        if let app = NSRunningApplication.runningApplications(withBundleIdentifier: bundleID).first {
            app.hide()
        }
        isOverlayActive = false
        removeClickMonitor()
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return false
    }
}