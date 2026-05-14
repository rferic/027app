import { source } from '@/lib/source'
import { DocsPage, DocsBody, DocsTitle, DocsDescription } from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'
import defaultMdxComponents from 'fumadocs-ui/mdx'

interface Props {
  params: Promise<{ locale: string; slug?: string[] }>
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params
  const page = source.getPage(slug, locale)
  if (!page) notFound()

  const MDX = page.data.body

  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={defaultMdxComponents} />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams('slug', 'locale')
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params
  const page = source.getPage(slug, locale)
  if (!page) notFound()
  return { title: page.data.title, description: page.data.description }
}
