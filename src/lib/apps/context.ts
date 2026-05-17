'use client'

import { createContext, useContext } from 'react'
import type { AppManifest, ResolvedAppConfig } from '@/types/apps'

export interface AppContextValue {
  slug: string
  manifest: AppManifest
  config: ResolvedAppConfig
  groupId?: string
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>')
  return ctx
}
