'use client'

import { useActionState } from 'react'
import { updateDisplayNameAction, type ProfileState } from './actions'

interface Props {
  displayName: string
}

const initialState: ProfileState = { error: null }

export function ProfileForm({ displayName }: Props) {
  const [state, formAction, pending] = useActionState(updateDisplayNameAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2.5">
          Profile updated ✓
        </p>
      )}

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1.5">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          defaultValue={displayName}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
        />
        <p className="mt-1.5 text-xs text-slate-400">
          This is how your name appears to other group members.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
