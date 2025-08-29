import React, { type ReactNode } from "react"
import { render } from "@opentui/react"
import { Providers } from "@termcast/cli/src/internal/providers"

export function renderWithProviders(element: ReactNode): void {
  render(
    <Providers>
      {element}
    </Providers>
  )
}

export type CommonProps = {
  key?: string
}

export interface Application {
  name: string
  localizedName?: string
  path: string
  bundleId?: string
}

export type PathLike = string | Buffer | { href: string; toString(): string }

export async function getApplications(path?: PathLike): Promise<Application[]> {
  // TODO: Implement system call to get applications
  // For now, return common applications
  const apps: Application[] = [
    {
      name: "Finder",
      localizedName: "Finder",
      path: "/System/Library/CoreServices/Finder.app",
      bundleId: "com.apple.finder"
    },
    {
      name: "Terminal",
      localizedName: "Terminal",
      path: "/System/Applications/Utilities/Terminal.app",
      bundleId: "com.apple.Terminal"
    },
    {
      name: "Visual Studio Code",
      localizedName: "Visual Studio Code",
      path: "/Applications/Visual Studio Code.app",
      bundleId: "com.microsoft.VSCode"
    }
  ]
  return Promise.resolve(apps)
}

export async function getDefaultApplication(path: PathLike): Promise<Application> {
  // TODO: Implement system call to get default application for file type
  // For now, return a default app
  const defaultApp: Application = {
    name: "Finder",
    localizedName: "Finder",
    path: "/System/Library/CoreServices/Finder.app",
    bundleId: "com.apple.finder"
  }
  return Promise.resolve(defaultApp)
}

export async function getFrontmostApplication(): Promise<Application> {
  // TODO: Implement system call to get frontmost application
  // For now, return Terminal as default
  const frontmostApp: Application = {
    name: "Terminal",
    localizedName: "Terminal",
    path: "/System/Applications/Utilities/Terminal.app",
    bundleId: "com.apple.Terminal"
  }
  return Promise.resolve(frontmostApp)
}

export async function showInFinder(path: PathLike): Promise<void> {
  // TODO: Implement system call to show file in Finder
  const pathStr = typeof path === 'string' ? path : path.toString()
  console.log(`[showInFinder] Would open: ${pathStr}`)
  return Promise.resolve()
}

export async function trash(path: PathLike | PathLike[]): Promise<void> {
  // TODO: Implement system call to move files to trash
  const paths = Array.isArray(path) ? path : [path]
  const pathStrs = paths.map(p => typeof p === 'string' ? p : p.toString())
  console.log(`[trash] Would trash: ${pathStrs.join(", ")}`)
  return Promise.resolve()
}

export async function open(target: string, application?: Application | string): Promise<void> {
  // TODO: Implement system call to open file/URL with application
  const appName = typeof application === "string" ? application : application?.name
  console.log(`[open] Would open ${target}${appName ? ` with ${appName}` : ""}`)
  return Promise.resolve()
}

export function captureException(exception: unknown): void {
  // TODO: Implement error reporting to Developer Hub
  console.error("[captureException] Exception captured:", exception)
}
