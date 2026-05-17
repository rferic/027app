import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ locale: string; 'group-slug': string }>
}

export default async function GroupSlugPage({ params }: Props) {
  const { locale, 'group-slug': groupSlug } = await params
  redirect(`/${locale}/${groupSlug}/dashboard`)
}
