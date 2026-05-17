import { notFound, redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { resolveGroupContext } from '@/lib/groups/context'
import { routing } from '@/i18n/routing'

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string; 'group-slug': string }>
}

export default async function GroupSlugLayout({ children, params }: Props) {
  const { locale, 'group-slug': groupSlug } = await params
  setRequestLocale(locale)

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound()

  if (!/^[a-z0-9-]+$/.test(groupSlug)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const ctx = await resolveGroupContext(groupSlug, user.id)
  if (!ctx) notFound()

  return children
}
