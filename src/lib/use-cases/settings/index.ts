import { createAdminClient } from '@/lib/supabase/admin'

export interface GroupSettings {
  activeLocales: string[]
  defaultLocale: string
}

export const ALL_LOCALES = ['en', 'es', 'it', 'ca', 'fr', 'de'] as const
export type AppLocale = typeof ALL_LOCALES[number]

const DEFAULT_SETTINGS: GroupSettings = {
  activeLocales: ['en', 'es', 'it'],
  defaultLocale: 'en',
}

export async function getGroupSettings(): Promise<GroupSettings> {
  const supabase = createAdminClient()
  const { data: group } = await supabase.from('groups').select('id').limit(1).single()
  if (!group) return DEFAULT_SETTINGS

  const { data } = await supabase
    .from('group_settings')
    .select('active_locales, default_locale')
    .eq('group_id', group.id)
    .maybeSingle()

  if (!data) return DEFAULT_SETTINGS
  return {
    activeLocales: (data.active_locales as string[]) ?? DEFAULT_SETTINGS.activeLocales,
    defaultLocale: (data.default_locale as string) ?? DEFAULT_SETTINGS.defaultLocale,
  }
}

export async function updateGroupSettings(settings: GroupSettings): Promise<void> {
  const supabase = createAdminClient()
  const { data: group } = await supabase.from('groups').select('id').limit(1).single()
  if (!group) throw new Error('No group found')

  await supabase.from('group_settings').upsert({
    group_id: group.id,
    active_locales: settings.activeLocales,
    default_locale: settings.defaultLocale,
    updated_at: new Date().toISOString(),
  })
}
