'use client'

import { useState } from 'react'
import { EditGroupModal } from './EditGroupModal'

interface Props {
  groupId: string
  currentName: string
  currentSlug: string
}

export function EditGroupButton({ groupId, currentName, currentSlug }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M11.5 1.5L14.5 4.5L5 14H2V11L11.5 1.5Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Editar
      </button>

      <EditGroupModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        groupId={groupId}
        currentName={currentName}
        currentSlug={currentSlug}
      />
    </>
  )
}
