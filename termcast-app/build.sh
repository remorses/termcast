#!/bin/bash
set -euo pipefail

# Generate timestamp for unique app identification
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
APP_BASE_NAME="GhosttyOverlay"
APP_NAME="${APP_BASE_NAME}_${TIMESTAMP}"
BUILD_DIR="build"
APP_PATH="$BUILD_DIR/$APP_NAME.app"
MACOS_BIN="$APP_PATH/Contents/MacOS/$APP_BASE_NAME"
PLIST="$APP_PATH/Contents/Info.plist"
BUNDLE_ID="com.termcast.ghosttyoverlay.${TIMESTAMP}"

echo "Building $APP_NAME..."
echo "Timestamp: $TIMESTAMP"

rm -rf "$BUILD_DIR"
mkdir -p "$APP_PATH/Contents/MacOS"
mkdir -p "$APP_PATH/Contents/Resources"

cp Info.plist "$APP_PATH/Contents/"

# Compile with main.swift and AppDelegate.swift
swiftc main.swift AppDelegate.swift \
    -framework Cocoa \
    -framework Carbon \
    -framework ApplicationServices \
    -o "$MACOS_BIN"

if [ $? -eq 0 ]; then
    # Update bundle ID with timestamp
    /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier $BUNDLE_ID" "$PLIST" 2>/dev/null || \
    /usr/libexec/PlistBuddy -c "Add :CFBundleIdentifier string $BUNDLE_ID" "$PLIST"
    
    # Update display name with timestamp
    /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName $APP_NAME" "$PLIST" 2>/dev/null || \
    /usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string $APP_NAME" "$PLIST"
    
    # Update executable name
    /usr/libexec/PlistBuddy -c "Set :CFBundleExecutable $APP_BASE_NAME" "$PLIST"
    
    # Sign the app with ad-hoc identity for stable TCC record
    codesign --force --deep --sign - "$APP_PATH"
    
    echo "Build successful!"
    echo "App created at: $APP_PATH"
    echo ""
    echo "Bundle ID: $BUNDLE_ID"
    echo "Display Name: $APP_NAME"
    echo "Code signature:"
    codesign -dvv "$APP_PATH" 2>&1 | grep "Identifier="
    echo ""
    echo "To run the app:"
    echo "  open \"$APP_PATH\""
    echo ""
    echo "Note: Each build creates a unique app with timestamp $TIMESTAMP"
    echo "This ensures fresh permissions in System Settings."
else
    echo "Build failed!"
    exit 1
fi