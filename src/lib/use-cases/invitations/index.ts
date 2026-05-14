import { createAdminClient } from '@/lib/supabase/admin'

export type Invitation = {
  id: string
  token: string
  title: string
  role: 'admin' | 'member'
  email: string | null
  invitedBy: string
  acceptedBy: string | null
  acceptedAt: string | null
  revokedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

export function getInvitationStatus(inv: Invitation): InvitationStatus {
  if (inv.revokedAt) return 'revoked'
  if (inv.acceptedAt) return 'accepted'
  if (inv.expiresAt && new Date(inv.expiresAt) < new Date()) return 'expired'
  return 'pending'
}

export async function getAdminInvitationList(): Promise<Invitation[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false })

  return (data ?? []).map(row => ({
    id: row.id,
    token: row.token,
    title: row.title,
    role: row.role as 'admin' | 'member',
    email: row.email ?? null,
    invitedBy: row.invited_by,
    acceptedBy: row.accepted_by ?? null,
    acceptedAt: row.accepted_at ?? null,
    revokedAt: row.revoked_at ?? null,
    expiresAt: row.expires_at ?? null,
    createdAt: row.created_at,
  }))
}

export async function createInvitation(data: {
  title: string
  role: 'admin' | 'member'
  email: string | null
  expiresAt: string | null
  invitedBy: string
}): Promise<{ token: string } | { error: string }> {
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('invitations')
    .insert({
      title: data.title,
      role: data.role,
      email: data.email || null,
      expires_at: data.expiresAt || null,
      invited_by: data.invitedBy,
    })
    .select('token')
    .single()

  if (error || !row) return { error: error?.message ?? 'Failed to create invitation' }
  return { token: row.token }
}

export async function revokeInvitation(id: string): Promise<{ error: string | null }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .is('accepted_at', null)
    .is('revoked_at', null)
  return { error: error?.message ?? null }
}

export async function deleteInvitation(id: string): Promise<{ error: string | null }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', id)
  return { error: error?.message ?? null }
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .single()

  if (!data) return null
  return {
    id: data.id,
    token: data.token,
    title: data.title,
    role: data.role as 'admin' | 'member',
    email: data.email ?? null,
    invitedBy: data.invited_by,
    acceptedBy: data.accepted_by ?? null,
    acceptedAt: data.accepted_at ?? null,
    revokedAt: data.revoked_at ?? null,
    expiresAt: data.expires_at ?? null,
    createdAt: data.created_at,
  }
}

export async function acceptInvitation(
  token: string,
  data: { email: string; displayName: string; password: string }
): Promise<{ error: string } | { success: true }> {
  const supabase = createAdminClient()

  const invitation = await getInvitationByToken(token)
  if (!invitation) return { error: 'Invalid invitation' }

  const status = getInvitationStatus(invitation)
  if (status !== 'pending') return { error: `Invitation is ${status}` }
  if (invitation.email && invitation.email.toLowerCase() !== data.email.toLowerCase()) {
    return { error: 'Email does not match invitation' }
  }

  const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { display_name: data.displayName },
  })
  if (createError || !authUser.user) return { error: createError?.message ?? 'Failed to create user' }

  const userId = authUser.user.id

  // Upsert en lugar de insert: el trigger on_auth_user_created puede haber creado
  // el perfil antes de que lleguemos aquí. El upsert garantiza el nombre correcto.
  await supabase.from('profiles').upsert({ id: userId, display_name: data.displayName })

  const { data: group } = await supabase
    .from('groups')
    .select('id')
    .limit(1)
    .single()

  if (group) {
    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: userId,
      role: invitation.role,
      invited_by: invitation.invitedBy,
    })
  }

  await supabase
    .from('invitations')
    .update({ accepted_by: userId, accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  return { success: true }
}
