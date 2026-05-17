'use server'

import { createAdminClient, createAdminClientUntyped } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/helpers'

export interface GroupMemberData {
  userId: string
  displayName: string
  email: string
  role: string
}

export interface GroupAppData {
  slug: string
  hasAccess: boolean
}

export interface GroupDetailData {
  members: GroupMemberData[]
  apps: GroupAppData[]
}

export async function getGroupDetailAction(groupId: string): Promise<GroupDetailData> {
  await requireAdmin()
  const adminClient = createAdminClient()

  // Members with profiles (LEFT JOIN para no excluir miembros sin perfil)
  const { data: members } = await adminClient
    .from('group_members')
    .select('user_id, role')
    .eq('group_id', groupId)

  // Profile names + emails
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, display_name')

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.display_name]))

  const { data: authData } = await adminClient.auth.admin.listUsers()
  const userMap = new Map(
    (authData?.users ?? []).map(u => [u.id, u.email ?? ''])
  )

  // Private apps and their access state
  const { data: privateApps } = await adminClient
    .from('installed_apps')
    .select('slug')
    .eq('status', 'active')
    .eq('visibility', 'private')

  const untypedClient = createAdminClientUntyped()
  const { data: accessEntries } = await untypedClient
    .from('group_app_access')
    .select('app_slug')
    .eq('group_id', groupId)

  const accessSet = new Set((accessEntries ?? []).map(a => a.app_slug))

  return {
    members: (members ?? []).map(m => ({
      userId: m.user_id,
      displayName: profileMap.get(m.user_id) ?? 'Unknown',
      email: userMap.get(m.user_id) ?? '',
      role: m.role as string,
    })),
    apps: (privateApps ?? []).map(a => ({
      slug: a.slug,
      hasAccess: accessSet.has(a.slug),
    })),
  }
}

export async function getUsersForWizardAction(): Promise<{ id: string; email: string; displayName: string }[]> {
  await requireAdmin()
  const adminClient = createAdminClient()

  const [authResult, profilesResult] = await Promise.all([
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
    adminClient.from('profiles').select('id, display_name'),
  ])

  const profiles = profilesResult.data ?? []
  const profileMap = new Map(profiles.map(p => [p.id, p.display_name]))

  return (authResult.data?.users ?? []).map(u => ({
    id: u.id,
    email: u.email ?? '',
    displayName: profileMap.get(u.id) ?? u.email?.split('@')[0] ?? 'Unknown',
  }))
}
