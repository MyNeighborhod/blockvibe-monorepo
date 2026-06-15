import React from "react"

import { HeaderThemeProvider } from "./HeaderTheme"
import { ThemeProvider } from "./Theme"

import type { Theme } from "./Theme/types"

export const Providers: React.FC<{
  children: React.ReactNode
  theme?: Theme | "auto"
}> = ({ children, theme }) => {
  return (
    <ThemeProvider theme={theme}>
      <HeaderThemeProvider>{children}</HeaderThemeProvider>
    </ThemeProvider>
  )
}
