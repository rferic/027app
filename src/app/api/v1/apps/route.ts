import { NextRequest } from 'next/server'
import { authenticate } from '@/lib/api/auth'
import { apiOk } from '@/lib/api/response'

export async function GET(req: NextRequest) {
  const auth = await authenticate(req, 'any')
  if (auth instanceof Response) return auth

  // TODO Sprint 1: query installed_apps table once it exists
  // With JWT: filter by app_permissions for the user
  // With API key: return all active apps for the group
  return apiOk([])
}
