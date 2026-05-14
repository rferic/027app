import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { ProfileForm } from './ProfileForm'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('display_name').eq('id', user.id).single()
    : { data: null }

  return (
    <main className="max-w-sm mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href={`/${locale}/`}
          className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
        >
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 mt-3">My profile</h1>
      </div>

      <div className="space-y-6">
        <ProfileForm displayName={profile?.display_name ?? ''} />

        <div className="pt-2">
          <p className="text-sm font-medium text-slate-700 mb-3">Language</p>
          <LocaleSwitcher currentLocale={locale} saveToDb />
          <p className="mt-2 text-xs text-slate-400">
            Changes the language across the entire app.
          </p>
        </div>
      </div>
    </main>
  )
}
