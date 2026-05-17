import { vi, describe, it, expect } from 'vitest'

// Mock de next/cache y next/headers
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'en' })),
    set: vi.fn(),
  })),
}))

import { createAdminClient } from '@/lib/supabase/admin'
import { addUserToGroupAction, removeUserFromGroupAction } from '@/app/(admin)/[locale]/admin/users/[id]/actions'

vi.mock('@/lib/supabase/admin')
vi.mock('@/lib/auth/helpers', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ userId: 'admin-id' }),
}))

function makeChain(data: unknown, error: unknown = null) {
  const resolved = { data, error }
  const chain: Record<string, unknown> = {
    then: (onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve(resolved).then(onFulfilled),
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

describe('addUserToGroupAction', () => {
  it('inserts user into group_members', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'group_members') {
          return makeChain(null) // existing = null (no duplicate)
        }
        return makeChain(null)
      }),
    }
    vi.mocked(createAdminClient).mockReturnValue(mockClient as any)

    const result = await addUserToGroupAction('user-1', 'group-1')
    expect(result.error).toBeNull()
  })

  it('returns error when user already a member', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'group_members') {
          return makeChain({ id: 'existing' })
        }
        return makeChain(null)
      }),
    }
    vi.mocked(createAdminClient).mockReturnValue(mockClient as any)

    const result = await addUserToGroupAction('user-1', 'group-1')
    expect(result.error).toBe('User is already a member of this group')
  })
})

describe('removeUserFromGroupAction', () => {
  it('removes user from group_members', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'group_members') {
          return makeChain([{ user_id: 'other-admin', role: 'admin' }])
        }
        return makeChain(null)
      }),
    }
    vi.mocked(createAdminClient).mockReturnValue(mockClient as any)

    const result = await removeUserFromGroupAction('user-1', 'group-1')
    expect(result.error).toBeNull()
  })

  it('prevents removing the last admin', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'group_members') {
          return makeChain([{ user_id: 'user-1', role: 'admin' }])
        }
        return makeChain(null)
      }),
    }
    vi.mocked(createAdminClient).mockReturnValue(mockClient as any)

    const result = await removeUserFromGroupAction('user-1', 'group-1')
    expect(result.error).toBe('Cannot remove the last admin of the group')
  })
})
