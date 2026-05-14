import { promises as fs } from 'fs'
import path from 'path'

function i18nPath(slug: string, locale: string): string {
  return path.join(process.cwd(), 'apps', slug, 'i18n', `${locale}.json`)
}

export async function loadAppMessages(
  slug: string,
  locale: string
): Promise<Record<string, unknown>> {
  try {
    const content = await fs.readFile(i18nPath(slug, locale), 'utf-8')
    return JSON.parse(content) as Record<string, unknown>
  } catch {
    if (locale === 'en') return {}
    try {
      const content = await fs.readFile(i18nPath(slug, 'en'), 'utf-8')
      return JSON.parse(content) as Record<string, unknown>
    } catch {
      return {}
    }
  }
}

export async function hasAppI18n(slug: string): Promise<boolean> {
  try {
    await fs.access(path.join(process.cwd(), 'apps', slug, 'i18n'))
    return true
  } catch {
    return false
  }
}
