import { type NextRequest } from 'next/server'
import { authenticate } from '@/lib/api/auth'
import { apiOk, apiError } from '@/lib/api/response'
import { createAdminClientUntyped } from '@/lib/supabase/admin'

export default async function handler(req: NextRequest) {
  const auth = await authenticate(req, 'jwt')
  if (auth instanceof Response) return auth
  if (!auth.userId) return apiError('UNAUTHORIZED', 'User ID required', 401)

  // Extract ID from URL: /api/v1/apps/todo/{id}
  const parsedUrl = new URL(req.url)
  const segments = parsedUrl.pathname.split('/')
  const id = segments[segments.length - 1]
  if (!id) return apiError('BAD_REQUEST', 'Missing todo ID', 400)

  const groupId = parsedUrl.searchParams.get('group_id')
  if (!groupId) return apiError('MISSING_GROUP_ID', 'group_id query parameter is required', 400)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON body', 400)
  }
  if (typeof body !== 'object' || body === null) {
    return apiError('BAD_REQUEST', 'Body must be an object', 400)
  }
  const { title, completed } = body as Record<string, unknown>

  const updates: Record<string, unknown> = {}
  if (typeof title === 'string' && title.trim()) updates.title = title.trim()
  if (typeof completed === 'boolean') updates.completed = completed

  if (Object.keys(updates).length === 0) {
    return apiError('VALIDATION_ERROR', 'No valid fields to update', 422)
  }

  const adminClient = createAdminClientUntyped()
  const { data, error } = await adminClient
    .from('todo_items')
    .update(updates)
    .eq('id', id)
    .eq('group_id', groupId)
    .eq('user_id', auth.userId)
    .select('id, title, completed, created_at')
    .single()

  if (error) return apiError('UPDATE_ERROR', error.message, 500)
  if (!data) return apiError('NOT_FOUND', 'Todo not found', 404)
  return apiOk(data)
}
