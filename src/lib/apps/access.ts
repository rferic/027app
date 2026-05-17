'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createAdminClientUntyped } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/helpers'

export async function grantGroupAppAccessAction(
  groupId: string,
  appSlug: string
): Promise<{ success: true } | { error: string }> {
  try {
    await requireAdmin()
    const adminClient = createAdminClientUntyped()

    const { data: existing } = await adminClient
      .from('group_app_access')
      .select('id')
      .eq('group_id', groupId)
      .eq('app_slug', appSlug)
      .single()

    if (!existing) {
      const { error } = await adminClient
        .from('group_app_access')
        .insert({ group_id: groupId, app_slug: appSlug })

      if (error) return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

export async function revokeGroupAppAccessAction(
  groupId: string,
  appSlug: string
): Promise<{ success: true } | { error: string }> {
  try {
    await requireAdmin()
    const adminClient = createAdminClientUntyped()

    const { error } = await adminClient
      .from('group_app_access')
      .delete()
      .eq('group_id', groupId)
      .eq('app_slug', appSlug)

    if (error) return { error: error.message }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

export async function canGroupAccessApp(
  groupId: string,
  appSlug: string
): Promise<boolean> {
  const adminClient = createAdminClient()
  const untypedClient = createAdminClientUntyped()

  const { data: app } = await adminClient
    .from('installed_apps')
    .select('visibility')
    .eq('slug', appSlug)
    .eq('status', 'active')
    .single()

  if (!app) return false
  if (app.visibility === 'public') return true

  const { data: access } = await untypedClient
    .from('group_app_access')
    .select('id')
    .eq('app_slug', appSlug)
    .eq('group_id', groupId)
    .single()

  return !!access
}
