import { setRequestLocale, getTranslations } from 'next-intl/server'
import { getAdminUserList } from '@/lib/use-cases/admin/users'
import { getUserWithRole } from '@/lib/auth/helpers'
import { AdminUserTable } from '@/components/admin-user-table'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function AdminAdminsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin.admins')

  const [users, currentUser] = await Promise.all([
    getAdminUserList(),
    getUserWithRole(),
  ])

  const admins = users.filter((user) => user.role === 'admin')

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">{t('title')}</h1>
        <p className="text-sm text-slate-400 mt-1">{admins.length === 1 ? t('subtitle', { count: admins.length }) : t('subtitlePlural', { count: admins.length })}</p>
      </div>
      <AdminUserTable users={admins} currentUserId={currentUser!.userId} locale={locale} />
    </main>
  )
}
