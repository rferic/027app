import { SupabaseClient } from '@supabase/supabase-js'

export interface UseCaseContext {
  supabase: SupabaseClient
  userId?: string        // undefined en llamadas machine-to-machine (API key)
  email?: string         // sólo disponible cuando el auth level es 'jwt'
  groupId: string
  role?: 'admin' | 'member'
}

export class UseCaseError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message)
    this.name = 'UseCaseError'
  }
}
