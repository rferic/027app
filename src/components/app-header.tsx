import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { LocaleSwitcher } from './locale-switcher'
import { UserDropdown } from './user-dropdown'
import { getGroupSettings } from '@/lib/use-cases/settings'

interface Props {
  locale: string
  displayName: string
  isAdmin: boolean
}

export async function AppHeader({ locale, displayName, isAdmin }: Props) {
  const [tNav, settings] = await Promise.all([
    getTranslations('nav'),
    getGroupSettings(),
  ])

  return (
    <header className="h-14 border-b border-slate-100 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-5">
        <Link href={`/${locale}/`} className="flex items-center gap-2">
          <img src="/logo-icon.svg" alt="027Apps" width={26} height={26} />
          <span className="font-semibold text-slate-900 text-sm">027Apps</span>
        </Link>
        {isAdmin && (
          <Link
            href={`/${locale}/admin/dashboard`}
            className="text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
          >
            {tNav('backoffice')} →
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        <LocaleSwitcher currentLocale={locale} locales={settings.activeLocales} saveToDb />
        <UserDropdown locale={locale} displayName={displayName} />
      </div>
    </header>
  )
}
