'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { LOCALE_LABELS } from '@/i18n/routing'
import { updateProfileAction, changePasswordAction, type ProfileState, type PasswordState } from '@/components/profile-actions'

interface Props {
  displayName: string
  locale?: string
  availableLocales?: string[]
  showLocale?: boolean
}

const initialProfileState: ProfileState = { error: null }
const initialPasswordState: PasswordState = { error: null }

export function ProfileForm({ displayName, locale, availableLocales, showLocale = false }: Props) {
  const t = useTranslations('profile')
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, initialProfileState)
  const [passwordState, passwordAction, passwordPending] = useActionState(changePasswordAction, initialPasswordState)
  const prevProfileRef = useRef(initialProfileState)
  const prevPasswordRef = useRef(initialPasswordState)

  useEffect(() => {
    if (profileState === prevProfileRef.current) return
    prevProfileRef.current = profileState
    if (profileState.success) toast.success(t('saved'))
    else if (profileState.error) toast.error(t.has(profileState.error) ? t(profileState.error) : profileState.error)
  }, [profileState, t])

  useEffect(() => {
    if (passwordState === prevPasswordRef.current) return
    prevPasswordRef.current = passwordState
    if (passwordState.success) toast.success(t('passwordChanged'))
    else if (passwordState.error) toast.error(t.has(passwordState.error) ? t(passwordState.error) : passwordState.error)
  }, [passwordState, t])

  return (
    <div className="space-y-6">
      <form action={profileAction} className="space-y-4">
        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">{t('personalInfo')}</h2>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1">
              {t('displayName')}
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              defaultValue={displayName}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <p className="mt-1.5 text-xs text-slate-400">{t('displayNameHint')}</p>
          </div>

          {showLocale && locale && availableLocales && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('language')}
              </label>
              <div className="flex gap-2 flex-wrap">
                {availableLocales.map((loc) => (
                  <label key={loc} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="locale"
                      value={loc}
                      defaultChecked={locale === loc}
                      className="sr-only peer"
                    />
                    <span className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 peer-checked:bg-slate-900 peer-checked:text-white peer-checked:border-slate-900 transition-colors cursor-pointer">
                      {LOCALE_LABELS[loc] ?? loc.toUpperCase()}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-slate-400">{t('languageNote')}</p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={profilePending}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {profilePending ? t('saving') : t('save')}
            </button>
          </div>
        </div>
      </form>

      <form action={passwordAction} className="space-y-4">
        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">{t('changePassword')}</h2>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">
              {t('newPassword')}
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              placeholder={t('minPasswordChars')}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
              {t('confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={passwordPending}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {passwordPending ? t('changingPassword') : t('changePasswordBtn')}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
