'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import { GroupInfoDrawer } from './group-info-drawer'

interface MemberInfo {
  displayName: string
  role: string
}

interface AppInfo {
  slug: string
  name: string
}

interface Props {
  groupName: string
  groupSlug: string
  members: MemberInfo[]
  apps: AppInfo[]
}

export function GroupInfoButton({ groupName, groupSlug, members, apps }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        title="Información del grupo"
      >
        <Info size={18} />
      </button>
      <GroupInfoDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        groupName={groupName}
        groupSlug={groupSlug}
        members={members}
        apps={apps}
      />
    </>
  )
}
