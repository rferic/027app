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
    const { error: rpcError, data: rpcData, count: profilesCount } = await supabase2
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    results.profiles = { data: rpcData, count: profilesCount, error: rpcError ? { message: rpcError.message, code: rpcError.code } : null }
  } catch (err) {
    results.profilesError = err instanceof Error ? err.message : String(err)
  }

  try {
    const supabase3 = createClient(url!, key!, { auth: { autoRefreshToken: false, persistSession: false } })
    const { error: rpcError, data: rpcData } = await supabase3
      .from('groups')
      .select('*', { count: 'exact', head: true })
    results.groups = { data: rpcData, error: rpcError ? { message: rpcError.message, code: rpcError.code } : null }
  } catch (err) {
    results.groupsError = err instanceof Error ? err.message : String(err)
  }

  try {
    const supabase4 = createClient(url!, key!, { auth: { autoRefreshToken: false, persistSession: false } })
    const response = await supabase4.rest.post('/rpc/', { query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'" }, {
      headers: { 'Content-Profile': 'public' },
    })
    results.rawQuery = { status: response.status, data: response.data }
  } catch (err) {
    results.rawQueryError = err instanceof Error ? err.message : String(err)
  }

  return Response.json(results)
}
