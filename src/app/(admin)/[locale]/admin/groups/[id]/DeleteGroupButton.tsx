'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteGroupAction } from './actions'

interface Props {
  groupId: string
  groupName: string
  locale: string
}

export function DeleteGroupButton({ groupId, groupName, locale }: Props) {
  const t = useTranslations('admin')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm(t('groups.delete_confirm_title', { name: groupName }))) return
    startTransition(async () => {
      const result = await deleteGroupAction(groupId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(t('groups.deleted'))
        router.push(`/${locale}/admin/groups`)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {pending ? t('groups.deleting') : t('groups.delete_group')}
    </button>
  )
}
