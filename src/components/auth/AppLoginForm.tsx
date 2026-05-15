'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithPassword } from '@/lib/auth/actions'
import { BlockedOverlay } from '@/components/blocked-overlay'

interface Props {
  locale: string
}

const initialState: { error: string | null } = { error: null }

export function AppLoginForm({ locale }: Props) {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')

  async function loginAction(_prevState: { error: string | null }, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const result = await signInWithPassword(email, password, locale)
    if (result?.error) {
      if (result.error === 'blocked') {
        return { error: 'blocked' }
      }
      return { error: t('loginError') }
    }
    return { error: null }
  }

  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <>
      {state.error === 'blocked' && <BlockedOverlay locale={locale} />}
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('password')}</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        {state.error && state.error !== 'blocked' && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" className="w-full bg-[#9B1C1C] hover:bg-[#7F1D1D] text-white" disabled={pending}>
          {pending ? tCommon('loading') : t('login')}
        </Button>
      </form>
    </>
  )
}
