import { test, expect } from '@playwright/test'

test.describe('Todo app i18n', () => {
  test('shows Spanish UI when locale is es', async ({ page }) => {
    await page.goto('/es/apps/todo')
    await expect(page.locator('h1')).toContainText('Tareas')
  })
})
