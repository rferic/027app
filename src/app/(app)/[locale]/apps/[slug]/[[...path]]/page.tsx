import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'

const SLUG_RE = /^[a-z0-9-]+$/

interface Props {
  params: Promise<{ locale: string; slug: string; path?: string[] }>
}

export default async function AppViewPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  if (!SLUG_RE.test(slug)) notFound()

  // Auth and access checks are handled by the parent layout.tsx.
  // The layout runs before this page in Next.js App Router — guaranteed by the framework.

  let ViewComponent: React.ComponentType
  try {
    const mod = await import(/* webpackIgnore: true */ `${process.cwd()}/apps/${slug}/view`)
    ViewComponent = mod.default
  } catch {
    notFound()
  }

  return <ViewComponent />
}
