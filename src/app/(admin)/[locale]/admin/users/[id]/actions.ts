'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/helpers'

export async function addUserToGroupAction(
  userId: string,
  groupId: string
): Promise<{ error: string | null }> {
  await requireAdmin()
  const adminClient = createAdminClient()

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
  return { error: null }
}

export async function removeUserFromGroupAction(
  userId: string,
  groupId: string
): Promise<{ error: string | null }> {
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
  return { error: null }
}
