import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { InstallForm } from './InstallForm'

export default async function InstallPage() {
  const supabase = createAdminClient()

  const { count, error } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')

  if (error || (count !== null && count > 0)) notFound()

  return <InstallForm />
}
