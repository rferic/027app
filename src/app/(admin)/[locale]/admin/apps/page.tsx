import { setRequestLocale, getTranslations } from 'next-intl/server'
import { getAppsListAction } from '@/lib/apps/actions'
import { AppsManager } from './AppsManager'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function AppsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin.apps')

  const result = await getAppsListAction()
  const apps = 'apps' in result ? result.apps : []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('subtitle')}</p>
      </div>
      <AppsManager initialApps={apps} />
    </div>
  )
}
