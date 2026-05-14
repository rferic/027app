import { createApiAdminClient } from '@/lib/supabase/api'
import { UseCaseError } from '@/lib/use-cases/types'
import { mapRow } from './types'
import type { ApiKey } from './types'

export async function listApiKeys(groupId: string): Promise<ApiKey[]> {
  const supabase = createApiAdminClient()
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('group_id', groupId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })

  if (error) throw new UseCaseError('internal_error', error.message)
  return (data ?? []).map(row => mapRow(row as Record<string, unknown>))
}
