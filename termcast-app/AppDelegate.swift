import Cocoa
import Carbon.HIToolbox

class AppDelegate: NSObject, NSApplicationDelegate {
    private var statusItem: NSStatusItem!
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        print("App launched!")
        
        // Show immediate alert to confirm app is running
        let alert = NSAlert()
        alert.messageText = "GhosttyOverlay Started"
        alert.informativeText = "The app is running. Now checking permissions..."
        alert.alertStyle = .informational
        alert.addButton(withTitle: "OK")
        alert.runModal()
        
        // Check permissions
        let trusted = AXIsProcessTrusted()
        print("Accessibility trusted: \(trusted)")
        
        if !trusted {
            // Request permissions
            let options: NSDictionary = [
                kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true
            ]
            let accessEnabled = AXIsProcessTrustedWithOptions(options)
            print("Permission prompt shown, current status: \(accessEnabled)")
        }
        
        // Create menu bar icon
        setupStatusBarItem()
        
        // Setup hotkey
        setupHotkey()
    }
    
    func setupStatusBarItem() {
        print("Setting up status bar item")
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        
        if let button = statusItem.button {
            button.title = "👻"
            button.toolTip = "Ghostty Overlay"
        }
        
        let menu = NSMenu()
        
        let testItem = NSMenuItem(title: "Test", action: #selector(test), keyEquivalent: "")
        testItem.target = self
        menu.addItem(testItem)
        
        menu.addItem(NSMenuItem.separator())
        
        let quitItem = NSMenuItem(title: "Quit", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        menu.addItem(quitItem)
        
        statusItem.menu = menu
        print("Status bar item created")
    }
    
    @objc func test() {
        print("Test menu item clicked")
        let alert = NSAlert()
        alert.messageText = "Test"
        alert.informativeText = "Menu item works!"
        alert.runModal()
    }
    
    func setupHotkey() {
        print("Setting up hotkey")
        NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { event in
            print("Key pressed: keyCode=\(event.keyCode), modifiers=\(event.modifierFlags.rawValue)")
            
            // Check for Cmd+Option+T (keyCode 17 is T)
            if event.modifierFlags.contains([.command, .option]) && event.keyCode == 17 {
                print("Hotkey detected!")
                DispatchQueue.main.async {
                    self.showGhostty()
                }
            }
        }
        print("Hotkey monitor added")
    }
    
    func showGhostty() {
        print("Attempting to show Ghostty")
        
        // Try to launch Ghostty
        let bundleID = "com.mitchellh.ghostty"
        
        if let appURL = NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleID) {
            print("Found Ghostty at: \(appURL.path)")
            
            let config = NSWorkspace.OpenConfiguration()
            config.activates = true
            
            NSWorkspace.shared.openApplication(at: appURL, configuration: config) { (app, error) in
                if let error = error {
                    print("Error opening Ghostty: \(error)")
                } else if let app = app {
                    print("Ghostty opened, PID: \(app.processIdentifier)")
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
    
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return false
    }
}