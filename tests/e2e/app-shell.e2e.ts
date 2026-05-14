import { test, expect, type Page } from '@playwright/test'

const memberEmail = process.env.TEST_MEMBER_EMAIL ?? ''
const memberPassword = process.env.TEST_MEMBER_PASSWORD ?? ''

async function loginAsMember(page: Page) {
  await page.goto('/en/auth/login')
  await page.getByLabel(/email/i).fill(memberEmail)
  await page.getByLabel(/password/i).fill(memberPassword)
  await page.getByRole('button', { name: /sign in|login|iniciar/i }).click()
  await page.waitForURL(/\/en\/dashboard/)
}

test('member sees header and bottom nav on dashboard', async ({ page }) => {
  if (!memberEmail || !memberPassword) {
    test.skip(true, 'TEST_MEMBER_EMAIL / TEST_MEMBER_PASSWORD not set')
    return
  }

  await page.setViewportSize({ width: 375, height: 667 })
  await loginAsMember(page)
  await page.goto('/en/dashboard')

  // Header is visible
  await expect(page.locator('header')).toBeVisible()

  // Bottom nav visible on mobile (has md:hidden class)
  const bottomNav = page.locator('nav').filter({ hasText: /home/i })
  await expect(bottomNav).toBeVisible()

  // Home item is active
  await expect(bottomNav.getByRole('link', { name: /home/i })).toHaveAttribute('aria-current', 'page')
    .catch(() => expect(bottomNav.getByRole('link', { name: /home/i })).toHaveClass(/active/))
})

test('bottom nav is hidden on desktop', async ({ page }) => {
  if (!memberEmail || !memberPassword) {
    test.skip(true, 'TEST_MEMBER_EMAIL / TEST_MEMBER_PASSWORD not set')
    return
  }

  await page.setViewportSize({ width: 1280, height: 800 })
  await loginAsMember(page)
  await page.goto('/en/dashboard')

  // Bottom nav should not be visible on desktop (md:hidden)
  const bottomNav = page.locator('nav.md\\:hidden')
  await expect(bottomNav).toBeHidden()
})
