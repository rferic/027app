'use client'

import { useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateAppConfigAction } from '@/lib/apps/actions'
import type { AppConfigField } from '@/types/apps'

interface Props {
  slug: string
  fields: AppConfigField[]
  savedConfig: Record<string, unknown>
}

export function AppConfigSection({ slug, fields, savedConfig }: Props) {
  const t = useTranslations('admin.apps')
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const field of fields) {
      const v = savedConfig[field.key]
      initial[field.key] = v !== undefined && v !== null ? String(v) : (field.default !== undefined ? String(field.default) : '')
    }
    return initial
  })

  function fieldLabel(field: AppConfigField) {
    return field.label[locale] ?? field.label['en'] ?? field.key
  }

  function handleChange(key: string, value: string) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const config: Record<string, unknown> = {}
    for (const field of fields) {
      if (field.type === 'number') config[field.key] = values[field.key] !== '' ? Number(values[field.key]) : undefined
      else if (field.type === 'boolean') config[field.key] = values[field.key] === 'true'
      else config[field.key] = values[field.key]
    }
    startTransition(async () => {
      const res = await updateAppConfigAction(slug, config)
      if ('error' in res) {
        toast.error(res.error)
      } else {
        toast.success(t('configSaved'))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {fieldLabel(field)}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {field.type === 'boolean' ? (
            <select
              value={values[field.key]}
              onChange={e => handleChange(field.key, e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="true">{t('boolTrue')}</option>
              <option value="false">{t('boolFalse')}</option>
            </select>
          ) : field.type === 'select' ? (
            <select
              value={values[field.key]}
              onChange={e => handleChange(field.key, e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="">—</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label[locale] ?? opt.label['en'] ?? opt.value}
                </option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              value={values[field.key]}
              onChange={e => handleChange(field.key, e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
            />
          ) : (
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={values[field.key]}
              onChange={e => handleChange(field.key, e.target.value)}
              min={field.min}
              max={field.max}
              required={field.required}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          )}
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50 transition-colors"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {t('saveConfig')}
        </button>
      </div>
    </form>
  )
}
