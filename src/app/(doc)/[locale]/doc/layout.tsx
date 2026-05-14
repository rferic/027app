import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import type { ReactNode } from 'react'
import { source, i18nConfig } from '@/lib/source'
import { DocRootProvider } from './language-provider'
import Image from 'next/image'
import './fumadocs-styles.css'

interface Props {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function DocLayout({ children, params }: Props) {
  const { locale } = await params
  const tree = source.pageTree as Record<string, import('fumadocs-core/page-tree').Root>
  const pageTree = tree[locale] ?? tree[i18nConfig.defaultLanguage]

  return (
    <DocRootProvider locale={locale}>
      <style>{`
        :root {
          --color-fd-primary: oklch(0.36 0.148 18.5);
          --color-fd-primary-foreground: hsl(0, 0%, 98%);
          --color-fd-ring: oklch(0.36 0.148 18.5);
        }
        button:not([disabled]),
        [role='button']:not([aria-disabled='true']) {
          cursor: pointer;
        }
        /* Fix: TOC vertical line overlaps subsection titles.
           TOCItem links have ps-3/ps-6/ps-8 from Tailwind utilities.
           We bump padding-inline-start by 4px so titles clear the border-s + w-px thumb. */
        aside a.ps-3 { padding-inline-start: 1rem !important; }
        aside a.ps-6 { padding-inline-start: 1.75rem !important; }
        aside a.ps-8 { padding-inline-start: 2.5rem !important; }
      `}</style>
      <DocsLayout
        tree={pageTree}
        nav={{
          title: (
            <>
              <Image src="/logo.svg" alt="027Apps" width={120} height={28} priority className="dark:hidden" />
              <Image src="/logo-dark.svg" alt="027Apps" width={120} height={28} priority className="hidden dark:block" />
            </>
          ),
        }}
      >
        {children}
      </DocsLayout>
    </DocRootProvider>
  )
}
