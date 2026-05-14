import { type NextRequest } from 'next/server'
import { authenticate } from '@/lib/api/auth'
import { apiOk, apiError } from '@/lib/api/response'
import { createAdminClientUntyped } from '@/lib/supabase/admin'

export default async function handler(req: NextRequest) {
  const auth = await authenticate(req, 'jwt')
  if (auth instanceof Response) return auth
  if (!auth.userId) return apiError('UNAUTHORIZED', 'User ID required', 401)

  const segments = new URL(req.url).pathname.split('/')
  const id = segments[segments.length - 1]
  if (!id) return apiError('BAD_REQUEST', 'Missing todo ID', 400)

  const adminClient = createAdminClientUntyped()
  const { error } = await adminClient
    .from('todo_items')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.userId)

  if (error) return apiError('DELETE_ERROR', error.message, 500)
  return apiOk({ deleted: true })
}
