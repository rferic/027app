import { headers } from 'next/headers'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { CreateInvitationForm } from './CreateInvitationForm'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function NewInvitationPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin.invitations')

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const baseUrl = `${proto}://${host}`

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">{t('newTitle')}</h1>
        <p className="text-sm text-slate-400 mt-1">{t('newSubtitle')}</p>
      </div>
      <CreateInvitationForm baseUrl={baseUrl} locale={locale} />
    </main>
  )
}
