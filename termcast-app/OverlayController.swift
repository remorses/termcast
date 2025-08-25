import Cocoa
import Carbon.HIToolbox
import ApplicationServices

final class OverlayController {
    private let bundleID = "com.mitchellh.ghostty"
    
    private var isOverlayActive = false
    private var workspaceObserver: NSObjectProtocol?
    private var eventMonitor: Any?
    private let logFile: FileHandle?
    
    init() {
        let logPath = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("GhosttyOverlay.log")
        FileManager.default.createFile(atPath: logPath.path, contents: nil, attributes: nil)
        logFile = FileHandle(forWritingAtPath: logPath.path)
        log("OverlayController initialized")
    }
    
    private func log(_ message: String) {
        let timestamp = DateFormatter.localizedString(from: Date(), dateStyle: .none, timeStyle: .medium)
        let logMessage = "[\(timestamp)] \(message)\n"
        if let data = logMessage.data(using: .utf8) {
            logFile?.seekToEndOfFile()
            logFile?.write(data)
            logFile?.synchronizeFile()
        }
        print(logMessage)
        NSLog("GhosttyOverlay: %@", message)
    }
    
    func start() {
        log("Starting OverlayController")
        
        // Only register if we have accessibility permissions
        if AXIsProcessTrusted() {
            registerHotkey()
            observeAppActivation()
            log("Ready! Press Cmd+Option+T to toggle Ghostty")
        } else {
            log("Waiting for accessibility permissions...")
        }
    }
    
    private func registerHotkey() {
        log("Registering hotkey: Cmd+Option+T using NSEvent")
        
        // Use NSEvent global monitor instead of Carbon
        NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { [weak self] event in
            // Check for Cmd+Option+T
            if event.modifierFlags.contains([.command, .option]) && event.keyCode == 17 { // 17 is T
                self?.log("Hotkey pressed via NSEvent!")
                self?.toggleOverlay()
            }
        }
        
        // Also add local monitor for when app is focused
        NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            if event.modifierFlags.contains([.command, .option]) && event.keyCode == 17 {
                self?.log("Hotkey pressed locally!")
                self?.toggleOverlay()
                return nil // Consume the event
            }
            return event
        }
        
