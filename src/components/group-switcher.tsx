'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, Plus, Check } from 'lucide-react'

interface GroupInfo {
  id: string
  name: string
  slug: string
  role: string
}

interface Props {
  locale: string
  groups: GroupInfo[]
  currentGroupSlug?: string | null
  isAdmin: boolean
}

function setLastGroupCookie(slug: string) {
  document.cookie = `last_group=${slug};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`
}

export function GroupSwitcher({ locale, groups, currentGroupSlug, isAdmin }: Props) {
  const t = useTranslations('groups')
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  // Derivar el group-slug de la URL: /es/mi-familia/dashboard → mi-familia
  const segments = pathname.split('/').filter(Boolean)
  const slugFromUrl =
    segments.length >= 2 && segments[1] !== 'login' && segments[1] !== 'profile'
      ? segments[1]
      : null

  // Prioridad: slug en URL → prop del servidor → primer grupo
  const effectiveSlug =
    (slugFromUrl && groups.some(g => g.slug === slugFromUrl) ? slugFromUrl : null) ??
    (currentGroupSlug && groups.some(g => g.slug === currentGroupSlug) ? currentGroupSlug : null) ??
    groups[0]?.slug ??
    null

  const currentGroup = groups.find(g => g.slug === effectiveSlug)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Si solo tiene un grupo y no es admin: mostrar solo el nombre, sin dropdown
  if (groups.length <= 1 && !isAdmin) {
    return (
      <span className="text-sm font-medium text-slate-700">
        {currentGroup?.name ?? groups[0]?.name ?? t('fallback')}
      </span>
    )
  }

  function handleSelect(slug: string) {
    setLastGroupCookie(slug)
    setOpen(false)
    router.push(`/${locale}/${slug}/dashboard`)
  }

  function handleCreateGroup() {
    setOpen(false)
    router.push(`/${locale}/admin/groups/new`)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
      >
        <span className="max-w-[120px] truncate">
{currentGroup?.name ?? groups[0]?.name ?? t('fallback')}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl border border-slate-100 shadow-lg py-1 z-50">
          <p className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {t('switcher_label')}
          </p>
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => handleSelect(group.slug)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-slate-50"
            >
              <div className="flex-1 min-w-0">
                <div className="text-slate-700 font-medium truncate">{group.name}</div>
                <div className="text-xs text-slate-400">{group.slug}</div>
              </div>
              {group.slug === effectiveSlug && (
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              )}
            </button>
          ))}
          
          {isAdmin && (
            <>
              <hr className="my-1 border-slate-100" />
              <button
                onClick={handleCreateGroup}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('create_group')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
