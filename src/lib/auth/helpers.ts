import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type UserRole = 'admin' | 'member'

export async function getUserWithRole(): Promise<{ userId: string; role: UserRole } | null> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return null

  const admin = createAdminClient()
  const { data: memberships, error: membershipError } = await admin
    .from('group_members')
    .select('role')
    .eq('user_id', user.id)

  if (membershipError) {
    console.error('[auth] group_members query failed:', membershipError.message)
    return null
  }

  const role: UserRole = memberships?.some(m => m.role === 'admin') ? 'admin' : 'member'

  return { userId: user.id, role }
}

export async function requireAdmin() {
  const result = await getUserWithRole()
  if (!result || result.role !== 'admin') {
    throw new Error('Unauthorized: admin role required')
  }
  return result
}
