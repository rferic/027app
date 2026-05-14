import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/auth/helpers', () => ({ requireAdmin: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

function makeChain(data: unknown, error: unknown = null) {
  const resolved = { data, error }
  const chain: Record<string, unknown> = {
    then: (fn: (v: unknown) => unknown) => Promise.resolve(resolved).then(fn),
    catch: (fn: (v: unknown) => unknown) => Promise.resolve(resolved).catch(fn),
    finally: (fn: () => void) => Promise.resolve(resolved).finally(fn),
    single: vi.fn().mockResolvedValue(resolved),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
  }
  for (const m of ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'in', 'limit', 'order', 'rpc', 'filter']) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  return chain
}

// ---------------------------------------------------------------------------
// grantAppAccessAction
// ---------------------------------------------------------------------------

describe('grantAppAccessAction', () => {
  beforeEach(() => vi.resetAllMocks())

  it('inserts permission for active app', async () => {
    const { requireAdmin } = await import('@/lib/auth/helpers')
    vi.mocked(requireAdmin).mockResolvedValue({ userId: 'admin-1' } as Awaited<ReturnType<typeof requireAdmin>>)

    const { createAdminClient } = await import('@/lib/supabase/admin')
    const mockFrom = vi.fn()

    // installed_apps check → returns app
    // group_members → returns group_id
    // app_permissions upsert → success
    mockFrom.mockImplementation((table: string) => {
      if (table === 'installed_apps') return { ...makeChain({ slug: 'todo' }), select: vi.fn().mockReturnValue({ ...makeChain({ slug: 'todo' }), eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { slug: 'todo' }, error: null }) }) }) }) }
      if (table === 'group_members') return { ...makeChain({ group_id: 'group-1' }), select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { group_id: 'group-1' }, error: null }) }) }) }
      if (table === 'app_permissions') return { ...makeChain(null), upsert: vi.fn().mockResolvedValue({ data: null, error: null }) }
      return makeChain(null)
    })

    vi.mocked(createAdminClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createAdminClient>)

    const { grantAppAccessAction } = await import('@/lib/apps/actions')
    const result = await grantAppAccessAction('todo', 'user-123')
    expect(result).toEqual({ success: true })
  })

  it('returns error if app not found or inactive', async () => {
    const { requireAdmin } = await import('@/lib/auth/helpers')
    vi.mocked(requireAdmin).mockResolvedValue({ userId: 'admin-1' } as Awaited<ReturnType<typeof requireAdmin>>)

    const { createAdminClient } = await import('@/lib/supabase/admin')
    const mockFrom = vi.fn()

    mockFrom.mockImplementation((table: string) => {
      if (table === 'installed_apps') return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }) }) }) }
      if (table === 'group_members') return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { group_id: 'group-1' }, error: null }) }) }) }
      return makeChain(null)
    })

    vi.mocked(createAdminClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createAdminClient>)

    const { grantAppAccessAction } = await import('@/lib/apps/actions')
    const result = await grantAppAccessAction('nonexistent', 'user-123')
    expect(result).toEqual({ error: 'App not found or not active' })
  })

  it('returns error if not admin', async () => {
    const { requireAdmin } = await import('@/lib/auth/helpers')
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Unauthorized'))

    const { grantAppAccessAction } = await import('@/lib/apps/actions')
    const result = await grantAppAccessAction('todo', 'user-123')
    expect(result).toEqual({ error: expect.stringContaining('Unauthorized') })
  })
})

// ---------------------------------------------------------------------------
// revokeAppAccessAction
// ---------------------------------------------------------------------------

describe('revokeAppAccessAction', () => {
  beforeEach(() => vi.resetAllMocks())

  it('deletes permission record scoped to group', async () => {
    const { requireAdmin } = await import('@/lib/auth/helpers')
    vi.mocked(requireAdmin).mockResolvedValue({ userId: 'admin-1' } as Awaited<ReturnType<typeof requireAdmin>>)

    const { createAdminClient } = await import('@/lib/supabase/admin')

    const eqSpy = vi.fn()
    // chain: .delete().eq(app_slug).eq(user_id).eq(group_id)
    eqSpy
      .mockReturnValueOnce({ eq: eqSpy })  // after first eq
      .mockReturnValueOnce({ eq: eqSpy })  // after second eq
      .mockResolvedValueOnce({ data: null, error: null })  // after third eq (group_id)

    const deleteChain = { eq: eqSpy }
    const mockFrom = vi.fn()

    // revokeAppAccessAction: first createAdminClient (main), second inside getGroupId
    mockFrom.mockImplementation((table: string) => {
      if (table === 'app_permissions') return { delete: vi.fn().mockReturnValue(deleteChain) }
      if (table === 'group_members') return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { group_id: 'group-1' }, error: null }),
          }),
        }),
      }
      return makeChain(null)
    })

    vi.mocked(createAdminClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createAdminClient>)

    const { revokeAppAccessAction } = await import('@/lib/apps/actions')
    const result = await revokeAppAccessAction('todo', 'user-123')
    expect(result).toEqual({ success: true })
    expect(mockFrom).toHaveBeenCalledWith('app_permissions')
    // Verify group_id filter was applied (3rd eq call)
    expect(eqSpy).toHaveBeenCalledWith('group_id', 'group-1')
  })

  it('returns error if not admin', async () => {
    const { requireAdmin } = await import('@/lib/auth/helpers')
    // getGroupId calls requireAdmin internally
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Unauthorized'))

    const { revokeAppAccessAction } = await import('@/lib/apps/actions')
    const result = await revokeAppAccessAction('todo', 'user-123')
    expect(result).toEqual({ error: expect.stringContaining('Unauthorized') })
  })
})

