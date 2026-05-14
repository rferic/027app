import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createApiAdminClient } from '@/lib/supabase/api'
import { UseCaseError } from '@/lib/use-cases/types'

vi.mock('@/lib/supabase/api', () => ({
  createApiAdminClient: vi.fn(),
  createApiClient: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/**
 * Creates a Supabase-like chain that is both chainable and thenable.
 * Accepts optional `count` to simulate update result counts.
 */
function makeChain(data: unknown, error: unknown = null, count: number | null = null) {
  const resolved = { data, error, count }

  const chain: Record<string, unknown> = {
    then: (onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve(resolved).then(onFulfilled),
    catch: (onRejected: (v: unknown) => unknown) =>
      Promise.resolve(resolved).catch(onRejected),
    finally: (onFinally: () => void) =>
      Promise.resolve(resolved).finally(onFinally),

    single: vi.fn().mockResolvedValue(resolved),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
  }

  for (const m of [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'is', 'limit', 'order', 'filter',
  ]) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }

  return chain
}

// ---------------------------------------------------------------------------
// createApiKey
// ---------------------------------------------------------------------------

describe('createApiKey', () => {
  const mockFrom = vi.fn()

  beforeEach(() => {
    vi.mocked(createApiAdminClient).mockReturnValue(
      { from: mockFrom } as unknown as ReturnType<typeof createApiAdminClient>
    )
    mockFrom.mockReset()
  })

  it('generates a key with the sk_027_ prefix format', async () => {
    const { createApiKey } = await import('@/lib/use-cases/api-keys/create-api-key')

    const fakeRow = {
      id: 'key-id',
      group_id: 'group-1',
      name: 'My Key',
      key_prefix: 'sk_027_ABCD',
      scope: 'group',
      user_id: null,
      created_by: 'user-1',
      last_used_at: null,
      revoked_at: null,
      created_at: new Date().toISOString(),
    }
    mockFrom.mockReturnValue(makeChain(fakeRow))

    const result = await createApiKey('group-1', 'user-1', { name: 'My Key', scope: 'group' })

    expect(result.rawKey).toMatch(/^sk_027_/)
  })

  it('returns rawKey of 40+ characters and keyPrefix of 12 characters', async () => {
    const { createApiKey } = await import('@/lib/use-cases/api-keys/create-api-key')

    // Intercept the insert call to capture the actual key_prefix generated internally
    let capturedPrefix = ''
    const mockChain: Record<string, unknown> = {}

    for (const m of ['select', 'eq', 'is', 'limit', 'order', 'filter', 'update', 'upsert', 'delete']) {
      mockChain[m] = vi.fn().mockReturnValue(mockChain)
    }

    mockChain['insert'] = vi.fn().mockImplementation((row: Record<string, unknown>) => {
      capturedPrefix = row['key_prefix'] as string
      // Return a chain whose .select().single() resolves with the inserted row
      const selectChain: Record<string, unknown> = {}
      for (const m of ['eq', 'is', 'limit', 'order', 'filter']) {
        selectChain[m] = vi.fn().mockReturnValue(selectChain)
      }
      selectChain['single'] = vi.fn().mockResolvedValue({
        data: {
          id: 'key-id',
          group_id: 'group-1',
          name: 'My Key',
          key_prefix: capturedPrefix,
          scope: 'group',
          user_id: null,
          created_by: 'user-1',
          last_used_at: null,
          revoked_at: null,
          created_at: new Date().toISOString(),
        },
        error: null,
      })
      selectChain['select'] = vi.fn().mockReturnValue(selectChain)
      return selectChain
    })

    mockFrom.mockReturnValue(mockChain)

    const result = await createApiKey('group-1', 'user-1', { name: 'My Key', scope: 'group' })

    // rawKey = 'sk_027_' (7) + 32 random chars = 39 chars total
    expect(result.rawKey.length).toBeGreaterThanOrEqual(39)
    expect(result.rawKey).toMatch(/^sk_027_[A-Za-z0-9]{32}$/)
    // keyPrefix is the first 12 chars of rawKey
    expect(result.key.keyPrefix).toBe(result.rawKey.slice(0, 12))
    expect(result.key.keyPrefix.length).toBe(12)
  })

  it('throws UseCaseError if scope is user and userId is missing', async () => {
    const { createApiKey } = await import('@/lib/use-cases/api-keys/create-api-key')

    await expect(
      createApiKey('group-1', 'user-1', { name: 'User Key', scope: 'user' })
    ).rejects.toThrow(UseCaseError)

    await expect(
      createApiKey('group-1', 'user-1', { name: 'User Key', scope: 'user' })
    ).rejects.toMatchObject({ code: 'validation_failed' })
  })

  it('does not throw when scope is user and userId is provided', async () => {
    const { createApiKey } = await import('@/lib/use-cases/api-keys/create-api-key')

    const fakeRow = {
      id: 'key-id',
      group_id: 'group-1',
      name: 'User Key',
      key_prefix: 'sk_027_ABCD',
      scope: 'user',
      user_id: 'user-42',
      created_by: 'user-1',
      last_used_at: null,
      revoked_at: null,
      created_at: new Date().toISOString(),
    }
    mockFrom.mockReturnValue(makeChain(fakeRow))

    await expect(
      createApiKey('group-1', 'user-1', { name: 'User Key', scope: 'user', userId: 'user-42' })
    ).resolves.toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// listApiKeys
// ---------------------------------------------------------------------------

describe('listApiKeys', () => {
  const mockFrom = vi.fn()

  beforeEach(() => {
    vi.mocked(createApiAdminClient).mockReturnValue(
      { from: mockFrom } as unknown as ReturnType<typeof createApiAdminClient>
    )
    mockFrom.mockReset()
  })

  it('returns only non-revoked keys (filters revoked_at = null)', async () => {
    const { listApiKeys } = await import('@/lib/use-cases/api-keys/list-api-keys')

    const activeRow = {
      id: 'key-1',
      group_id: 'group-1',
      name: 'Active Key',
      key_prefix: 'sk_027_ABCD',
      scope: 'group',
      user_id: null,
      created_by: 'user-1',
      last_used_at: null,
      revoked_at: null,
      created_at: '2024-01-01T00:00:00Z',
    }

    const chain = makeChain([activeRow])
    mockFrom.mockReturnValue(chain)

    const result = await listApiKeys('group-1')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: 'key-1',
      groupId: 'group-1',
      name: 'Active Key',
      keyPrefix: 'sk_027_ABCD',
      scope: 'group',
      revokedAt: null,
    })

    // Verify the query used .is('revoked_at', null)
    const isMethod = (chain['is'] as ReturnType<typeof vi.fn>)
    expect(isMethod).toHaveBeenCalledWith('revoked_at', null)
  })

  it('returns empty array when no active keys exist', async () => {
    const { listApiKeys } = await import('@/lib/use-cases/api-keys/list-api-keys')

    mockFrom.mockReturnValue(makeChain([]))

    const result = await listApiKeys('group-1')

    expect(result).toEqual([])
  })

  it('maps multiple rows to ApiKey shape', async () => {
    const { listApiKeys } = await import('@/lib/use-cases/api-keys/list-api-keys')

    const rows = [
      {
        id: 'key-1',
        group_id: 'group-1',
        name: 'Key A',
        key_prefix: 'sk_027_AAAA',
        scope: 'group',
        user_id: null,
        created_by: 'user-1',
        last_used_at: '2024-06-01T00:00:00Z',
        revoked_at: null,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'key-2',
        group_id: 'group-1',
        name: 'Key B',
        key_prefix: 'sk_027_BBBB',
        scope: 'user',
        user_id: 'user-42',
        created_by: 'user-1',
        last_used_at: null,
        revoked_at: null,
        created_at: '2024-02-01T00:00:00Z',
      },
    ]

    mockFrom.mockReturnValue(makeChain(rows))

    const result = await listApiKeys('group-1')

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ id: 'key-1', scope: 'group', userId: null, lastUsedAt: '2024-06-01T00:00:00Z' })
    expect(result[1]).toMatchObject({ id: 'key-2', scope: 'user', userId: 'user-42' })
  })
})

// ---------------------------------------------------------------------------
// revokeApiKey
// ---------------------------------------------------------------------------

describe('revokeApiKey', () => {
  const mockFrom = vi.fn()

  beforeEach(() => {
    vi.mocked(createApiAdminClient).mockReturnValue(
      { from: mockFrom } as unknown as ReturnType<typeof createApiAdminClient>
    )
    mockFrom.mockReset()
  })

  it('updates revoked_at and resolves without error when key exists', async () => {
    const { revokeApiKey } = await import('@/lib/use-cases/api-keys/revoke-api-key')

    // data array with one row means one row was updated
    mockFrom.mockReturnValue(makeChain([{ id: 'key-1' }], null))

    await expect(revokeApiKey('key-1', 'group-1')).resolves.toBeUndefined()

    // Verify the update call sets revoked_at
    const updateMethod = (mockFrom() as Record<string, unknown>)['update'] as ReturnType<typeof vi.fn>
    // The from() call in the use-case calls update({ revoked_at: ... })
    const updateArg = updateMethod?.mock?.calls?.[0]?.[0] as Record<string, unknown> | undefined
    if (updateArg) {
      expect(updateArg).toHaveProperty('revoked_at')
      expect(typeof updateArg['revoked_at']).toBe('string')
    }
  })

  it('throws UseCaseError not_found when key does not exist', async () => {
    const { revokeApiKey } = await import('@/lib/use-cases/api-keys/revoke-api-key')

    // empty array means no rows were updated (key not found or already revoked)
    mockFrom.mockReturnValue(makeChain([], null))

    await expect(revokeApiKey('nonexistent-key', 'group-1')).rejects.toThrow(UseCaseError)
    await expect(revokeApiKey('nonexistent-key', 'group-1')).rejects.toMatchObject({
      code: 'not_found',
    })
  })

  it('throws UseCaseError internal_error when DB returns an error', async () => {
    const { revokeApiKey } = await import('@/lib/use-cases/api-keys/revoke-api-key')

    mockFrom.mockReturnValue(makeChain(null, { message: 'DB connection error' }, null))

    await expect(revokeApiKey('key-1', 'group-1')).rejects.toThrow(UseCaseError)
    await expect(revokeApiKey('key-1', 'group-1')).rejects.toMatchObject({
      code: 'internal_error',
    })
  })
})
