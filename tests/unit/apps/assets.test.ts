import { describe, it, expect } from 'vitest'
import { getAppAssetUrl } from '@/lib/apps/assets'

describe('getAppAssetUrl', () => {
  it('returns correct URL for valid asset', () => {
    expect(getAppAssetUrl('todo', 'icon.svg')).toBe('/api/v1/apps/todo/assets/icon.svg')
  })

  it('throws for path traversal with ..', () => {
    expect(() => getAppAssetUrl('todo', '../secret.txt')).toThrow()
  })

  it('throws for absolute paths', () => {
    expect(() => getAppAssetUrl('todo', '/etc/passwd')).toThrow()
  })
})
