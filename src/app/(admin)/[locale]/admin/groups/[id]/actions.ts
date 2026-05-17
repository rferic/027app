'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/helpers'

export async function addMemberAction(groupId: string, email: string) {
  await requireAdmin()
  const adminClient = createAdminClient()

  // Find user by email via auth.admin
  const { data: authData } = await adminClient.auth.admin.listUsers()
  const found = authData?.users?.find(
    u => u.email?.toLowerCase() === email.toLowerCase()
  )
  if (!found) return { error: 'User not found with that email' }

  const userId = found.id

  // Check if already a member
  const { data: existing } = await adminClient
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) return { error: 'User is already a member of this group' }

  const { error } = await adminClient
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId, role: 'member' })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function addMembersAction(groupId: string, userIds: string[]) {
  await requireAdmin()
  const adminClient = createAdminClient()

  // Get existing members to skip duplicates
  const { data: existing } = await adminClient
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)

  const existingIds = new Set((existing ?? []).map(m => m.user_id))
  const toInsert = userIds.filter(id => !existingIds.has(id))

  if (toInsert.length === 0) return { success: true }

  const { error } = await adminClient
    .from('group_members')
    .insert(toInsert.map(userId => ({ group_id: groupId, user_id: userId, role: 'member' })))

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function getAvailableUsersAction(groupId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()

  // Get current member IDs
  const { data: members } = await adminClient
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)

  const memberIds = new Set((members ?? []).map(m => m.user_id))

  // Get all users from auth
  const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 })

  // Get profiles for display names
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, display_name')

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.display_name]))

  return (authData?.users ?? [])
    .filter(u => !memberIds.has(u.id))
    .map(u => ({
      id: u.id,
      displayName: profileMap.get(u.id) ?? u.email?.split('@')[0] ?? 'Unknown',
      email: u.email ?? '',
    }))
}

export async function removeMemberAction(groupId: string, userId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()

  // Don't allow removing the last admin
  const { data: admins } = await adminClient
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('role', 'admin')

  if (admins?.length === 1 && admins[0].user_id === userId) {
    return { error: 'Cannot remove the last admin of the group' }
  }

  const { error } = await adminClient
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateGroupAction(
  groupId: string,
  formData: FormData
): Promise<{ error: string | null } | { success: true }> {
  await requireAdmin()
  const adminClient = createAdminClient()

  const nameRaw = formData.get('name')
  const slugRaw = formData.get('slug')
  const name = typeof nameRaw === 'string' ? nameRaw.trim() : ''
  const slug = typeof slugRaw === 'string' ? slugRaw.trim() : ''

  if (!name || !slug) return { error: 'Name and slug are required' }
  if (!/^[a-z0-9-]+$/.test(slug)) return { error: 'Slug can only contain lowercase letters, numbers and hyphens' }

  // Verificar que el slug no esté en uso por OTRO grupo
  const { data: existing } = await adminClient
    .from('groups')
    .select('id')
    .eq('slug', slug)
    .neq('id', groupId)
    .maybeSingle()

  if (existing) return { error: 'A different group already uses this slug' }

  const { error } = await adminClient
    .from('groups')
    .update({ name, slug })
    .eq('id', groupId)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteGroupAction(groupId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('groups')
    .delete()
    .eq('id', groupId)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}
