import { vi, describe, it, expect } from 'vitest'
import { createAdminClient, createAdminClientUntyped } from '@/lib/supabase/admin'
import { canGroupAccessApp } from '@/lib/apps/access'

vi.mock('@/lib/supabase/admin')

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

function mockClients(fromFn: ReturnType<typeof vi.fn>) {
  const client = { from: fromFn }
  vi.mocked(createAdminClient).mockReturnValue(client as any)
  vi.mocked(createAdminClientUntyped).mockReturnValue(client as any)
}

describe('canGroupAccessApp', () => {
  it('returns true for public apps', async () => {
    mockClients(vi.fn((table: string) => {
      if (table === 'installed_apps') {
        return makeChain({ visibility: 'public' })
      }
      return makeChain(null)
    }))

    const result = await canGroupAccessApp('g1', 'todo')
    expect(result).toBe(true)
  })

  it('returns false for private app without access', async () => {
    mockClients(vi.fn((table: string) => {
      if (table === 'installed_apps') {
        return makeChain({ visibility: 'private' })
      }
      return makeChain(null)
    }))

    const result = await canGroupAccessApp('g1', 'private-app')
    expect(result).toBe(false)
  })

  it('returns true for private app with access', async () => {
    mockClients(vi.fn((table: string) => {
      if (table === 'installed_apps') {
        return makeChain({ visibility: 'private' })
      }
      if (table === 'group_app_access') {
        return makeChain({ id: 'access-1' })
      }
      return makeChain(null)
    }))

    const result = await canGroupAccessApp('g1', 'private-app')
    expect(result).toBe(true)
  })

  it('returns false when app is not active', async () => {
    mockClients(vi.fn(() => makeChain(null)))

    const result = await canGroupAccessApp('g1', 'nonexistent')
    expect(result).toBe(false)
  })
})
