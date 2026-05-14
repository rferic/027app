'use client'

import { useRouter, usePathname } from 'next/navigation'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { i18nConfig } from '@/lib/source'
import type { ReactNode } from 'react'

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Español',
  it: 'Italiano',
  ca: 'Català',
  fr: 'Français',
  de: 'Deutsch',
}

interface Props {
  locale: string
  children: ReactNode
}

export function DocRootProvider({ locale, children }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <RootProvider
      i18n={{
        locale,
        locales: i18nConfig.languages.map((l) => ({
          locale: l,
          name: LOCALE_NAMES[l] ?? l,
        })),
        onLocaleChange: (newLocale) => {
          const newPath = pathname.replace(
            new RegExp(`^/${locale}/doc(/|$)`),
            `/${newLocale}/doc/`,
          )
          router.push(newPath)
        },
      }}
    >
      {children}
    </RootProvider>
  )
}
