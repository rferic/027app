import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getUserGroups } from '@/lib/groups/context'
import { ProfileForm } from '@/components/profile-form'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params
  const supabase = await createClient()
  const t = await getTranslations('profile')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const groups = await getUserGroups(user.id)
  const backHref = groups.length > 0
    ? `/${locale}/${groups[0].slug}/dashboard`
    : `/${locale}/`

  return (
    <main className="max-w-sm mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href={backHref}
          className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
        >
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 mt-3">{t('title')}</h1>
      </div>

      <ProfileForm displayName={profile?.display_name ?? ''} />
    </main>
  )
}
