import { loader } from 'fumadocs-core/source'
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server'
import { docs, meta } from '@/.source/server'

export const i18nConfig = {
  defaultLanguage: 'en',
  languages: ['en', 'es', 'it', 'ca', 'fr', 'de'],
  parser: 'dir' as const,
}

export const source = loader({
  baseUrl: '/doc',
  source: toFumadocsSource(docs, meta),
  i18n: i18nConfig,
  // Fumadocs default generates /en/doc/... which matches our /(doc)/[locale]/doc/ route.
  url(slugs, locale) {
    const lang = locale ?? i18nConfig.defaultLanguage
    const path = slugs.join('/')
    return `/${lang}/doc${path ? `/${path}` : ''}`
  },
})
