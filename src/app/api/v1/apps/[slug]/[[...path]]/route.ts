import { type NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/response'

const SLUG_RE = /^[a-z0-9-]+$/
const DYNAMIC_SEGMENT_RE = /^\[.+\]$/

type RouteHandler = (req: NextRequest) => Promise<Response> | Response

interface HandlerModule {
  default?: RouteHandler
}

async function dirExists(p: string): Promise<boolean> {
  try {
    const stat = await fs.stat(p)
    return stat.isDirectory()
  } catch {
    return false
  }
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

/**
 * Resolves the file path for an app route handler.
 * Supports dynamic segments (dirs named [param]).
 * Example: segments=["123"], method="PUT" → routes/[id]/PUT.ts
 */
async function resolveHandlerPath(
  routesDir: string,
  segments: string[],
  method: string
): Promise<string | null> {
  let currentDir = routesDir

  if (!(await dirExists(currentDir))) return null

  for (const segment of segments) {
    const exactDir = path.join(currentDir, segment)
    if (await dirExists(exactDir)) {
      currentDir = exactDir
      continue
    }

    // Try dynamic segment directory
    let entries: string[] = []
    try {
      entries = await fs.readdir(currentDir)
    } catch {
      return null
    }
    const dynamicDir = entries.find(e => DYNAMIC_SEGMENT_RE.test(e))
    if (!dynamicDir) return null
    currentDir = path.join(currentDir, dynamicDir)
  }

  const handlerFile = path.join(currentDir, `${method}.ts`)
  if (await fileExists(handlerFile)) return handlerFile

  return null
}

async function dispatch(req: NextRequest, slug: string, segments: string[]): Promise<Response> {
  if (!SLUG_RE.test(slug)) return apiError('INVALID_SLUG', 'Invalid app slug', 400)

  const adminClient = createAdminClient()
  const { data: app } = await adminClient
    .from('installed_apps')
    .select('status')
    .eq('slug', slug)
    .single()

  if (!app || app.status !== 'active') {
    return apiError('NOT_FOUND', 'App not found or not active', 404)
  }

  const method = req.method.toUpperCase()
  const routesDir = path.join(process.cwd(), 'apps', slug, 'routes')
  const handlerPath = await resolveHandlerPath(routesDir, segments, method)

  if (!handlerPath) {
    return apiError('NOT_FOUND', 'Route not found', 404)
  }

  let mod: HandlerModule
  try {
    mod = await import(/* webpackIgnore: true */ handlerPath) as HandlerModule
  } catch {
    return apiError('NOT_FOUND', 'Route not found', 404)
  }

  const handler = mod.default
  if (typeof handler !== 'function') {
    return apiError('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
  }

  return handler(req)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string; path?: string[] }> }) {
  const { slug, path: segments = [] } = await params
  return dispatch(req, slug, segments)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string; path?: string[] }> }) {
  const { slug, path: segments = [] } = await params
  return dispatch(req, slug, segments)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string; path?: string[] }> }) {
  const { slug, path: segments = [] } = await params
  return dispatch(req, slug, segments)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string; path?: string[] }> }) {
  const { slug, path: segments = [] } = await params
  return dispatch(req, slug, segments)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string; path?: string[] }> }) {
  const { slug, path: segments = [] } = await params
  return dispatch(req, slug, segments)
}
