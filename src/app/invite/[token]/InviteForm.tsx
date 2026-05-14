'use client'

import { useTransition, useState } from 'react'
import { acceptInvitationAction } from './actions'

interface Props {
  token: string
  lockedEmail: string | null
  role: 'admin' | 'member'
}

export function InviteForm({ token, lockedEmail, role }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await acceptInvitationAction(token, formData)
      if (result && 'error' in result) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
          Full name
        </label>
        <input
          name="display_name"
          type="text"
          required
          autoFocus
          placeholder="Your name"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
          Email
        </label>
        {lockedEmail ? (
          <input
            name="email"
            type="email"
            value={lockedEmail}
            readOnly
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
          />
        ) : (
          <input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
          Password
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Min. 8 characters"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        {pending ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-xs text-slate-400">
        You are joining as <span className="font-medium text-slate-600">{role}</span>
      </p>
    </form>
  )
}
