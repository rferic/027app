import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['es', 'en', 'it', 'ca', 'fr', 'de'],
  defaultLocale: 'en',
  localePrefix: 'always',
})

export const LOCALES = routing.locales
export type Locale = typeof LOCALES[number]

export const LOCALE_LABELS: Record<string, string> = {
  es: 'Español',
  en: 'English',
  it: 'Italiano',
  ca: 'Català',
  fr: 'Français',
  de: 'Deutsch',
}
