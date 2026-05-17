import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getUserGroups, getLastGroupCookie } from '@/lib/groups/context'

type Props = { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('home')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const groups = await getUserGroups(user.id)
  if (groups.length === 0) {
    return (
      <main className="p-6 max-w-5xl mx-auto text-center py-24">
        <h2 className="text-base font-semibold text-slate-900 mb-1">{t('noGroups')}</h2>
        <p className="text-sm text-slate-400">{t('noGroupsDesc')}</p>
      </main>
    )
  }

  // Preferir el último grupo visitado, si no, el primero
  const lastSlug = await getLastGroupCookie()
  const targetGroup = lastSlug
    ? groups.find(g => g.slug === lastSlug) ?? groups[0]
    : groups[0]

  redirect(`/${locale}/${targetGroup.slug}/dashboard`)
}
