import { createAdminClient } from '@/lib/supabase/admin'
import { createUser, deleteUser } from '@/lib/use-cases/users'
import { createGroup, addMember, deleteGroup } from '@/lib/use-cases/groups'

export async function installApp(data: {
  email: string
  password: string
  displayName: string
  groupName: string
}): Promise<{ error: string } | { success: true }> {
  const supabase = createAdminClient()
  const { count, error: countError } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')
  if (countError) return { error: 'Database error' }
  if (count && count > 0) return { error: 'Already installed' }

  const slug = data.groupName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')

  const { user, error: userError } = await createUser(data.email, data.password, data.displayName)
  if (userError || !user) return { error: userError ?? 'Failed to create user' }

  const { group, error: groupError } = await createGroup(data.groupName, slug)
  if (groupError || !group) {
    await deleteUser(user.id)
    return { error: groupError ?? 'Failed to create group' }
  }

  const { error: memberError } = await addMember(group.id, user.id, 'admin')
  if (memberError) {
    await deleteUser(user.id)
    await deleteGroup(group.id)
    return { error: memberError }
  }

  return { success: true }
}
