#!/bin/bash

APP_NAME="GhosttyOverlay"
BUILD_DIR="build"

echo "Building $APP_NAME..."

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/$APP_NAME.app/Contents/MacOS"
mkdir -p "$BUILD_DIR/$APP_NAME.app/Contents/Resources"

cp Info.plist "$BUILD_DIR/$APP_NAME.app/Contents/"

swiftc AppDelegate.swift OverlayController.swift \
    -framework Cocoa \
    -framework Carbon \
    -framework ApplicationServices \
    -o "$BUILD_DIR/$APP_NAME.app/Contents/MacOS/$APP_NAME"

if [ $? -eq 0 ]; then
    echo "Build successful!"
    echo "App created at: $BUILD_DIR/$APP_NAME.app"
    echo ""
    echo "To run the app:"
    echo "  open $BUILD_DIR/$APP_NAME.app"
    echo ""
    echo "Note: You'll need to grant Accessibility permissions when prompted."
    echo "Go to System Settings > Privacy & Security > Accessibility"
else
    echo "Build failed!"
    exit 1
fi