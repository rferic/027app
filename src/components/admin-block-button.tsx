'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { blockUserAction, unblockUserAction } from '@/app/(admin)/[locale]/admin/users/actions'

interface Props {
  userId: string
  isBlocked: boolean
  currentUserId: string
}

export function AdminBlockButton({ userId, isBlocked, currentUserId }: Props) {
  const [pending, startTransition] = useTransition()
  const t = useTranslations('admin.table')

  if (userId === currentUserId) return null

  const action = isBlocked ? unblockUserAction : blockUserAction

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await action(userId) })}
      className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border transition-colors disabled:opacity-50 cursor-pointer ${
        isBlocked
          ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
          : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
      }`}
    >
      {pending ? '…' : isBlocked ? t('unblock') : t('block')}
    </button>
  )
}
