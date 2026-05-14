'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/helpers'
import { LOCALES, type Locale } from '@/i18n/routing'

export type ProfileState = { error: string | null; success?: boolean }
export type PasswordState = { error: string | null; success?: boolean }

async function getLocale(): Promise<string> {
  const store = await cookies()
  const raw = store.get('preferred-locale')?.value
  return raw && (LOCALES as readonly string[]).includes(raw) ? raw : 'en'
}

export async function updateProfileAction(_prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const { userId } = await requireAdmin()
  const displayName = (formData.get('displayName') as string | null)?.trim() ?? ''
  const locale = formData.get('locale') as string | null
  if (!displayName) return { error: 'Name is required' }
  if (!locale || !(LOCALES as readonly string[]).includes(locale)) return { error: 'Invalid locale' }
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ display_name: displayName, locale: locale as Locale }).eq('id', userId)
  if (error) return { error: error.message }
  const resolvedLocale = await getLocale()
  revalidatePath(`/${resolvedLocale}/admin/profile`)
  return { error: null, success: true }
}

export async function changePasswordAction(_prevState: PasswordState, formData: FormData): Promise<PasswordState> {
  await requireAdmin()
  const newPassword = (formData.get('newPassword') as string | null)?.trim() ?? ''
  const confirmPassword = (formData.get('confirmPassword') as string | null)?.trim() ?? ''
  if (!newPassword || newPassword.length < 8) return { error: 'Password must be at least 8 characters' }
  if (newPassword !== confirmPassword) return { error: 'Passwords do not match' }
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }
  return { error: null, success: true }
}
