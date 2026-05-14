import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGroupSettings, updateGroupSettings } from '@/lib/use-cases/settings'

vi.mock('@/lib/supabase/admin')

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

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

  for (const m of [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'is', 'limit', 'order', 'filter',
  ]) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }

  return chain
}

const DEFAULT_SETTINGS = { activeLocales: ['en', 'es', 'it'], defaultLocale: 'en' }

// ---------------------------------------------------------------------------
// getGroupSettings
// ---------------------------------------------------------------------------

describe('getGroupSettings', () => {
  const mockFrom = vi.fn()

  beforeEach(() => {
    vi.mocked(createAdminClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createAdminClient>)
    mockFrom.mockReset()
  })

  it('returns DEFAULT_SETTINGS when no group exists', async () => {
    mockFrom.mockReturnValue(makeChain(null))
    const result = await getGroupSettings()
    expect(result).toEqual(DEFAULT_SETTINGS)
  })

  it('returns DEFAULT_SETTINGS when group exists but no settings row', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ id: 'group-1' })) // groups
    mockFrom.mockReturnValueOnce(makeChain(null))               // group_settings → no row
    const result = await getGroupSettings()
    expect(result).toEqual(DEFAULT_SETTINGS)
  })

  it('returns settings from DB when group and settings exist', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ id: 'group-1' }))
    mockFrom.mockReturnValueOnce(
      makeChain({ active_locales: ['en', 'ca', 'fr'], default_locale: 'ca' })
    )
    const result = await getGroupSettings()
    expect(result).toEqual({ activeLocales: ['en', 'ca', 'fr'], defaultLocale: 'ca' })
  })

  it('falls back to DEFAULT active_locales when active_locales is null in DB', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ id: 'group-1' }))
    mockFrom.mockReturnValueOnce(
      makeChain({ active_locales: null, default_locale: 'es' })
    )
    const result = await getGroupSettings()
    expect(result.activeLocales).toEqual(DEFAULT_SETTINGS.activeLocales)
    expect(result.defaultLocale).toBe('es')
  })

  it('falls back to DEFAULT default_locale when default_locale is null in DB', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ id: 'group-1' }))
    mockFrom.mockReturnValueOnce(
      makeChain({ active_locales: ['en', 'de'], default_locale: null })
    )
    const result = await getGroupSettings()
    expect(result.activeLocales).toEqual(['en', 'de'])
    expect(result.defaultLocale).toBe(DEFAULT_SETTINGS.defaultLocale)
  })
})

// ---------------------------------------------------------------------------
// updateGroupSettings
// ---------------------------------------------------------------------------

describe('updateGroupSettings', () => {
  const mockFrom = vi.fn()

  beforeEach(() => {
    vi.mocked(createAdminClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createAdminClient>)
    mockFrom.mockReset()
  })

  it('throws when no group exists', async () => {
    mockFrom.mockReturnValue(makeChain(null))
    await expect(
      updateGroupSettings({ activeLocales: ['en'], defaultLocale: 'en' })
    ).rejects.toThrow('No group found')
  })

  it('upserts settings when group exists', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ id: 'group-1' })) // groups
    mockFrom.mockReturnValueOnce(makeChain(null))               // group_settings.upsert

    // Should not throw
    await expect(
      updateGroupSettings({ activeLocales: ['en', 'es'], defaultLocale: 'es' })
    ).resolves.toBeUndefined()
  })
})
