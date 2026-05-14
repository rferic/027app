import { test, expect, type Page } from '@playwright/test'

const adminEmail = process.env.TEST_ADMIN_EMAIL ?? ''
const adminPassword = process.env.TEST_ADMIN_PASSWORD ?? ''

async function loginAsAdmin(page: Page) {
  await page.goto('/en/auth/login')
  await page.getByLabel(/email/i).fill(adminEmail)
  await page.getByLabel(/password/i).fill(adminPassword)
  await page.getByRole('button', { name: /sign in|login|iniciar/i }).click()
  await page.waitForURL(/\/en\/admin\/dashboard/)
}

test('admin apps: full install / configure / uninstall flow', async ({ page }) => {
  await loginAsAdmin(page)

  // 1. Navigate to /admin/apps
  await page.goto('/en/admin/apps')
  await expect(page).toHaveURL(/\/en\/admin\/apps/)

  // If todo is already installed, uninstall it first to start fresh
  const uninstallBtnInitial = page.getByRole('button', { name: /uninstall/i }).first()
  const todoAlreadyInstalled = await uninstallBtnInitial.isVisible({ timeout: 2000 }).then(() => true, () => false)
  if (todoAlreadyInstalled) {
    await uninstallBtnInitial.click()
    await expect(page.getByRole('button', { name: /^install$/i }).first()).toBeVisible({ timeout: 10000 })
  }

  // 2. todo app should be not installed — no Active badge visible for it
  await expect(page.getByRole('button', { name: /^install$/i }).first()).toBeVisible()

  // 3. Click Install
  const installBtn = page.getByRole('button', { name: /^install$/i }).first()
  await installBtn.click()

  // Wait for Active badge to appear
  await expect(page.locator('text=Active').first()).toBeVisible({ timeout: 15000 })

  // 4. Click Configure → should navigate to /admin/apps/todo
  const configureLink = page.getByRole('link', { name: /configure/i }).first()
  await expect(configureLink).toBeVisible()
  await configureLink.click()
  await expect(page).toHaveURL(/\/en\/admin\/apps\/todo/, { timeout: 5000 })

  // 5. Go back to apps list and uninstall
  await page.goto('/en/admin/apps')
  const uninstallBtn = page.getByRole('button', { name: /uninstall/i }).first()
  await expect(uninstallBtn).toBeVisible()
  await uninstallBtn.click()

  // Verify the install button reappears
  await expect(page.getByRole('button', { name: /^install$/i }).first()).toBeVisible({ timeout: 15000 })
})
