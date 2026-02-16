export * from '@opentui/core'
export * from '@opentui/react'
// Disambiguate names exported by both core and react (type-only to avoid
// runtime errors when the JS bundle doesn't actually export the name)
export type { RenderableConstructor } from '@opentui/core'
