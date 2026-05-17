'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { getUserGroups } from '@/lib/groups/context'

export async function signIn(email: string, password: string, locale: string) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('banned') || msg.includes('user_banned')) {
      return { error: 'blocked' }
    }
    return { error: error.message }
  }

  if (!user) return { error: 'auth_failed' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('locale')
    .eq('id', user.id)
    .single()

  const targetLocale =
    profile?.locale && routing.locales.includes(profile.locale as typeof routing.locales[number])
      ? profile.locale
      : locale

  const groups = await getUserGroups(user.id)
  const dashboardPath = groups.length > 0
    ? `/${targetLocale}/${groups[0].slug}/dashboard`
    : `/${targetLocale}/`

  redirect(dashboardPath)
}

export async function signOut(locale: string = 'en') {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`/${locale}/login`)
}

export async function signOutAdmin() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const cookieStore = await cookies()
  const raw = cookieStore.get('preferred-locale')?.value
  const locale = raw && routing.locales.includes(raw as typeof routing.locales[number]) ? raw : 'en'
  redirect(`/${locale}/login`)
}
