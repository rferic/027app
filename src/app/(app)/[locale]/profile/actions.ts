'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ProfileState = { error: string | null; success?: boolean }

export async function updateDisplayNameAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const displayName = (formData.get('displayName') as string | null)?.trim() ?? ''
  if (!displayName) return { error: 'Name cannot be empty' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/[locale]/profile', 'page')
  return { error: null, success: true }
}
