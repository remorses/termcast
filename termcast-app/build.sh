#!/bin/bash
set -euo pipefail

APP_NAME="GhosttyOverlay"
BUILD_DIR="build"
APP_PATH="$BUILD_DIR/$APP_NAME.app"
MACOS_BIN="$APP_PATH/Contents/MacOS/$APP_NAME"
PLIST="$APP_PATH/Contents/Info.plist"
BUNDLE_ID="com.termcast.ghosttyoverlay"

echo "Building $APP_NAME..."

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
    # Ensure stable bundle ID
    /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier $BUNDLE_ID" "$PLIST" 2>/dev/null || \
    /usr/libexec/PlistBuddy -c "Add :CFBundleIdentifier string $BUNDLE_ID" "$PLIST"
    
    # Sign the app with ad-hoc identity for stable TCC record
    codesign --force --deep --sign - "$APP_PATH"
    
    echo "Build successful!"
    echo "App created at: $APP_PATH"
    echo ""
    echo "Bundle ID: $BUNDLE_ID"
    echo "Code signature:"
    codesign -dvv "$APP_PATH" 2>&1 | grep "Identifier="
    echo ""
    echo "To run the app:"
    echo "  open $APP_PATH"
    echo ""
    echo "Note: Accessibility permissions will be remembered across builds now."
else
    echo "Build failed!"
    exit 1
fi