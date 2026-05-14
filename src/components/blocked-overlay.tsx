'use client'

import { useTranslations } from 'next-intl'
import { signOut } from '@/lib/auth/actions'

interface Props {
  locale: string
  showSignOut?: boolean
}

export function BlockedOverlay({ locale, showSignOut = false }: Props) {
  const t = useTranslations('auth')

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center text-center px-6">
      <div className="max-w-sm space-y-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-600"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">{t('blockedTitle')}</h1>
        <p className="text-sm text-slate-500">{t('blockedDesc')}</p>
        {showSignOut && (
          <form action={signOut.bind(null, locale)}>
            <button
              type="submit"
              className="mt-2 px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {t('logout')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
