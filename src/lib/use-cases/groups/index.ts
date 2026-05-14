import { createAdminClient } from '@/lib/supabase/admin'

export async function createGroup(name: string, slug: string) {
  const supabase = createAdminClient()
  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, slug })
    .select()
    .single()
  return { group: group ?? null, error: error?.message ?? null }
}

export async function addMember(groupId: string, userId: string, role: 'admin' | 'member') {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId, role })
  return { error: error?.message ?? null }
}

export async function deleteGroup(groupId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('groups').delete().eq('id', groupId)
  return { error: error?.message ?? null }
}
