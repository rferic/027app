'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { installApp } from '@/lib/use-cases/install'

const VALID_LOCALES = ['en', 'es', 'it']

export async function install(formData: FormData): Promise<{ error: string } | void> {
  const result = await installApp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    displayName: formData.get('display_name') as string,
    groupName: formData.get('group_name') as string,
  })
  if ('error' in result) return { error: result.error }
  const cookieStore = await cookies()
  const raw = cookieStore.get('preferred-locale')?.value
  const locale = raw && VALID_LOCALES.includes(raw) ? raw : 'en'
  redirect(`/${locale}/login`)
}
