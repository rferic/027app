import type { UseCaseContext } from '@/lib/use-cases/types'

export type { UseCaseContext }

export type ApiHandler = (
  req: Request,
  ctx: UseCaseContext
) => Promise<Response>

export type AuthLevel = 'public' | 'apikey' | 'jwt' | 'any'
