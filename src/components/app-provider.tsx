'use client'

import type { ReactNode } from 'react'
import { AppContext } from '@/lib/apps/context'
import type { AppManifest, ResolvedAppConfig } from '@/types/apps'

interface AppProviderProps {
  slug: string
  manifest: AppManifest
  config: ResolvedAppConfig
  groupId?: string
  groupSlug?: string
  children: ReactNode
}

export default function AppProvider({ slug, manifest, config, groupId, groupSlug, children }: AppProviderProps) {
  return (
    <AppContext.Provider value={{ slug, manifest, config, groupId, groupSlug }}>
      {children}
    </AppContext.Provider>
  )
}
