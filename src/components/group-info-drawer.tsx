'use client'

import { useEffect } from 'react'
import { X, Users, AppWindow } from 'lucide-react'

interface MemberInfo {
  displayName: string
  role: string
}

interface AppInfo {
  slug: string
  name: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  groupName: string
  groupSlug: string
  members: MemberInfo[]
  apps: AppInfo[]
}

export function GroupInfoDrawer({ isOpen, onClose, groupName, groupSlug, members, apps }: Props) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', onKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 max-md:flex max-md:items-center max-md:justify-center ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel: drawer on desktop, modal on mobile */}
      <div
        className={`absolute md:right-0 md:top-0 md:bottom-0 w-full max-w-sm bg-white shadow-xl transition-all duration-300 ease-out max-md:relative max-md:rounded-xl max-md:mx-4 max-md:max-h-[90vh] max-md:overflow-y-auto ${isOpen ? 'md:translate-x-0' : 'md:translate-x-full'} ${isOpen ? 'max-md:scale-100 max-md:opacity-100' : 'max-md:scale-95 max-md:opacity-0'}`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-slate-100">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900 truncate">{groupName}</h2>
              <p className="text-xs text-slate-400 mt-0.5">@{groupSlug}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-2"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Miembros */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-slate-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Miembros ({members.length})
                </h3>
              </div>
              {members.length === 0 ? (
                <p className="text-sm text-slate-400">No hay miembros</p>
              ) : (
                <ul className="space-y-1.5">
                  {members.map((m, i) => (
                    <li key={i} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50">
                      <span className="text-sm text-slate-700 truncate">{m.displayName}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-500 flex-shrink-0 ml-2">
                        {m.role}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Apps */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <AppWindow size={16} className="text-slate-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Apps ({apps.length})
                </h3>
              </div>
              {apps.length === 0 ? (
                <p className="text-sm text-slate-400">No hay apps instaladas</p>
              ) : (
                <ul className="space-y-1.5">
                  {apps.map((app) => (
                    <li key={app.slug} className="py-1.5 px-2.5 rounded-lg bg-slate-50">
                      <span className="text-sm text-slate-700">{app.name}</span>
                      <span className="text-xs text-slate-400 ml-2">{app.slug}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
