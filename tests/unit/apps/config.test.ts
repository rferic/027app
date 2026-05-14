import { describe, it, expect } from 'vitest'
import { resolveAppConfig } from '@/lib/apps/config'
import type { AppManifest } from '@/types/apps'

const todoManifest: AppManifest = {
  slug: 'todo',
  tablePrefix: 'todo_',
  name: 'To-Do',
  version: '1.0.0',
  description: 'Simple task list',
  logo: 'logo.svg',
  primaryColor: '#4F46E5',
  secondaryColor: '#EEF2FF',
  author: { name: '027Apps' },
  minPlatformVersion: '1.0.0',
  views: { public: true, admin: true, widget: true, native: true },
  api: true,
  dependencies: [],
  notifications: false,
  config: [
    {
      key: 'max_items',
      type: 'number',
      label: { en: 'Max items per user' },
      required: false,
      default: 50,
      min: 1,
      max: 1000,
    }
  ]
}

describe('resolveAppConfig', () => {
  it('returns defaults when installedConfig is empty', () => {
    const result = resolveAppConfig(todoManifest, {})
    expect(result).toEqual({ max_items: 50 })
  })

  it('respects installed config over defaults', () => {
    const result = resolveAppConfig(todoManifest, { max_items: 10 })
    expect(result).toEqual({ max_items: 10 })
  })

  it('ignores keys not defined in manifest config', () => {
    const result = resolveAppConfig(todoManifest, { extra_key: 'ignored' })
    expect(result).not.toHaveProperty('extra_key')
  })
})
