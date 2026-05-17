import { vi, describe, it, expect } from 'vitest'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveGroupContext, getUserGroups } from '@/lib/groups/context'

vi.mock('@/lib/supabase/admin')

function makeChain(data: unknown, error: unknown = null) {
  const resolved = { data, error }
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

  const proxy = new Proxy(chain, {
    get(target, prop) {
      if (prop in target) return target[prop as string]
      const method = vi.fn(() => proxy)
      target[prop as string] = method
      return method
    },
  })
  return proxy
}

function mockAdminClient(overrides: Record<string, unknown> = {}) {
  const client = new Proxy(
    { auth: { admin: { getUserById: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }) } } },
    {
      get(target, prop) {
        if (prop in target) return target[prop as keyof typeof target]
        if (prop in overrides) return overrides[prop as string]
        return vi.fn(() => makeChain(null))
      },
    }
  )
  vi.mocked(createAdminClient).mockReturnValue(client as any)
  return client
}

describe('resolveGroupContext', () => {
  const userId = 'test-user-id'

  it('returns context when user is member of the group', async () => {
    mockAdminClient({
      from: vi.fn((table: string) => {
        if (table === 'groups') {
          return makeChain({ id: 'g1', name: 'Test Group', slug: 'test-group' })
        }
        if (table === 'group_members') {
          return makeChain({ role: 'member' })
        }
        return makeChain(null)
      }),
    })

    const result = await resolveGroupContext('test-group', userId)
    expect(result).not.toBeNull()
    expect(result!.id).toBe('g1')
    expect(result!.name).toBe('Test Group')
    expect(result!.slug).toBe('test-group')
    expect(result!.role).toBe('member')
  })

  it('returns null when group does not exist', async () => {
    mockAdminClient({
      from: vi.fn((table: string) => {
        if (table === 'groups') return makeChain(null)
        return makeChain(null)
      }),
    })

    const result = await resolveGroupContext('nonexistent', userId)
    expect(result).toBeNull()
  })

  it('returns null when user is not a member', async () => {
    mockAdminClient({
      from: vi.fn((table: string) => {
        if (table === 'groups') {
          return makeChain({ id: 'g1', name: 'Other Group', slug: 'other-group' })
        }
        if (table === 'group_members') {
          return makeChain(null)
        }
        return makeChain(null)
      }),
    })

    const result = await resolveGroupContext('other-group', userId)
    expect(result).toBeNull()
  })
})

describe('getUserGroups', () => {
  const userId = 'test-user-id'

  it('returns all groups the user belongs to', async () => {
    mockAdminClient({
      from: vi.fn((table: string) => {
        if (table === 'group_members') {
          return makeChain([
            { role: 'admin', groups: { id: 'g1', name: 'Family', slug: 'family' } },
            { role: 'member', groups: { id: 'g2', name: 'Work', slug: 'work' } },
          ])
        }
        return makeChain(null)
      }),
    })

    const groups = await getUserGroups(userId)
    expect(groups).toHaveLength(2)
    expect(groups[0].name).toBe('Family')
    expect(groups[0].role).toBe('admin')
    expect(groups[1].name).toBe('Work')
    expect(groups[1].role).toBe('member')
  })

  it('returns empty array when user has no groups', async () => {
    mockAdminClient({
      from: vi.fn(() => makeChain([])),
    })

    const groups = await getUserGroups(userId)
    expect(groups).toHaveLength(0)
  })
})
