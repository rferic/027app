import { describe, it, expect } from 'vitest'
import { loadAppMessages, hasAppI18n } from '@/lib/apps/i18n'

describe('loadAppMessages', () => {
  it('returns messages for existing locale', async () => {
    const msgs = await loadAppMessages('todo', 'en')
    expect(msgs).toHaveProperty('title')
    expect(msgs).toHaveProperty('add_button')
  })

  it('falls back to en when locale does not exist', async () => {
    const msgs = await loadAppMessages('todo', 'xx')
    expect(msgs).toHaveProperty('title')
  })

  it('returns {} for nonexistent app', async () => {
    const msgs = await loadAppMessages('nonexistent-app-xyz', 'en')
    expect(msgs).toEqual({})
  })
})

describe('hasAppI18n', () => {
  it('returns true for app with i18n directory', async () => {
    expect(await hasAppI18n('todo')).toBe(true)
  })

  it('returns false for nonexistent app', async () => {
    expect(await hasAppI18n('nonexistent-app-xyz')).toBe(false)
  })
})
