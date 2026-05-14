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

test('admin can change app visibility to private', async ({ page }) => {
  await loginAsAdmin(page)

  await page.goto('/en/admin/apps')

  // Install todo if not installed
  const installBtn = page.getByRole('button', { name: /^install$/i }).first()
  const needsInstall = await installBtn.isVisible({ timeout: 2000 }).catch(() => false)
  if (needsInstall) {
    await installBtn.click()
    await expect(page.locator('text=Active').first()).toBeVisible({ timeout: 15000 })
  }

  await page.goto('/en/admin/apps/todo')

  // Wait for Access section
  await expect(page.getByRole('heading', { name: /access/i })).toBeVisible()

  // Click Private
  await page.getByRole('button', { name: /private/i }).click()

  // Verify Private is active (selected/highlighted)
  await expect(page.getByRole('button', { name: /private/i })).toHaveAttribute('aria-pressed', 'true')
    .catch(() => expect(page.getByRole('button', { name: /private/i })).toHaveClass(/active|selected|ring/))

  // Restore to public
  await page.getByRole('button', { name: /public/i }).click()
})

test('admin can grant and revoke access to a member', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/en/admin/apps/todo')

  await expect(page.getByRole('heading', { name: /access/i })).toBeVisible()

  // Check if any member without access exists
  const grantBtn = page.getByRole('button', { name: /grant access/i }).first()
  const hasGrant = await grantBtn.isVisible({ timeout: 3000 }).catch(() => false)

  if (hasGrant) {
    await grantBtn.click()
    await expect(page.getByText(/has access/i).first()).toBeVisible({ timeout: 5000 })
  } else {
    // Try revoke instead
    const revokeBtn = page.getByRole('button', { name: /revoke/i }).first()
    await expect(revokeBtn).toBeVisible()
    await revokeBtn.click()
    await expect(page.getByText(/has access/i)).toHaveCount(0, { timeout: 5000 })
  }
})
