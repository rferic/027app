'use client'

import { useOptimistic, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { updateAppVisibilityAction, grantAppAccessAction, revokeAppAccessAction } from '@/lib/apps/actions'

interface Member {
  userId: string
  displayName: string
  avatarUrl: string | null
  hasAccess: boolean
}

interface Props {
  slug: string
  visibility: 'public' | 'private'
  members: Member[]
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export function AdminAppPermissions({ slug, visibility: initialVisibility, members: initialMembers }: Props) {
  const t = useTranslations('apps')
  const [visibilityPending, startVisibilityTransition] = useTransition()
  const [optimisticVisibility, updateOptimisticVisibility] = useOptimistic(initialVisibility)
  const [optimisticMembers, updateOptimistic] = useOptimistic(
    initialMembers,
    (state, { userId, hasAccess }: { userId: string; hasAccess: boolean }) =>
      state.map(m => m.userId === userId ? { ...m, hasAccess } : m)
  )
  const [accessPending, startAccessTransition] = useTransition()

  function handleVisibilityChange(newVisibility: 'public' | 'private') {
    startVisibilityTransition(async () => {
      updateOptimisticVisibility(newVisibility)
      const result = await updateAppVisibilityAction(slug, newVisibility)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(t('permissions.visibility_updated'))
      }
    })
  }

  function handleToggleAccess(userId: string, currentAccess: boolean) {
    const newAccess = !currentAccess
    startAccessTransition(async () => {
      updateOptimistic({ userId, hasAccess: newAccess })
      const result = newAccess
        ? await grantAppAccessAction(slug, userId)
        : await revokeAppAccessAction(slug, userId)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(newAccess ? t('permissions.access_granted') : t('permissions.access_revoked'))
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={visibilityPending}
          onClick={() => handleVisibilityChange('public')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
            optimisticVisibility === 'public'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          }`}
        >
          {t('permissions.visibility_public')}
        </button>
        <button
          type="button"
          disabled={visibilityPending}
          onClick={() => handleVisibilityChange('private')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
            optimisticVisibility === 'private'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          }`}
        >
          {t('permissions.visibility_private')}
        </button>
      </div>

      {optimisticVisibility === 'public' ? (
        <p className="text-sm text-slate-500">{t('permissions.visibility_description_public')}</p>
      ) : (
        <div className="space-y-2">
          {optimisticMembers.length === 0 ? (
            <p className="text-sm text-slate-500">{t('permissions.no_members')}</p>
          ) : (
            optimisticMembers.map(member => (
              <div key={member.userId} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {member.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.avatarUrl} alt={member.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-slate-600">{initials(member.displayName)}</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-800">{member.displayName}</span>
                  {member.hasAccess && (
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {t('permissions.has_access')}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={accessPending}
                  onClick={() => handleToggleAccess(member.userId, member.hasAccess)}
                  className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                    member.hasAccess
                      ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {member.hasAccess ? t('permissions.revoke_access') : t('permissions.grant_access')}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
