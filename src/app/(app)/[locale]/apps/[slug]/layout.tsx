import { notFound, redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { readManifest } from '@/lib/apps/manifest'
import { resolveAppConfig } from '@/lib/apps/config'
import { AppValidationError } from '@/types/apps'
import AppProvider from '@/components/app-provider'
import AppTheme from '@/components/app-theme'

const SLUG_RE = /^[a-z0-9-]+$/

import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  params: Promise<{ locale: string; slug: string }>
}

export default async function AppSlugLayout({ children, params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  if (!SLUG_RE.test(slug)) notFound()

  let manifest
  try {
    manifest = await readManifest(slug)
  } catch (err) {
    if (err instanceof AppValidationError) notFound()
    throw err
  }

  const adminClient = createAdminClient()
  const { data: installedApp } = await adminClient
    .from('installed_apps')
    .select('status, visibility, config')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!installedApp) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  if (installedApp.visibility === 'private') {
    const { data: permission } = await adminClient
      .from('app_permissions')
      .select('enabled')
      .eq('app_slug', slug)
      .eq('user_id', user.id)
      .eq('enabled', true)
      .single()
    if (!permission) notFound()
  }

  const resolvedConfig = resolveAppConfig(manifest, (installedApp.config as Record<string, unknown>) ?? {})

  return (
    <AppTheme primaryColor={manifest.primaryColor} secondaryColor={manifest.secondaryColor}>
      <AppProvider slug={slug} manifest={manifest} config={resolvedConfig}>
        {children}
      </AppProvider>
    </AppTheme>
  )
}
