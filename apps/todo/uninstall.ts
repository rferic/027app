import type { AppInstallContext } from '@/types/apps'

export async function uninstall(_ctx: AppInstallContext): Promise<void> {
  // todo_items rows are deleted via CASCADE when table is dropped in uninstall.sql
}
