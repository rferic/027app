import Link from 'next/link'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { getAdminStats, getAdminUserList } from '@/lib/use-cases/admin/users'
import { getAdminInvitationList, getInvitationStatus } from '@/lib/use-cases/invitations'

interface Props {
  params: Promise<{ locale: string }>
}

function StatCard({ label, value, href, sublabel }: { label: string; value: number; href?: string; sublabel?: string }) {
  const content = (
    <div className="bg-white rounded-xl border border-slate-100 p-5 hover:border-slate-200 transition-colors">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
    </div>
  )
  if (href) return <Link href={href}>{content}</Link>
  return content
}

export default async function AdminDashboard({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin.dashboard')
  const base = `/${locale}/admin`

  const [stats, users, invitations] = await Promise.all([
    getAdminStats(),
    getAdminUserList(),
    getAdminInvitationList(),
  ])
  const recentInvitations = invitations.slice(0, 5)

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">{t('title')}</h1>
        <p className="text-sm text-slate-400 mt-1">{t('subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label={t('statsAdmins')} value={stats.admins} href={`${base}/admins`} />
        <StatCard label={t('statsMembers')} value={stats.members} href={`${base}/users`} />
        <StatCard label={t('statsPending')} value={stats.pendingInvitations} href={`${base}/invitations`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">{t('recentUsers')}</h2>
            <Link href={`${base}/users`} className="text-xs text-slate-400 hover:text-slate-900 transition-colors">{t('viewAll')}</Link>
          </div>
          {users.length === 0 ? <p className="text-sm text-slate-400">{t('noUsers')}</p> : (
            <ul className="space-y-2">
              {users.slice(0, 5).map((user) => (
                <li key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-slate-500">{user.displayName.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <span className="text-sm text-slate-700 truncate">{user.displayName}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ml-2 ${user.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>{user.role}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">{t('recentInvitations')}</h2>
            <Link href={`${base}/invitations`} className="text-xs text-slate-400 hover:text-slate-900 transition-colors">{t('viewAll')}</Link>
          </div>
          {recentInvitations.length === 0 ? <p className="text-sm text-slate-400">{t('noInvitations')}</p> : (
            <ul className="space-y-2">
              {recentInvitations.map((inv) => {
                const status = getInvitationStatus(inv)
                const statusStyles: Record<string, string> = { pending: 'bg-emerald-50 text-emerald-700', accepted: 'bg-slate-100 text-slate-500', expired: 'bg-amber-50 text-amber-700', revoked: 'bg-red-50 text-red-600' }
                return (
                  <li key={inv.id} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 truncate">{inv.title}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ml-2 ${statusStyles[status]}`}>{status}</span>
                  </li>
                )
              })}
            </ul>
          )}
          <Link href={`${base}/invitations/new`} className="mt-4 w-full flex items-center justify-center px-3 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors">{t('newInvitation')}</Link>
        </div>
      </div>
    </main>
  )
}
