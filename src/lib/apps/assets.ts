export function getAppAssetUrl(groupSlug: string, slug: string, filename: string): string {
  if (filename.includes('..') || filename.startsWith('/')) {
    throw new Error(`Invalid asset filename: ${filename}`)
  }
  return `/api/v1/${groupSlug}/apps/${slug}/assets/${filename}`
}
