import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const VALID_LOCALES = ['en', 'es', 'it'] as const
type Locale = typeof VALID_LOCALES[number]

export default async function RootPage() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('preferred-locale')?.value
  const locale: Locale = VALID_LOCALES.includes(raw as Locale) ? (raw as Locale) : 'en'
  redirect(`/${locale}/`)
}
