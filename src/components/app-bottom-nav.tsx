'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Home, User, AppWindow, LayoutGrid } from 'lucide-react'

export interface NavItem {
  slug: string
  label: string
  href: string
}

interface Props {
  navItems: NavItem[]
  locale: string
}

function NavLink({ href, label, icon: Icon, active, onClick }: { href: string; label: string; icon: React.ElementType; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  )
}

export function AppBottomNav({ navItems, locale }: Props) {
  const t = useTranslations('app')
  const pathname = usePathname()
  const [overflowOpen, setOverflowOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!overflowOpen) return
    function handleMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOverflowOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [overflowOpen])

  const fixedItems = [
    { slug: 'home', label: t('nav.home'), href: `/${locale}/dashboard`, icon: Home },
    { slug: 'profile', label: t('nav.profile'), href: `/${locale}/profile`, icon: User },
  ]

  const MAX_DYNAMIC = 3
  const visibleDynamic = navItems.slice(0, MAX_DYNAMIC)
  const overflowItems = navItems.slice(MAX_DYNAMIC)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-1 z-20">
      {overflowOpen && overflowItems.length > 0 && (
        <div
          ref={panelRef}
          className="absolute bottom-full left-0 right-0 bg-white border-t border-slate-100 shadow-lg rounded-t-xl p-4 z-30"
        >
          <div className="flex flex-wrap gap-2">
            {overflowItems.map(({ slug, label, href }) => (
              <NavLink
                key={slug}
                href={href}
                label={label}
                icon={AppWindow}
                active={pathname.startsWith(href)}
                onClick={() => setOverflowOpen(false)}
              />
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-around max-w-md mx-auto">
        {fixedItems.map(({ slug, label, href, icon }) => (
          <NavLink key={slug} href={href} label={label} icon={icon} active={pathname === href} />
        ))}
        {visibleDynamic.map(({ slug, label, href }) => (
          <NavLink key={slug} href={href} label={label} icon={AppWindow} active={pathname.startsWith(href)} />
        ))}
        {overflowItems.length > 0 && (
          <button
            onClick={() => setOverflowOpen(prev => !prev)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              overflowOpen ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span>{t('nav.more')}</span>
          </button>
        )}
      </div>
    </nav>
  )
}
