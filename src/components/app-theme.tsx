'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect } from 'react'

interface AppThemeProps {
  primaryColor: string
  secondaryColor: string
  scope?: 'global' | 'local'
  children: ReactNode
}

export default function AppTheme({
  primaryColor,
  secondaryColor,
  scope = 'global',
  children,
}: AppThemeProps) {
  useEffect(() => {
    if (scope !== 'global') return
    document.documentElement.style.setProperty('--app-primary', primaryColor)
    document.documentElement.style.setProperty('--app-secondary', secondaryColor)
    return () => {
      document.documentElement.style.removeProperty('--app-primary')
      document.documentElement.style.removeProperty('--app-secondary')
    }
  }, [scope, primaryColor, secondaryColor])

  return (
    <div
      style={
        {
          '--app-primary': primaryColor,
          '--app-secondary': secondaryColor,
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}
