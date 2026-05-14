import Link from 'next/link'
import { headers } from 'next/headers'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { getAdminInvitationList } from '@/lib/use-cases/invitations'
import { InvitationTable } from './InvitationTable'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function AdminInvitationsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin.invitations')

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const baseUrl = `${proto}://${host}`
  const invitations = await getAdminInvitationList()

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-400 mt-1">{invitations.length === 1 ? t('subtitle', { count: invitations.length }) : t('subtitlePlural', { count: invitations.length })}</p>
        </div>
        <Link href={`/${locale}/admin/invitations/new`} className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors">{t('new')}</Link>
      </div>
      <InvitationTable invitations={invitations} baseUrl={baseUrl} />
    </main>
  )
}
