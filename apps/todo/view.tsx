'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Circle, Trash2, Plus, Loader2 } from 'lucide-react'
import { useAppContext } from '@/lib/apps/context'

interface TodoItem {
  id: string
  title: string
  completed: boolean
  created_at: string
}

async function fetchTodos(groupSlug: string): Promise<TodoItem[]> {
  const res = await fetch(`/api/v1/${groupSlug}/apps/todo`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  if (!res.ok) return []
  return res.json()
}

async function createTodo(title: string, groupSlug: string): Promise<TodoItem | null> {
  const res = await fetch(`/api/v1/${groupSlug}/apps/todo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ title }),
  })
  if (!res.ok) return null
  return res.json()
}

async function updateTodo(id: string, completed: boolean, groupSlug: string): Promise<void> {
  await fetch(`/api/v1/${groupSlug}/apps/todo/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ completed }),
  })
}

async function deleteTodo(id: string, groupSlug: string): Promise<void> {
  await fetch(`/api/v1/${groupSlug}/apps/todo/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
}

export default function TodoView() {
  const t = useTranslations('apps.todo')
  const { config, groupId, groupSlug } = useAppContext()
  const maxItems = Number(config.max_items ?? 50)

  const [todos, setTodos] = useState<TodoItem[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [limitError, setLimitError] = useState(false)

  useEffect(() => {
    if (!groupSlug) return
    fetchTodos(groupSlug).then(data => { setTodos(data); setLoading(false) })
  }, [groupSlug])

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    if (todos.length >= maxItems) {
      setLimitError(true)
      return
    }
    setLimitError(false)
    setNewTitle('')
    startTransition(async () => {
      const item = await createTodo(title, groupSlug!)
      if (item) setTodos(prev => [item, ...prev])
    })
  }

  function handleToggle(id: string, completed: boolean) {
    setTodos(prev => prev.map(item => item.id === id ? { ...item, completed } : item))
    startTransition(async () => { await updateTodo(id, completed, groupSlug!) })
  }

  function handleDelete(id: string) {
    setTodos(prev => prev.filter(item => item.id !== id))
    startTransition(async () => { await deleteTodo(id, groupSlug!) })
  }

  const pending = todos.filter(item => !item.completed)
  const done = todos.filter(item => item.completed)

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-bold text-slate-900 mb-1">{t('title')}</h1>
      <p className="text-sm text-slate-400 mb-6">
        {t('pending_label', { count: pending.length })} · {t('done_label', { count: done.length })}
      </p>

      <form onSubmit={handleAdd} className="flex gap-2 mb-2">
        <input
          value={newTitle}
          onChange={e => { setNewTitle(e.target.value); setLimitError(false) }}
          placeholder={t('add_placeholder')}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <button
          type="submit"
          disabled={isPending || !newTitle.trim()}
          className="flex items-center gap-1.5 text-white text-sm font-medium px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50 transition-colors"
          style={{ backgroundColor: 'var(--app-primary)' }}
        >
          <Plus size={14} />
          {t('add_button')}
        </button>
      </form>

      {limitError && (
        <p className="text-xs text-red-500 mb-4">{t('limit_reached', { max: maxItems })}</p>
      )}

      {!limitError && <div className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-slate-300" />
        </div>
      ) : todos.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-8">{t('empty')}</p>
      ) : (
        <ul className="space-y-1.5">
          {[...pending, ...done].map(todo => (
            <li
              key={todo.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 group"
            >
              <button
                type="button"
                onClick={() => handleToggle(todo.id, !todo.completed)}
                className="flex-shrink-0 text-slate-300 hover:text-slate-500 cursor-pointer transition-colors"
              >
                {todo.completed
                  ? <CheckCircle2 size={18} style={{ color: 'var(--app-primary)' }} />
                  : <Circle size={18} />}
              </button>
              <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                {todo.title}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(todo.id)}
                className="flex-shrink-0 text-slate-200 hover:text-red-400 cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
