import { getTranslations } from 'next-intl/server'
import { AppLoginForm } from '@/components/auth/AppLoginForm'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { getGroupSettings } from '@/lib/use-cases/settings'

type Props = { params: Promise<{ locale: string }> }

export default async function LoginPage({ params }: Props) {
  const { locale } = await params
  const [t, settings] = await Promise.all([
    getTranslations('auth'),
    getGroupSettings(),
  ])

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <LocaleSwitcher currentLocale={locale} locales={settings.activeLocales} targetPath="login" />
        </div>

        <div className="flex flex-col items-center mb-8">
          <img src="/logo-icon.svg" alt="027Apps" width={56} height={56} className="mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">027Apps</h1>
          <p className="text-sm text-slate-400 mt-1">{t('subtitle')}</p>
        </div>

        <div className="mt-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <AppLoginForm locale={locale} />
        </div>
      </div>
    </div>
  )
}
