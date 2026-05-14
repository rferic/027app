export type ApiKeyScope = 'group' | 'user'

export interface ApiKey {
  id: string
  groupId: string
  name: string
  keyPrefix: string
  scope: ApiKeyScope
  userId: string | null
  createdBy: string | null
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
}

export function mapRow(row: Record<string, unknown>): ApiKey {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    name: row.name as string,
    keyPrefix: row.key_prefix as string,
    scope: row.scope as ApiKeyScope,
    userId: (row.user_id as string) ?? null,
    createdBy: (row.created_by as string) ?? null,
    lastUsedAt: (row.last_used_at as string) ?? null,
    revokedAt: (row.revoked_at as string) ?? null,
    createdAt: row.created_at as string,
  }
}
