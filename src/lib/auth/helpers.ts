import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type UserRole = 'admin' | 'member'

export async function getUserWithRole(): Promise<{ userId: string; role: UserRole } | null> {
  // Verify auth with the user's own session
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return null

  // Use admin client to bypass RLS for the membership lookup.
  // Safe: we explicitly filter by the authenticated user's ID.
  const admin = createAdminClient()
  const { data: membership, error: membershipError } = await admin
    .from('group_members')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (membershipError) {
    console.error('[auth] group_members query failed:', membershipError.message)
    return null
  }

  return {
    userId: user.id,
    role: (membership?.role as UserRole) ?? 'member',
  }
}

export async function requireAdmin() {
  const result = await getUserWithRole()
  if (!result || result.role !== 'admin') {
    throw new Error('Unauthorized: admin role required')
  }
  return result
}
