import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'
import { scanInstalledAppSlugs } from '@/lib/apps/scanner'
import { loadAppMessages } from '@/lib/apps/i18n'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale
  }

  const globalMessages = (await import(`./messages/${locale}.json`)).default

  let appMessages: Record<string, Record<string, unknown>> = {}
  try {
    const slugs = await scanInstalledAppSlugs()
    const entries = await Promise.all(
      slugs.map(async (slug) => [slug, await loadAppMessages(slug, locale)] as const)
    )
    appMessages = Object.fromEntries(entries)
  } catch {
    // DB not available (e.g. build time) — continue without app messages
  }

  return {
    locale,
    messages: {
      ...globalMessages,
      apps: {
        // Preserve existing keys from globalMessages.apps (errors, title, status, permissions, etc.)
        ...(typeof globalMessages.apps === 'object' && globalMessages.apps !== null ? globalMessages.apps : {}),
        // Merge per-app i18n namespaces under apps.{slug}
        ...appMessages,
      },
    },
  }
})
