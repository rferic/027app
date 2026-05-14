'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppBottomNav, type NavItem } from '@/components/app-bottom-nav'

export type { NavItem }

interface Props {
  children: React.ReactNode
  navItems: NavItem[]
  locale: string
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

export function AppShell({ children, navItems, locale }: Props) {
  const pathname = usePathname()
  const reduced = usePrefersReducedMotion()

  return (
    <div className="flex flex-col flex-1 pb-16 md:pb-0">
      <motion.div
        key={pathname}
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="flex flex-col flex-1"
      >
        {children}
      </motion.div>
      <AppBottomNav navItems={navItems} locale={locale} />
    </div>
  )
}
