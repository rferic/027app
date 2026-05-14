import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { AppValidationError } from '@/types/apps'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// Minimal manifest: no views, no logo, no migrations — simplest valid shape
const minimalRaw = {
  slug: 'test-app',
  name: 'Test App',
  version: '1.0.0',
  description: 'A test app',
  primaryColor: '#000000',
  secondaryColor: '#ffffff',
  minPlatformVersion: '1.0.0',
  author: { name: 'Tester', url: 'https://example.com' },
  views: { public: false, admin: false, widget: false, native: false },
  api: false,
  dependencies: [],
  notifications: false,
  config: [],
  logo: '',
}

// ---------------------------------------------------------------------------
// Tests — real temp files, process.cwd() spied to point there
// ---------------------------------------------------------------------------

describe('readManifest', () => {
  let tmpDir: string
  let appDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'manifest-test-'))
    appDir = path.join(tmpDir, 'apps', 'test-app')
    await fs.mkdir(appDir, { recursive: true })
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  async function writeManifest(raw: Record<string, unknown>) {
    await fs.writeFile(path.join(appDir, 'manifest.json'), JSON.stringify(raw))
  }

  it('returns a valid AppManifest for a well-formed manifest.json', async () => {
    await writeManifest(minimalRaw)
    const { readManifest } = await import('@/lib/apps/manifest')
    const manifest = await readManifest('test-app')
    expect(manifest.slug).toBe('test-app')
    expect(manifest.name).toBe('Test App')
    expect(manifest.views.public).toBe(false)
  })

  it('throws AppValidationError when slug has invalid characters', async () => {
    const { readManifest } = await import('@/lib/apps/manifest')
    await expect(readManifest('Test App!')).rejects.toThrow(AppValidationError)
  })

  it('throws AppValidationError when a required field is missing', async () => {
    const { name: _name, ...withoutName } = minimalRaw
    await writeManifest(withoutName)
    const { readManifest } = await import('@/lib/apps/manifest')
    await expect(readManifest('test-app')).rejects.toThrow(AppValidationError)
  })

  it('throws AppValidationError when manifest.json cannot be read', async () => {
    // appDir exists but manifest.json was never written
    const { readManifest } = await import('@/lib/apps/manifest')
    await expect(readManifest('test-app')).rejects.toThrow(AppValidationError)
  })

  it('throws AppValidationError when views.public is true but view.tsx is missing', async () => {
    await writeManifest({ ...minimalRaw, views: { ...minimalRaw.views, public: true } })
    // view.tsx not created
    const { readManifest } = await import('@/lib/apps/manifest')
    await expect(readManifest('test-app')).rejects.toThrow(AppValidationError)
  })

  it('auto-adds extends slug to dependencies if not already present', async () => {
    await writeManifest({ ...minimalRaw, extends: 'base-app', dependencies: [] })
    const { readManifest } = await import('@/lib/apps/manifest')
    const manifest = await readManifest('test-app')
    expect(manifest.dependencies).toContain('base-app')
  })

  it('does not duplicate extends slug if already in dependencies', async () => {
    await writeManifest({ ...minimalRaw, extends: 'base-app', dependencies: ['base-app'] })
    const { readManifest } = await import('@/lib/apps/manifest')
    const manifest = await readManifest('test-app')
    expect(manifest.dependencies.filter((d: string) => d === 'base-app').length).toBe(1)
  })

  it('throws AppValidationError when logo path escapes app directory', async () => {
    await writeManifest({ ...minimalRaw, logo: '../../../etc/passwd' })
    const { readManifest } = await import('@/lib/apps/manifest')
    await expect(readManifest('test-app')).rejects.toThrow(AppValidationError)
  })

  it('throws AppValidationError when migrations.sql exists but uninstall.sql is missing', async () => {
    await writeManifest(minimalRaw)
    await fs.writeFile(path.join(appDir, 'migrations.sql'), 'CREATE TABLE t (id int);')
    // uninstall.sql intentionally not created
    const { readManifest } = await import('@/lib/apps/manifest')
    await expect(readManifest('test-app')).rejects.toThrow(AppValidationError)
  })
})
