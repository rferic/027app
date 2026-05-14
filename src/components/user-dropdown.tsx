'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { signOut } from '@/lib/auth/actions'

interface Props {
  locale: string
  displayName: string
  /** Href for the "Edit profile" link. Defaults to /{locale}/profile */
  profileHref?: string
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export function UserDropdown({ locale, displayName, profileHref }: Props) {
  const t = useTranslations('user')
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer flex items-center gap-2 hover:opacity-75 transition-opacity"
      >
        <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">{initials(displayName)}</span>
        </div>
        <span className="text-sm text-slate-600 hidden sm:block">{displayName}</span>
        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-slate-100 shadow-lg py-1 z-50">
          <Link
            href={profileHref ?? `/${locale}/profile`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            {t('editProfile')}
          </Link>
          <hr className="my-1 border-slate-100" />
          <button
            disabled={pending}
            onClick={() => startTransition(async () => { await signOut(locale) })}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            {pending ? '…' : t('signOut')}
          </button>
        </div>
      )}
    </div>
  )
}
