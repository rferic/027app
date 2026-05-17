'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/helpers'

export async function createGroupWithWizardAction(
  formData: FormData
): Promise<{ groupId: string } | { error: string }> {
  const { userId } = await requireAdmin()
  const adminClient = createAdminClient()

  const name = (formData.get('name') as string).trim()
  const slug = (formData.get('slug') as string).trim()
  const userIdsJson = (formData.get('userIds') as string) || '[]'

  if (!name || !slug) return { error: 'name_slug_required' }
  if (!/^[a-z0-9-]+$/.test(slug)) return { error: 'slug_invalid' }

  // Verify slug uniqueness
  const { data: existing } = await adminClient
    .from('groups')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) return { error: 'slug_exists' }

  // 1. Create the group
  const { data: group, error: groupError } = await adminClient
    .from('groups')
    .insert({ name, slug })
    .select('id')
    .single()

  if (groupError || !group) return { error: groupError?.message ?? 'Failed to create group' }

  const groupId = group.id

  // 2. Add the creating admin as group admin
  await adminClient
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId, role: 'admin' })

  // 3. Add selected users as members
  let userIds: string[] = []
  try { userIds = JSON.parse(userIdsJson) } catch { /* ignore */ }

  if (userIds.length > 0) {
    const membersToInsert = userIds
      .filter(id => id !== userId) // skip self (already added as admin)
      .map(id => ({
        group_id: groupId,
        user_id: id,
        role: 'member' as const,
      }))

    if (membersToInsert.length > 0) {
      await adminClient.from('group_members').insert(membersToInsert)
    }
  }

  revalidatePath('/', 'layout')
  return { groupId }
}
