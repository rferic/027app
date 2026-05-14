'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithPassword } from '@/lib/auth/actions'
import { BlockedOverlay } from '@/components/blocked-overlay'

interface Props {
  locale: string
}

export function AppLoginForm({ locale }: Props) {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const result = await signInWithPassword(
      form.get('email') as string,
      form.get('password') as string,
      locale
    )

    if (result?.error) {
      if (result.error === 'blocked') {
        setIsBlocked(true)
      } else {
        setError(t('loginError'))
      }
      setLoading(false)
    } else {
      // redirect() fires server-side; if it fails for any reason, unblock the form
      setLoading(false)
    }
  }

  return (
    <>
      {isBlocked && <BlockedOverlay locale={locale} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('password')}</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full bg-[#9B1C1C] hover:bg-[#7F1D1D] text-white" disabled={loading}>
          {loading ? tCommon('loading') : t('login')}
        </Button>
      </form>
    </>
  )
}
