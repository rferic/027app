import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { AppValidationError } from '@/types/apps'

// ---------------------------------------------------------------------------
// Mocks — only readManifest (application module) which vi.mock intercepts fine
// ---------------------------------------------------------------------------

vi.mock('@/lib/apps/manifest', () => ({
  readManifest: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validManifest = {
  slug: 'valid-app',
  tablePrefix: 'valid_app_',
  name: 'Valid App',
  version: '1.0.0',
  description: 'A valid test app',
  logo: '',
  primaryColor: '#000',
  secondaryColor: '#fff',
  minPlatformVersion: '1.0.0',
  author: { name: 'Tester' },
  views: { public: false, admin: false, widget: false, native: false },
  api: false,
  dependencies: [],
  notifications: false,
  config: [],
}

// ---------------------------------------------------------------------------
// Tests — real temp directories, process.cwd() spied to point there
// ---------------------------------------------------------------------------

describe('scanApps', () => {
  let tmpDir: string
  let appsDir: string

  beforeEach(async () => {
    vi.resetAllMocks()
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scanner-test-'))
    appsDir = path.join(tmpDir, 'apps')
    await fs.mkdir(appsDir)
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  it('returns ScannedApp with manifest for a valid app', async () => {
    const { readManifest } = await import('@/lib/apps/manifest')
    const { scanApps } = await import('@/lib/apps/scanner')

    await fs.mkdir(path.join(appsDir, 'valid-app'))
    vi.mocked(readManifest).mockResolvedValue(validManifest as Awaited<ReturnType<typeof readManifest>>)

    const results = await scanApps()
    expect(results).toHaveLength(1)
    expect(results[0].slug).toBe('valid-app')
    expect(results[0].manifest).toBeTruthy()
    expect(results[0].validationError).toBeNull()
  })

  it('returns ScannedApp with validationError for an invalid app', async () => {
    const { readManifest } = await import('@/lib/apps/manifest')
    const { scanApps } = await import('@/lib/apps/scanner')

    await fs.mkdir(path.join(appsDir, 'broken-app'))
    vi.mocked(readManifest).mockRejectedValue(
      new AppValidationError('broken-app: missing required field "name"')
    )

    const results = await scanApps()
    expect(results).toHaveLength(1)
    expect(results[0].slug).toBe('broken-app')
    expect(results[0].manifest).toBeNull()
    expect(results[0].validationError).toContain('missing required field')
  })

  it('skips non-directory entries (files in apps/ root)', async () => {
    const { readManifest } = await import('@/lib/apps/manifest')
    const { scanApps } = await import('@/lib/apps/scanner')

    await fs.writeFile(path.join(appsDir, 'README.md'), '')
    await fs.mkdir(path.join(appsDir, 'real-app'))
    vi.mocked(readManifest).mockResolvedValue(validManifest as Awaited<ReturnType<typeof readManifest>>)

    const results = await scanApps()
    expect(results).toHaveLength(1)
    expect(results[0].slug).toBe('real-app')
  })

  it('returns empty array when apps/ directory does not exist', async () => {
    const { scanApps } = await import('@/lib/apps/scanner')
    await fs.rm(appsDir, { recursive: true })
    const results = await scanApps()
    expect(results).toHaveLength(0)
  })

  it('returns empty array when apps/ directory is empty', async () => {
    const { scanApps } = await import('@/lib/apps/scanner')
    const results = await scanApps()
    expect(results).toHaveLength(0)
  })

  it('processes multiple apps and mixes valid and invalid results', async () => {
    const { readManifest } = await import('@/lib/apps/manifest')
    const { scanApps } = await import('@/lib/apps/scanner')

    await fs.mkdir(path.join(appsDir, 'app-a'))
    await fs.mkdir(path.join(appsDir, 'app-b'))
    vi.mocked(readManifest)
      .mockResolvedValueOnce(validManifest as Awaited<ReturnType<typeof readManifest>>)
      .mockRejectedValueOnce(new AppValidationError('app-b: manifest not found'))

    const results = await scanApps()
    expect(results).toHaveLength(2)
    expect(results[0].manifest).toBeTruthy()
    expect(results[1].manifest).toBeNull()
  })
})
