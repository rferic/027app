import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

type Props = { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: permissions } = await supabase
    .from('app_permissions')
    .select('app_slug, enabled')
    .eq('user_id', user.id)
    .eq('enabled', true)

  const apps = permissions ?? []
  const t = await getTranslations('home')

  return (
    <main className="p-6 max-w-5xl mx-auto">
      {apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">{t('noApps')}</h2>
          <p className="text-sm text-slate-400">{t('noAppsDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {apps.map((app) => (
            <div
              key={app.app_slug}
              className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-sm transition-shadow cursor-pointer"
            >
              <p className="font-medium text-slate-900 capitalize">{app.app_slug}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
