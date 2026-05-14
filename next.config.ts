import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { createMDX } from 'fumadocs-mdx/next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
const withMDX = createMDX({ outDir: 'src/.source' })

const config: NextConfig = {
  turbopack: { root: process.cwd() },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default withMDX(withNextIntl(config))
