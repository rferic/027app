import type { SupabaseClient } from '@supabase/supabase-js'

export type AppStatus = 'installing' | 'active' | 'error' | 'uninstalling'
export type AppVisibility = 'public' | 'private'

export interface AppConfigField {
  key: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea'
  label: Record<string, string>
  required: boolean
  default?: unknown
  min?: number
  max?: number
  regex?: string
  options?: { value: string; label: Record<string, string> }[]
}

export interface AppManifest {
  slug: string
  tablePrefix: string
  name: string
  version: string
  description: string
  logo: string
  primaryColor: string
  secondaryColor: string
  author: { name: string; url?: string }
  minPlatformVersion: string
  views: { public: boolean; admin: boolean; widget: boolean; native: boolean }
  api: boolean
  dependencies: string[]
  extends?: string
  extensionPoints?: string[]
  notifications: boolean
  i18n?: boolean
  config: AppConfigField[]
}

export interface AppInstallContext {
  supabase: SupabaseClient
  manifest: AppManifest
  slug: string
}

export interface InstalledApp {
  id: string
  slug: string
  version: string
  status: AppStatus
  visibility: AppVisibility
  error: string | null
  config: Record<string, unknown>
  installed_at: string
  updated_at: string
  table_prefix: string | null
}

export type ResolvedAppConfig = Record<string, string | number | boolean>

export class AppValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AppValidationError'
  }
}

export interface ScannedApp {
  slug: string
  manifest: AppManifest | null
  validationError: string | null
}

export interface CombinedApp {
  slug: string
  manifest: AppManifest | null
  validationError: string | null
  installed: InstalledApp | null
}