        log("Hotkey registered successfully via NSEvent")
    }
    
    func toggleOverlay() {
        log("toggleOverlay called")
        
        let running = NSRunningApplication.runningApplications(withBundleIdentifier: bundleID)
        log("Found \(running.count) running instances of \(bundleID)")
        
        if isOverlayActive, let app = running.first {
            log("Hiding overlay")
            app.hide()
            isOverlayActive = false
            removeClickMonitor()
            return
        }
        
        log("Attempting to launch/show Ghostty")
        
        // Try to open Ghostty using URL first (more modern approach)
        if let appURL = NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleID) {
            log("Found Ghostty at: \(appURL.path)")
            let config = NSWorkspace.OpenConfiguration()
            config.activates = true
            
            NSWorkspace.shared.openApplication(at: appURL, configuration: config) { [weak self] (app, error) in
                if let error = error {
                    self?.log("Error opening Ghostty: \(error)")
                } else if let app = app {
                    self?.log("Ghostty opened successfully, PID: \(app.processIdentifier)")
                    self?.waitForWindowAndPlace(maxWait: 2.0)
                }
            }
        } else {
            log("Could not find Ghostty application")
            // Fallback to older method
            NSWorkspace.shared.launchApplication(withBundleIdentifier: bundleID,
                                                 options: [.default],
                                                 additionalEventParamDescriptor: nil,
                                                 launchIdentifier: nil)
            waitForWindowAndPlace(maxWait: 2.0)
        }
    }
    
    private func waitForWindowAndPlace(maxWait: TimeInterval) {
        log("Waiting for window to appear...")
        let start = Date()
        func tryPlace() {
            if placeAndRaise() {
                log("Window placed and raised successfully")
                isOverlayActive = true
                setupClickMonitor()
            } else if Date().timeIntervalSince(start) < maxWait {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.05, execute: tryPlace)
            } else {
                log("Timeout waiting for window")
            }
        }
        tryPlace()
    }
    
    @discardableResult
    private func placeAndRaise() -> Bool {
        guard let app = NSRunningApplication.runningApplications(withBundleIdentifier: bundleID).first else {
            log("App not found when trying to place window")
            return false
        }
        
        log("Found app, PID: \(app.processIdentifier)")
        
        guard let win = frontAXWindow(of: app) else {
            log("Could not get front window")
            return false
        }
        
        guard let screen = NSScreen.main else {
            log("No main screen found")
            return false
        }
        
        let screenFrame = screen.frame
        log("Screen frame: \(screenFrame)")
        
        let width: CGFloat = 800
        let height: CGFloat = 600
        
        let x = screenFrame.origin.x + (screenFrame.width - width) / 2
        let y = screenFrame.origin.y + (screenFrame.height - height) / 2
        
        log("Setting window position to (\(x), \(y)) with size \(width)x\(height)")
        
        var position = CGPoint(x: x, y: y)
        var size = CGSize(width: width, height: height)
        
        let posResult = AXUIElementSetAttributeValue(win, kAXPositionAttribute as CFString,
                                         AXValueCreate(.cgPoint, &position)!)
        let sizeResult = AXUIElementSetAttributeValue(win, kAXSizeAttribute as CFString,
                                         AXValueCreate(.cgSize, &size)!)
        
        log("Position set result: \(posResult.rawValue), Size set result: \(sizeResult.rawValue)")
        
        let raiseResult = AXUIElementPerformAction(win, kAXRaiseAction as CFString)
        log("Raise result: \(raiseResult.rawValue)")
        
        app.activate(options: [.activateIgnoringOtherApps])
        return true
    }
    
    private func setupClickMonitor() {
        log("Setting up click monitor")
        removeClickMonitor()
        
        eventMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown]) { [weak self] event in
            guard let self = self, self.isOverlayActive else { return }
            
            DispatchQueue.main.async {
                let frontmost = NSWorkspace.shared.frontmostApplication
                if frontmost?.bundleIdentifier != self.bundleID {
                    self.log("Click detected outside Ghostty, hiding")
                    if let ghostty = NSRunningApplication.runningApplications(withBundleIdentifier: self.bundleID).first {
                        ghostty.hide()
                    }
                    self.isOverlayActive = false
                    self.removeClickMonitor()
                }
            }
        }
    }
    
    private func removeClickMonitor() {
        if let monitor = eventMonitor {
            log("Removing click monitor")
            NSEvent.removeMonitor(monitor)
            eventMonitor = nil
        }
    }
    
    private func observeAppActivation() {
        log("Setting up app activation observer")
        workspaceObserver = NSWorkspace.shared.notificationCenter.addObserver(
            forName: NSWorkspace.didActivateApplicationNotification,
            object: nil, queue: .main
        ) { [weak self] note in
            guard let self = self, self.isOverlayActive else { return }
            guard let activated = note.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication else { return }
            if activated.bundleIdentifier != self.bundleID {
                self.log("Different app activated, hiding Ghostty")
                if let target = NSRunningApplication.runningApplications(withBundleIdentifier: self.bundleID).first {
                    target.hide()
                }
                self.isOverlayActive = false
                self.removeClickMonitor()
            }
        }
    }
    
    private func frontAXWindow(of app: NSRunningApplication) -> AXUIElement? {
        let axApp = AXUIElementCreateApplication(app.processIdentifier)
        var focused: CFTypeRef?
        if AXUIElementCopyAttributeValue(axApp, kAXFocusedWindowAttribute as CFString, &focused) == .success,
           let win = focused {
            log("Got focused window")
            return (win as! AXUIElement)
        }
        var windows: CFTypeRef?
        if AXUIElementCopyAttributeValue(axApp, kAXWindowsAttribute as CFString, &windows) == .success,
           let list = windows as? [AXUIElement], let first = list.first {
            log("Got first window from windows list")
            return first
        }
        log("Could not get any window")
        return nil
    }
}