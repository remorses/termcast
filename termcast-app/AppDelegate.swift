import Cocoa
import Carbon.HIToolbox

class AppDelegate: NSObject, NSApplicationDelegate {
    private var statusItem: NSStatusItem!
    private var isOverlayActive = false
    private var clickMonitor: Any?
    private let bundleID = "com.mitchellh.ghostty"
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        print("App launched!")
        
        // Check permissions
        checkAndRequestPermissions()
        
        // Create menu bar icon
        setupStatusBarItem()
        
        // Setup hotkey
        setupHotkey()
        
        print("Ready! Use Cmd+Space to toggle Ghostty overlay")
    }
    
    func checkAndRequestPermissions() {
        let trusted = AXIsProcessTrusted()
        print("Accessibility trusted: \(trusted)")
        
        if !trusted {
            // Just trigger the system prompt, no custom alert
            let options: NSDictionary = [
                kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true
            ]
            AXIsProcessTrustedWithOptions(options)
        }
    }
    
    func setupStatusBarItem() {
        print("Setting up status bar item")
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        
        if let button = statusItem.button {
            button.title = "👻"
            button.toolTip = "Ghostty Overlay"
        }
        
        let menu = NSMenu()
        
        let toggleItem = NSMenuItem(title: "Toggle Ghostty Overlay", action: #selector(toggleGhosttyOverlay), keyEquivalent: " ")
        toggleItem.keyEquivalentModifierMask = [.command]
        toggleItem.target = self
        menu.addItem(toggleItem)
        
        menu.addItem(NSMenuItem.separator())
        
        let quitItem = NSMenuItem(title: "Quit", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        menu.addItem(quitItem)
        
        statusItem.menu = menu
        print("Status bar item created")
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
        
        // Check permissions
        let trusted = AXIsProcessTrusted()
        print("Current permission status: \(trusted)")
        
        if !trusted {
            // Just trigger the system prompt
            let options: NSDictionary = [
                kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true
            ]
            AXIsProcessTrustedWithOptions(options)
            return
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
        
        // Launch or activate Ghostty
        if let appURL = NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleID) {
            print("Found Ghostty at: \(appURL.path)")
            
            let config = NSWorkspace.OpenConfiguration()
            config.activates = true
            
            NSWorkspace.shared.openApplication(at: appURL, configuration: config) { [weak self] (app, error) in
                if let error = error {
                    print("Error opening Ghostty: \(error)")
                } else if let app = app {
                    print("Ghostty opened, PID: \(app.processIdentifier)")
                    // Wait a bit for window to appear, then position it
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        self?.positionGhosttyWindow(app: app)
                    }
                }
            }
        } else {
            print("Ghostty not found")
            let alert = NSAlert()
            alert.messageText = "Ghostty Not Found"
            alert.informativeText = "Could not find Ghostty application"
            alert.runModal()
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