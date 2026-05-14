import { promises as fs } from 'fs'
import path from 'path'
import { createAdminClient } from '@/lib/supabase/admin'

const SLUG_RE = /^[a-z0-9-]+$/

const CONTENT_TYPES: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  ico: 'image/x-icon',
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; filename: string }> }
) {
  const { slug, filename } = await params

  if (!SLUG_RE.test(slug) || filename.includes('..') || filename.startsWith('/')) {
    return new Response('Not Found', { status: 404 })
  }

  const admin = createAdminClient()
  const { data: app } = await admin
    .from('installed_apps')
    .select('slug')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!app) return new Response('Not Found', { status: 404 })

  const filePath = path.join(process.cwd(), 'apps', slug, 'assets', filename)
  let buffer: Buffer
  try {
    buffer = await fs.readFile(filePath)
  } catch {
    return new Response('Not Found', { status: 404 })
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream'

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
