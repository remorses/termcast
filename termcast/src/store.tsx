import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { logger } from './logger'
import { getCommandsWithFiles, type CommandWithFile } from './package-json'

interface BundledCommand extends CommandWithFile {
    bundledPath: string
}

interface StoredExtension {
    name: string
    packageJsonPath: string
    commands: BundledCommand[]
}

export function getStoreDirectory(): string {
    const homeDir = os.homedir()
    const storeDir = path.join(homeDir, '.termcast', 'store')
    
    // Ensure store directory exists
    if (!fs.existsSync(storeDir)) {
        fs.mkdirSync(storeDir, { recursive: true })
    }
    
    return storeDir
}

export function installExtension({
    extensionName,
    bundleDir,
}: {
    extensionName: string
    bundleDir: string
}): void {
    const storeDir = getStoreDirectory()
    const extensionDir = path.join(storeDir, extensionName)
    
    // Remove existing extension directory if it exists
    if (fs.existsSync(extensionDir)) {
        fs.rmSync(extensionDir, { recursive: true, force: true })
    }
    
    // Create extension directory
    fs.mkdirSync(extensionDir, { recursive: true })
    
    // Copy bundle directory
    const targetBundleDir = path.join(extensionDir, '.termcast-bundle')
    fs.cpSync(bundleDir, targetBundleDir, { recursive: true })
    
    // Copy package.json
    const sourcePackageJson = path.join(path.dirname(bundleDir), 'package.json')
    const targetPackageJson = path.join(extensionDir, 'package.json')
    fs.copyFileSync(sourcePackageJson, targetPackageJson)
    
    logger.log(`Extension '${extensionName}' installed to ${extensionDir}`)
}

export function getStoredExtensions(): StoredExtension[] {
    const storeDir = getStoreDirectory()
    const extensions: StoredExtension[] = []
    
    if (!fs.existsSync(storeDir)) {
        return extensions
    }
    
    const entries = fs.readdirSync(storeDir, { withFileTypes: true })
    
    for (const entry of entries) {
        if (!entry.isDirectory()) continue
        
        const extensionDir = path.join(storeDir, entry.name)
        const packageJsonPath = path.join(extensionDir, 'package.json')
        
        if (!fs.existsSync(packageJsonPath)) {
            logger.log(`Skipping ${entry.name}: no package.json found`)
            continue
        }
        
        try {
            const commandsData = getCommandsWithFiles({ packageJsonPath })
            const bundleDir = path.join(extensionDir, '.termcast-bundle')
            
            // Map commands to bundled commands
            const bundledCommands: BundledCommand[] = commandsData.commands.map((command) => {
                const bundledPath = path.join(bundleDir, `${command.name}.js`)
                const exists = fs.existsSync(bundledPath)
                
                return {
                    ...command,
                    bundledPath: exists ? bundledPath : '',
                }
            })
            
            extensions.push({
                name: entry.name,
                packageJsonPath,
                commands: bundledCommands,
            })
        } catch (error: any) {
            logger.error(`Failed to load extension ${entry.name}:`, error.message)
        }
    }
    
    return extensions
}