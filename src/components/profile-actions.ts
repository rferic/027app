'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { LOCALES } from '@/i18n/routing'

export type ProfileState = { error: string | null; success?: boolean }
export type PasswordState = { error: string | null; success?: boolean }

async function getLocale(): Promise<string> {
  const store = await cookies()
  const raw = store.get('preferred-locale')?.value
  return raw && (LOCALES as readonly string[]).includes(raw) ? raw : 'en'
}

export async function updateProfileAction(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'error_not_authenticated' }

  const displayName = (formData.get('displayName') as string | null)?.trim() ?? ''
  const locale = formData.get('locale') as string | null
  if (!displayName) return { error: 'error_name_required' }

  const updates: { display_name: string; locale?: string } = { display_name: displayName }
  if (locale && (LOCALES as readonly string[]).includes(locale)) {
    updates.locale = locale
  }

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
  if (error) return { error: error.message }

  const resolvedLocale = await getLocale()
  revalidatePath(`/${resolvedLocale}/profile`)
  revalidatePath(`/${resolvedLocale}/admin/profile`)
  return { error: null, success: true }
}

export async function changePasswordAction(
  _prevState: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'error_not_authenticated' }

  const newPassword = (formData.get('newPassword') as string | null)?.trim() ?? ''
  const confirmPassword = (formData.get('confirmPassword') as string | null)?.trim() ?? ''
  if (!newPassword || newPassword.length < 8) return { error: 'error_password_too_short' }
  if (newPassword !== confirmPassword) return { error: 'error_passwords_mismatch' }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('different from the old password') || msg.includes('same as the old')) {
      return { error: 'error_same_password' }
    }
    return { error: 'error_generic' }
  }
  return { error: null, success: true }
}
