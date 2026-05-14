import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ lang: string; slug?: string[] }>
}

// This route is superseded by (doc)/[locale]/doc/[[...slug]].
// The proxy redirects all /doc/... to /{locale}/doc/... before reaching here,
// but this remains as a safety-net redirect.
export default async function Page({ params }: Props) {
  const { lang, slug } = await params
  const slugPath = slug?.length ? `/${slug.join('/')}` : ''
  redirect(`/${lang}/doc${slugPath}`)
}

export async function generateStaticParams() {
  return []
}
