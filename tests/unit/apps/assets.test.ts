import { describe, it, expect } from 'vitest'
import { getAppAssetUrl } from '@/lib/apps/assets'

describe('getAppAssetUrl', () => {
  it('returns correct URL for valid asset', () => {
    expect(getAppAssetUrl('familia', 'todo', 'icon.svg')).toBe('/api/v1/familia/apps/todo/assets/icon.svg')
  })

  it('throws for path traversal with ..', () => {
    expect(() => getAppAssetUrl('familia', 'todo', '../secret.txt')).toThrow()
  })

  it('throws for absolute paths', () => {
    expect(() => getAppAssetUrl('familia', 'todo', '/etc/passwd')).toThrow()
  })
})
