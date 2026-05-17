import todoGetHandler from '../../../apps/todo/routes/GET'
import todoPostHandler from '../../../apps/todo/routes/POST'
import todoPutHandler from '../../../apps/todo/routes/[id]/PUT'
import todoDeleteHandler from '../../../apps/todo/routes/[id]/DELETE'
import type { RouteHandler } from '@/lib/apps/router-types'

interface RouteEntry {
  segments: string[]
  handler: RouteHandler
}

const DYNAMIC_SEGMENT_RE = /^\[.+\]$/

const ROUTE_REGISTRY: Record<string, RouteEntry[]> = {
  todo: [
    { segments: [], handler: todoGetHandler },
    { segments: [], handler: todoPostHandler },
    { segments: ['[id]'], handler: todoPutHandler },
    { segments: ['[id]'], handler: todoDeleteHandler },
  ],
}

function matchSegments(pattern: string[], actual: string[]): boolean {
  if (pattern.length !== actual.length) return false
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] !== actual[i] && !DYNAMIC_SEGMENT_RE.test(pattern[i])) return false
  }
  return true
}

const METHOD_HANDLER_MAP: Record<string, number> = {
  GET: 0,
  POST: 1,
  PUT: 2,
  DELETE: 3,
}

export function getAppRouteHandler(
  slug: string,
  method: string,
  segments: string[]
): RouteHandler | null {
  const routes = ROUTE_REGISTRY[slug]
  if (!routes) return null

  const methodIndex = METHOD_HANDLER_MAP[method]
  if (methodIndex === undefined) return null

  const entry = routes[methodIndex]
  if (!entry) return null

  if (!matchSegments(entry.segments, segments)) return null

  return entry.handler
}