// ---------------------------------------------------------------------------
// updateAppVisibilityAction
// ---------------------------------------------------------------------------

describe('updateAppVisibilityAction', () => {
  beforeEach(() => vi.resetAllMocks())

  it('updates visibility to private', async () => {
    const { requireAdmin } = await import('@/lib/auth/helpers')
    vi.mocked(requireAdmin).mockResolvedValue({ userId: 'admin-1' } as Awaited<ReturnType<typeof requireAdmin>>)

    const { createAdminClient } = await import('@/lib/supabase/admin')
    const eqChain = { eq: vi.fn().mockResolvedValue({ data: null, error: null }) }
    const updateChain = { eq: vi.fn().mockReturnValue(eqChain) }
    const mockFrom = vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue(updateChain) })

    vi.mocked(createAdminClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createAdminClient>)

    const { updateAppVisibilityAction } = await import('@/lib/apps/actions')
    const result = await updateAppVisibilityAction('todo', 'private')
    expect(result).toEqual({ success: true })
  })

  it('updates visibility to public', async () => {
    const { requireAdmin } = await import('@/lib/auth/helpers')
    vi.mocked(requireAdmin).mockResolvedValue({ userId: 'admin-1' } as Awaited<ReturnType<typeof requireAdmin>>)

    const { createAdminClient } = await import('@/lib/supabase/admin')
    const eqChain = { eq: vi.fn().mockResolvedValue({ data: null, error: null }) }
    const updateChain = { eq: vi.fn().mockReturnValue(eqChain) }
    const mockFrom = vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue(updateChain) })

    vi.mocked(createAdminClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createAdminClient>)

    const { updateAppVisibilityAction } = await import('@/lib/apps/actions')
    const result = await updateAppVisibilityAction('todo', 'public')
    expect(result).toEqual({ success: true })
  })

  it('returns error if not admin', async () => {
    const { requireAdmin } = await import('@/lib/auth/helpers')
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Unauthorized'))

    const { updateAppVisibilityAction } = await import('@/lib/apps/actions')
    const result = await updateAppVisibilityAction('todo', 'private')
    expect(result).toEqual({ error: expect.stringContaining('Unauthorized') })
  })
})

// ---------------------------------------------------------------------------
// getAppPermissionsAction
// ---------------------------------------------------------------------------

describe('getAppPermissionsAction', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns members with hasAccess correctly cross-referenced', async () => {
    const { requireAdmin } = await import('@/lib/auth/helpers')
    vi.mocked(requireAdmin).mockResolvedValue({ userId: 'admin-1' } as Awaited<ReturnType<typeof requireAdmin>>)

    const { createAdminClient } = await import('@/lib/supabase/admin')

    const membersData = [
      { user_id: 'user-1', profiles: { display_name: 'Alice', avatar_url: null } },
      { user_id: 'user-2', profiles: { display_name: 'Bob', avatar_url: 'http://example.com/bob.jpg' } },
    ]
    const permissionsData = [
      { user_id: 'user-1', enabled: true },
    ]

    // getAppPermissionsAction calls getGroupId() twice (once inside getGroupId, once explicitly)
    // getGroupId creates its own adminClient — we need createAdminClient to handle multiple calls
    // Call 1 (getGroupId inside getAppPermissionsAction): group_members.select.eq.single → group_id
    // Call 2 (getAppPermissionsAction body): group_members.select.eq + app_permissions.select.eq.eq via Promise.all
    // Since getGroupId is called once per action invocation, we have 2 createAdminClient calls total

    const makeGroupIdClient = () => ({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { group_id: 'group-1' }, error: null }),
          }),
        }),
      }),
    })

    const makeMainClient = () => ({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'group_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: membersData, error: null }),
            }),
          }
        }
        if (table === 'app_permissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: permissionsData, error: null }),
              }),
            }),
          }
        }
        return makeChain(null)
      }),
    })

    // Call order in getAppPermissionsAction:
    // 1st createAdminClient() → used in action body (for group_members + app_permissions)
    // 2nd createAdminClient() → used inside getGroupId() for .single()
    vi.mocked(createAdminClient)
      .mockReturnValueOnce(makeMainClient() as unknown as ReturnType<typeof createAdminClient>)
      .mockReturnValueOnce(makeGroupIdClient() as unknown as ReturnType<typeof createAdminClient>)

    const { getAppPermissionsAction } = await import('@/lib/apps/actions')
    const result = await getAppPermissionsAction('todo')

    expect(result).toEqual({
      members: [
        { userId: 'user-1', displayName: 'Alice', avatarUrl: null, hasAccess: true },
        { userId: 'user-2', displayName: 'Bob', avatarUrl: 'http://example.com/bob.jpg', hasAccess: false },
      ],
    })
  })

  it('returns error if not admin', async () => {
    const { requireAdmin } = await import('@/lib/auth/helpers')
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Unauthorized'))

    const { getAppPermissionsAction } = await import('@/lib/apps/actions')
    const result = await getAppPermissionsAction('todo')
    expect(result).toEqual({ error: expect.stringContaining('Unauthorized') })
  })
})
