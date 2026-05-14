import Link from 'next/link'
import { notFound } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { getAdminUser } from '@/lib/use-cases/admin/users'
import { getGroupSettings } from '@/lib/use-cases/settings'
import { EditUserForm } from './EditUserForm'

interface Props {
  params: Promise<{ id: string; locale: string }>
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function EditUserPage({ params }: Props) {
  const { id, locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin.editUser')
  const [user, settings] = await Promise.all([getAdminUser(id), getGroupSettings()])
  if (!user) notFound()

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/${locale}/admin/users`} className="text-sm text-slate-400 hover:text-slate-700 transition-colors">{t('back')}</Link>
        <h1 className="text-xl font-semibold text-slate-900 mt-2">{t('title')}</h1>
      </div>
      <div className="mb-5 bg-slate-50 rounded-xl px-5 py-3 text-xs text-slate-400 grid grid-cols-2 gap-2">
        <span>{t('joined')}: <span className="text-slate-600">{formatDate(user.joinedAt)}</span></span>
        <span>{t('lastLogin')}: <span className="text-slate-600">{user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}</span></span>
        <span>{t('status')}: <span className={user.isBlocked ? 'text-red-500 font-medium' : 'text-green-600'}>{user.isBlocked ? t('blocked') : t('active')}</span></span>
      </div>
      <EditUserForm user={user} availableLocales={settings.activeLocales} />
    </main>
  )
}
