'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Circle, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAppContext } from '@/lib/apps/context'

interface TodoItem {
  id: string
  title: string
  completed: boolean
}

export default function TodoWidget() {
  const t = useTranslations('apps.todo')
  const { groupSlug } = useAppContext()
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!groupSlug) return
    fetch(`/api/v1/${groupSlug}/apps/todo`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((data: TodoItem[]) => { setTodos(data); setLoading(false) })
  }, [groupSlug])

  const pending = todos.filter(item => !item.completed)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-800">{t('title')}</span>
        <span className="text-xs text-slate-400">{t('pending_label', { count: pending.length })}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={16} className="animate-spin text-slate-200" />
        </div>
      ) : pending.length === 0 ? (
        <p className="text-xs text-slate-400 py-2 text-center">{t('all_done')}</p>
      ) : (
        <ul className="space-y-1.5">
          {pending.slice(0, 3).map(todo => (
            <li key={todo.id} className="flex items-center gap-2">
              <Circle size={13} className="text-slate-300 flex-shrink-0" />
              <span className="text-xs text-slate-700 truncate">{todo.title}</span>
            </li>
          ))}
          {pending.length > 3 && (
            <li className="text-xs text-slate-400 pl-5">{t('more_tasks', { count: pending.length - 3 })}</li>
          )}
        </ul>
      )}

      <Link
        href="/apps/todo"
        className="mt-3 block text-center text-xs font-medium transition-colors"
        style={{ color: 'var(--app-primary)' }}
      >
        {t('open')}
      </Link>
    </div>
  )
}
