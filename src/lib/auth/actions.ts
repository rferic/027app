'use server'

import { cookies } from 'next/headers'
import { signIn, signOut as _signOut, signOutAdmin as _signOutAdmin } from '@/lib/use-cases/auth'
import { createClient } from '@/lib/supabase/server'
import { routing } from '@/i18n/routing'

export async function signInWithPassword(email: string, password: string, locale: string) {
  return signIn(email, password, locale)
}

export async function signOut(locale?: string) {
  return _signOut(locale)
}

export async function signOutAdmin() {
  return _signOutAdmin()
}

export async function updateLocale(locale: string): Promise<void> {
  if (!routing.locales.includes(locale as typeof routing.locales[number])) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('profiles')
    .update({ locale })
    .eq('id', user.id)

  const cookieStore = await cookies()
  cookieStore.set('preferred-locale', locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  })
}
