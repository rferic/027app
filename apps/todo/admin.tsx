'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface TodoItem {
  id: string
  user_id: string
  title: string
  completed: boolean
  created_at: string
}

export default function TodoAdmin() {
  const t = useTranslations('apps.todo')
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/apps/todo?all=true', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((data: TodoItem[]) => { setTodos(data); setLoading(false) })
  }, [])

  const pending = todos.filter(item => !item.completed).length
  const done = todos.filter(item => item.completed).length

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('admin_title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {t('admin_subtitle', { total: todos.length, pending, done })}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-gray-300" />
        </div>
      ) : todos.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">{t('admin_empty')}</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
          {todos.map(todo => (
            <div key={todo.id} className="flex items-center gap-3 px-4 py-3">
              {todo.completed
                ? <CheckCircle2 size={16} className="flex-shrink-0" style={{ color: 'var(--app-primary)' }} />
                : <Circle size={16} className="text-slate-200 flex-shrink-0" />}
              <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                {todo.title}
              </span>
              <span className="text-xs text-slate-400 flex-shrink-0 font-mono">
                {todo.user_id.slice(0, 8)}…
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
