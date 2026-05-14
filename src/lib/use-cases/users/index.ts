import { createAdminClient } from '@/lib/supabase/admin'

export async function createUser(email: string, password: string, displayName?: string) {
  const supabase = createAdminClient()
  const { data: { user }, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    ...(displayName ? { user_metadata: { display_name: displayName } } : {}),
  })
  return { user: user ?? null, error: error?.message ?? null }
}

export async function deleteUser(userId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  return { error: error?.message ?? null }
}
