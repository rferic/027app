import { apiOk } from '@/lib/api/response'

export async function GET() {
  return apiOk({ version: 'v1', status: 'ok' })
}
