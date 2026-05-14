import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { createMDX } from 'fumadocs-mdx/next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
const withMDX = createMDX({ outDir: 'src/.source' })

const config: NextConfig = {
  turbopack: { root: process.cwd() },
}

export default withMDX(withNextIntl(config))
