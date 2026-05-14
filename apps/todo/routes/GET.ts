import { type NextRequest } from 'next/server'
import { authenticate } from '@/lib/api/auth'
import { apiOk, apiError } from '@/lib/api/response'
import { createAdminClientUntyped } from '@/lib/supabase/admin'

export default async function handler(req: NextRequest) {
  const auth = await authenticate(req, 'jwt')
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const showAll = url.searchParams.get('all') === 'true' && auth.role === 'admin'

  const adminClient = createAdminClientUntyped()

  if (showAll) {
    const { data, error } = await adminClient
      .from('todo_items')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return apiError('QUERY_ERROR', error.message, 500)
    return apiOk(data)
  }

  if (!auth.userId) return apiError('UNAUTHORIZED', 'User ID required', 401)

  const { data, error } = await adminClient
    .from('todo_items')
    .select('id, title, completed, created_at')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })

  if (error) return apiError('QUERY_ERROR', error.message, 500)
  return apiOk(data)
}
