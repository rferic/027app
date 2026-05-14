import { createAdminClient } from '@/lib/supabase/admin'
import type { AppManifest } from '@/types/apps'

export async function getAppConfig(slug: string): Promise<Record<string, unknown>> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('installed_apps')
      .select('config')
      .eq('slug', slug)
      .eq('status', 'active')
      .single()
    if (error || !data) return {}
    return (data.config as Record<string, unknown>) ?? {}
  } catch {
    return {}
  }
}

export function resolveAppConfig(
  manifest: AppManifest,
  installedConfig: Record<string, unknown>
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {}
  for (const field of manifest.config) {
    const raw = field.key in installedConfig ? installedConfig[field.key] : field.default
    if (raw === undefined || raw === null) continue
    if (field.type === 'number') {
      const n = Number(raw)
      result[field.key] = isNaN(n) ? Number(field.default ?? 0) : n
    } else if (field.type === 'boolean') {
      result[field.key] = Boolean(raw)
    } else {
      result[field.key] = String(raw)
    }
  }
  return result
}
