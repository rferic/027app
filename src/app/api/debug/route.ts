import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  const results: Record<string, unknown> = {
    env: { urlSet: !!url, keySet: !!key },
  }

  try {
    const supabase = createClient(url!, key!, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data, count, error } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')
    results.query = { data, count, error: error ? { message: error.message, code: error.code, details: error.details, hint: error.hint } : null }
  } catch (err) {
    results.catchError = err instanceof Error ? err.message : String(err)
  }

  try {
    const supabase2 = createClient(url!, key!, { auth: { autoRefreshToken: false, persistSession: false } })
    const { error: rpcError, data: rpcData } = await supabase2.rpc('version')
    results.rpc = { data: rpcData, error: rpcError }
  } catch (err) {
    results.rpcError = err instanceof Error ? err.message : String(err)
  }

  return Response.json(results)
}
