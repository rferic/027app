import { headers } from 'next/headers'
import { setRequestLocale } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  const adminClient = createAdminClient()
  const { data: allGroups } = await adminClient
    .from('groups')
    .select('id, name, slug')
    .order('name')
  const availableGroups = (allGroups ?? []) as { id: string; name: string; slug: string }[]

  return <InvitationsManager invitations={invitations} baseUrl={baseUrl} availableGroups={availableGroups} />
}
