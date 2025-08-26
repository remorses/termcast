import React, { type ReactNode } from "react"
import { render } from "@opentui/react"
import { Providers } from "./internal/providers"

export function renderExample(element: ReactNode): void {
  render(
    <Providers>
      {element}
    </Providers>
  )
}