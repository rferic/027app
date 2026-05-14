'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { updateGroupSettings, ALL_LOCALES } from '@/lib/use-cases/settings'

export interface SettingsState {
  error: string | null
  success?: boolean
}

export async function updateSettingsAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const activeLocales = ALL_LOCALES.filter((loc) => formData.get(`locale_${loc}`) === 'on')
  const defaultLocale = formData.get('default_locale') as string

  if (activeLocales.length === 0) {
    return { error: 'atLeastOne' }
  }

  if (!activeLocales.includes(defaultLocale as typeof ALL_LOCALES[number])) {
    return { error: 'atLeastOne' }
  }

  try {
    await updateGroupSettings({ activeLocales, defaultLocale })
    const cookieStore = await cookies()
    const locale = cookieStore.get('preferred-locale')?.value ?? 'en'
    revalidatePath(`/${locale}/admin/settings/general`)
    return { error: null, success: true }
  } catch {
    return { error: 'saveFailed' }
  }
}
