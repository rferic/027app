import { createApiAdminClient } from '@/lib/supabase/api'
import { UseCaseError } from '@/lib/use-cases/types'

export async function revokeApiKey(id: string, groupId: string): Promise<void> {
  const supabase = createApiAdminClient()
  const { data, error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('group_id', groupId)
    .is('revoked_at', null)
    .select('id')

  if (error) throw new UseCaseError('internal_error', error.message)
  if (!data || data.length === 0) throw new UseCaseError('not_found', 'API key not found or already revoked')
}
