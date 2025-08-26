import React, { type ReactNode } from "react"
import { DialogProvider } from "@termcast/api/src/internal/dialog"

interface ProvidersProps {
  children: ReactNode
}

export function Providers(props: ProvidersProps): any {
  return (
    <DialogProvider>
      {props.children}
    </DialogProvider>
  )
}