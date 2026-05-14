'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { createInvitationAction } from '../actions'

interface Props {
  baseUrl: string
  locale: string
}

export function CreateInvitationForm({ baseUrl, locale }: Props) {
  const [pending, startTransition] = useTransition()
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)
  const router = useRouter()
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

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white'
  const labelCls = 'block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5'

  if (createdUrl) {
    return (
      <div className="max-w-lg">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6">
          <p className="text-sm font-semibold text-emerald-800 mb-3">{t('createdTitle')}</p>
          <p className="text-xs text-emerald-700 mb-4">{t('createdDesc')}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border border-emerald-200 rounded px-3 py-2 text-gray-700 break-all">
              {createdUrl}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(createdUrl).catch(() => toast.error(t('copyFailed')))}
              className="shrink-0 px-3 py-2 text-xs bg-slate-900 text-white rounded hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {t('copy')}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/admin/invitations`)}
          className="mt-4 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
        >
          {t('backToInvitations')}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg">
      <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-5">
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

        <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {pending ? t('submitting') : t('submit')}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/admin/invitations`)}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </form>
  )
}
