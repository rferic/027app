'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/helpers'
import { scanApps } from '@/lib/apps/scanner'
import { installApp, uninstallApp, InstallerError } from '@/lib/apps/installer'
import { readManifest } from '@/lib/apps/manifest'
import type { CombinedApp, InstalledApp } from '@/types/apps'
import type { Database } from '@/types/supabase'

export interface AppActionError {
  /** i18n key under the `apps.errors` namespace */
  code: string
  /** ICU params for the translation, if any */
  params?: Record<string, string>
}

function isMigrationPendingError(msg: string): boolean {
  return msg.includes('does not exist') && (msg.includes('table_prefix') || msg.includes('42703'))
}

function classifyError(err: unknown): AppActionError {
  const msg = err instanceof Error ? err.message : String(err)
  if (isMigrationPendingError(msg)) return { code: 'migration_pending' }
  if (err instanceof InstallerError) {
    return { code: err.code, params: err.params as Record<string, string> | undefined }
  }
  return { code: 'install_failed' }
}

type InstalledAppRow = Database['public']['Tables']['installed_apps']['Row']

export async function getAppsListAction(): Promise<{ apps: CombinedApp[] } | { error: string }> {
  try {
    const adminClient = createAdminClient()
    const [scanned, { data: installed }] = await Promise.all([
      scanApps(),
      adminClient.from('installed_apps').select('*'),
    ])
    const installedMap = new Map((installed ?? []).map((a: InstalledAppRow) => [a.slug, {
      ...a,
      status: a.status as InstalledApp['status'],
      visibility: a.visibility as InstalledApp['visibility'],
      config: (a.config ?? {}) as Record<string, unknown>,
      table_prefix: (a as unknown as { table_prefix?: string | null }).table_prefix ?? null,
    } satisfies InstalledApp]))
    const apps: CombinedApp[] = scanned.map(app => ({
      ...app,
      installed: installedMap.get(app.slug) ?? null,
    }))
    return { apps }
  } catch (err) {
    return { error: String(err) }
  }
}

export async function installAppAction(slug: string): Promise<{ success: true } | { errorCode: string; errorParams?: Record<string, string> }> {
  try {
    await requireAdmin()
    await installApp(slug)
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    const { code, params } = classifyError(err)
    return { errorCode: code, ...(params ? { errorParams: params } : {}) }
  }
}

export async function uninstallAppAction(slug: string): Promise<{ success: true } | { errorCode: string; errorParams?: Record<string, string> }> {
  try {
    await requireAdmin()
    await uninstallApp(slug)
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    const { code, params } = classifyError(err)
    return { errorCode: code, ...(params ? { errorParams: params } : {}) }
  }
}

export async function updateAppVisibilityAction(
  slug: string,
  visibility: 'public' | 'private'
): Promise<{ success: true } | { error: string }> {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('installed_apps')
      .update({ visibility, updated_at: new Date().toISOString() })
      .eq('slug', slug)
      .eq('status', 'active')
    if (error) return { error: error.message }
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

async function getGroupId(): Promise<string> {
  const { userId } = await requireAdmin()
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)
    .single()
  if (!data) throw new Error('Group not found')
  return data.group_id
}

export async function grantAppAccessAction(
  slug: string,
  userId: string
): Promise<{ success: true } | { error: string }> {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()
    const { data: app } = await adminClient
      .from('installed_apps')
      .select('slug')
      .eq('slug', slug)
      .eq('status', 'active')
      .single()
    if (!app) return { error: 'App not found or not active' }
    const groupId = await getGroupId()
    const { error } = await adminClient
      .from('app_permissions')
      .upsert(
        { app_slug: slug, user_id: userId, group_id: groupId, enabled: true },
        { onConflict: 'group_id,user_id,app_slug' }
      )
    if (error) return { error: error.message }
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

export async function revokeAppAccessAction(
  slug: string,
  userId: string
): Promise<{ success: true } | { error: string }> {
  try {
    const adminClient = createAdminClient()
    const groupId = await getGroupId()
    const { error } = await adminClient
      .from('app_permissions')
      .delete()
      .eq('app_slug', slug)
      .eq('user_id', userId)
      .eq('group_id', groupId)
    if (error) return { error: error.message }
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

interface MemberWithAccess {
  userId: string
  displayName: string
  avatarUrl: string | null
  hasAccess: boolean
}

export async function getAppPermissionsAction(
  slug: string
): Promise<{ members: MemberWithAccess[] } | { error: string }> {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()
    const groupId = await getGroupId()

    const [membersResult, permissionsResult] = await Promise.all([
      adminClient
        .from('group_members')
        .select('user_id, profiles!inner(display_name, avatar_url)')
        .eq('group_id', groupId),
      adminClient
        .from('app_permissions')
        .select('user_id, enabled')
        .eq('app_slug', slug)
        .eq('group_id', groupId),
    ])

    const permissions = new Map(
      (permissionsResult.data ?? []).map(p => [p.user_id, p.enabled])
    )

    const members: MemberWithAccess[] = (membersResult.data ?? []).map(m => {
      const profile = m.profiles as unknown as { display_name: string | null; avatar_url: string | null }
      return {
        userId: m.user_id,
        displayName: profile.display_name ?? m.user_id,
        avatarUrl: profile.avatar_url,
        hasAccess: permissions.get(m.user_id) === true,
      }
    })

    return { members }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

export async function updateAppConfigAction(
  slug: string,
  config: Record<string, unknown>
): Promise<{ success: true } | { error: string }> {
  try {
    await requireAdmin()
    const manifest = await readManifest(slug)
    for (const field of manifest.config) {
      const value = config[field.key]
      if (field.required && (value === undefined || value === null || value === '')) {
        return { error: `Field "${field.key}" is required` }
      }
      if (value !== undefined && value !== null) {
        if (field.type === 'number') {
          const num = Number(value)
          if (isNaN(num)) return { error: `Field "${field.key}" must be a number` }
          if (field.min !== undefined && num < field.min) return { error: `Field "${field.key}" must be >= ${field.min}` }
          if (field.max !== undefined && num > field.max) return { error: `Field "${field.key}" must be <= ${field.max}` }
        }
        if (field.type === 'string' && field.regex) {
          if (!new RegExp(field.regex).test(String(value))) return { error: `Field "${field.key}" has invalid format` }
        }
        if (field.type === 'select' && field.options) {
          const valid = field.options.map(o => o.value)
          if (!valid.includes(String(value))) return { error: `Field "${field.key}" must be one of: ${valid.join(', ')}` }
        }
      }
    }
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('installed_apps')
      .update({ config: config as Database['public']['Tables']['installed_apps']['Update']['config'], updated_at: new Date().toISOString() })
      .eq('slug', slug)
    if (error) return { error: error.message }
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}
