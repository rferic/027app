import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const keySet = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const urlSet = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const urlValue = process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabase = createAdminClient()
  const { count, error } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')

  return Response.json({
    env: { urlSet, keySet, url: urlValue },
    query: { count, error: error ? { message: error.message, code: error.code, details: error.details } : null },
  })
}
