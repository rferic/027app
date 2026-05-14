'use client'

import { useEffect } from 'react'

// react-remove-scroll (used by Fumadocs) may leave position:fixed, padding-right,
// overflow:hidden on <body>/<html> after client-side navigation away from /doc.
// position:fixed on body collapses the flex layout and makes admin look "mobile".
// We reset twice: immediately + 100ms later to win the cleanup race condition.
export function AdminOverflowReset() {
  useEffect(() => {
    const reset = () => {
      const html = document.documentElement
      const body = document.body

      html.style.overflow = ''
      html.style.overscrollBehavior = ''
      html.style.paddingRight = ''
      html.style.position = ''
      html.style.top = ''
      html.style.width = ''
      html.style.pointerEvents = ''

      body.style.overflow = ''
      body.style.overscrollBehavior = ''
      body.style.paddingRight = ''
      body.style.position = ''
      body.style.top = ''
      body.style.width = ''
      body.style.pointerEvents = ''

      html.removeAttribute('data-overlay-opened')
      body.removeAttribute('data-overlay-opened')
      html.removeAttribute('data-scroll-locked')
      body.removeAttribute('data-scroll-locked')

      html.classList.remove('overflow-hidden', 'dark')
    }

    reset()
    const timer = setTimeout(reset, 100)
    return () => clearTimeout(timer)
  }, [])

  return null
}
