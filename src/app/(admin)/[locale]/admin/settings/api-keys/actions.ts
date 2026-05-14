'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/helpers'
import { createApiKey } from '@/lib/use-cases/api-keys/create-api-key'
import { revokeApiKey } from '@/lib/use-cases/api-keys/revoke-api-key'
import { revalidatePath } from 'next/cache'

export async function createApiKeyAction(name: string): Promise<
  { rawKey: string; id: string } | { error: string }
> {
  try {
    const { userId } = await requireAdmin()

    const admin = createAdminClient()
    const { data: group } = await admin.from('groups').select('id').limit(1).single()
    if (!group) return { error: 'No group found' }

    const result = await createApiKey(group.id, userId, { name, scope: 'group' })
    revalidatePath('/admin/settings/api-keys')
    return { rawKey: result.rawKey, id: result.key.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create API key' }
  }
}

export async function revokeApiKeyAction(id: string): Promise<{ error: string | null }> {
  try {
    await requireAdmin()

    const admin = createAdminClient()
    const { data: group } = await admin.from('groups').select('id').limit(1).single()
    if (!group) return { error: 'No group found' }

    await revokeApiKey(id, group.id)
    revalidatePath('/admin/settings/api-keys')
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to revoke API key' }
  }
}
