import { createApiAdminClient } from '@/lib/supabase/api'
import { UseCaseError } from '@/lib/use-cases/types'
import { mapRow } from './types'
import type { ApiKeyScope, ApiKey } from './types'

interface CreateApiKeyInput {
  name: string
  scope: ApiKeyScope
  userId?: string  // requerido si scope === 'user'
}

interface CreateApiKeyResult {
  key: ApiKey
  rawKey: string  // solo se retorna una vez, nunca se almacena
}

function generateApiKey(): { raw: string; prefix: string } {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const random = Array.from(bytes, b => chars[b % chars.length]).join('')
  const raw = `sk_027_${random}`
  return { raw, prefix: raw.slice(0, 12) }
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function createApiKey(
  groupId: string,
  createdBy: string,
  input: CreateApiKeyInput
): Promise<CreateApiKeyResult> {
  if (input.scope === 'user' && !input.userId) {
    throw new UseCaseError('validation_failed', 'userId is required for user-scoped keys')
  }

  const { raw, prefix } = generateApiKey()
  const hash = await sha256(raw)

  const supabase = createApiAdminClient()
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      group_id: groupId,
      name: input.name,
      key_prefix: prefix,
      key_hash: hash,
      created_by: createdBy,
      scope: input.scope,
      user_id: input.userId ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    throw new UseCaseError('internal_error', error?.message ?? 'Failed to create API key')
  }

  return {
    rawKey: raw,
    key: mapRow(data),
  }
}

