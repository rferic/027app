import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { routing } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AppHeader } from '@/components/app-header'
import { AppFooter } from '@/components/app-footer'
import { BlockedOverlay } from '@/components/blocked-overlay'
import { Toaster } from '@/components/ui/sonner'
import { AppShell, type NavItem } from '@/components/app-shell'
import { readManifest } from '@/lib/apps/manifest'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!routing.locales.includes(locale as typeof routing.locales[number])) notFound()
  const messages = await getMessages()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Auth guard for all (app) routes except login
  const pathname = (await headers()).get('x-invoke-path') || ''
  if (!user && pathname && !pathname.endsWith('/login')) {
    redirect(`/${locale}/login`)
  }

  let displayName = ''
  let isAdmin = false
  let isBlocked = false

  const adminClient = createAdminClient()

  if (user) {
    const [profileResult, memberResult, authResult] = await Promise.all([
      supabase.from('profiles').select('display_name').eq('id', user.id).single(),
      adminClient.from('group_members').select('role').eq('user_id', user.id).maybeSingle(),
      adminClient.auth.admin.getUserById(user.id),
    ])
    displayName = profileResult.data?.display_name ?? user.email?.split('@')[0] ?? ''
    isAdmin = memberResult.data?.role === 'admin'
    const bannedUntil = authResult.data?.user?.banned_until ?? null
    isBlocked = !!bannedUntil && new Date(bannedUntil) > new Date()
  }

  const { data: activeApps } = await adminClient
    .from('installed_apps')
    .select('slug, visibility')
    .eq('status', 'active')
    .eq('visibility', 'public')

  const navItems: NavItem[] = []
  for (const app of activeApps ?? []) {
    try {
      const manifest = await readManifest(app.slug)
      if (manifest.views.public) {
        navItems.push({
          slug: app.slug,
          label: manifest.name,
          href: `/${locale}/apps/${app.slug}`,
        })
      }
    } catch { /* skip apps with invalid manifests */ }
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <Toaster theme="light" position="bottom-right" />
      <div className="flex flex-col min-h-screen bg-slate-50">
        {user && (
          <AppHeader locale={locale} displayName={displayName} isAdmin={isAdmin} />
        )}
        {user && isBlocked && <BlockedOverlay locale={locale} showSignOut />}
        {user ? (
          <AppShell navItems={navItems} locale={locale}>
            {children}
          </AppShell>
        ) : (
          children
        )}
        <AppFooter locale={locale} />
      </div>
    </NextIntlClientProvider>
  )
}
