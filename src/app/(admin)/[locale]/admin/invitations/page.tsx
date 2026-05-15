import { headers } from 'next/headers'
import { setRequestLocale } from 'next-intl/server'
import { getAdminInvitationList } from '@/lib/use-cases/invitations'
import { InvitationsManager } from './InvitationsManager'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function AdminInvitationsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const baseUrl = `${proto}://${host}`
  const invitations = await getAdminInvitationList()

  return <InvitationsManager invitations={invitations} baseUrl={baseUrl} />
}
