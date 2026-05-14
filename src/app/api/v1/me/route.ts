import { NextRequest } from 'next/server'
import { authenticate } from '@/lib/api/auth'
import { apiOk } from '@/lib/api/response'

export async function GET(req: NextRequest) {
  const auth = await authenticate(req, 'jwt')
  if (auth instanceof Response) return auth
  const ctx = auth

  const { data: profile } = await ctx.supabase
    .from('profiles')
    .select('display_name, avatar_url, locale')
    .eq('id', ctx.userId!)
    .maybeSingle()

  return apiOk({
    id: ctx.userId!,
    email: ctx.email ?? '',
    display_name: profile?.display_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
    locale: profile?.locale ?? null,
    role: ctx.role!,
    group_id: ctx.groupId,
  })
}
