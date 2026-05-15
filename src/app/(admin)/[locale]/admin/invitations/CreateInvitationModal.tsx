'use client'

import { useTransition, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { createInvitationAction } from './actions'

interface Props {
  baseUrl: string
  onClose: () => void
  onCreated: () => void
}

export function CreateInvitationModal({ baseUrl, onClose, onCreated }: Props) {
  const [pending, startTransition] = useTransition()
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)
  const t = useTranslations('admin.invitations.form')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createInvitationAction(formData)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        setCreatedUrl(`${baseUrl}/invite/${result.token}`)
      }
    })
  }

  function handleCopy() {
    if (!createdUrl) return
    navigator.clipboard.writeText(createdUrl).catch(() => toast.error(t('copyFailed')))
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white'
  const labelCls = 'block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 bg-white rounded-xl border border-slate-100 shadow-xl p-6 w-full max-w-lg mx-4">
        {createdUrl ? (
          <>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{t('createdTitle')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('createdDesc')}</p>
            <div className="flex items-center gap-2 mb-5">
              <code className="flex-1 text-xs bg-white border border-slate-200 rounded px-3 py-2 text-gray-700 break-all select-all">
                {createdUrl}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="cursor-pointer shrink-0 px-3 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                {t('copy')}
              </button>
            </div>
            <button
              type="button"
              onClick={onCreated}
              className="cursor-pointer w-full py-2 text-sm font-medium bg-slate-900 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              {t('done')}
            </button>
          </>
        ) : (
          <>
            <h3 className="text-base font-semibold text-gray-900 mb-4">{t('newTitle')}</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelCls}>
                  {t('titleLabel')} <span className="text-red-400">*</span>
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder={t('titlePlaceholder')}
                  className={inputCls}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">{t('titleHelp')}</p>
              </div>

              <div>
                <label className={labelCls}>
                  {t('roleLabel')} <span className="text-red-400">*</span>
                </label>
                <select
                  name="role"
                  defaultValue="member"
                  className={inputCls}
                >
                  <option value="member">{t('roleMember')}</option>
                  <option value="admin">{t('roleAdmin')}</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>
                  {t('emailLabel')} <span className="text-gray-400 font-normal normal-case">{t('emailOptional')}</span>
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1">{t('emailHelp')}</p>
              </div>

              <div>
                <label className={labelCls}>
                  {t('expiresLabel')} <span className="text-gray-400 font-normal normal-case">{t('emailOptional')}</span>
                </label>
                <input
                  name="expires_at"
                  type="datetime-local"
                  className={inputCls}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="cursor-pointer px-4 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {pending ? t('submitting') : t('submit')}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
