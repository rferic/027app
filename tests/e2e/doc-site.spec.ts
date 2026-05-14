import { test, expect } from '@playwright/test'

// 1. Routing
test('/doc redirige a /en/doc', async ({ page }) => {
  await page.goto('/doc')
  await expect(page).toHaveURL(/\/en\/doc/)
})

test('/en/doc carga sin 404', async ({ page }) => {
  await page.goto('/en/doc')
  await expect(page.locator('h1').first()).toBeVisible()
})

// 2. Páginas internas
test('/en/doc/api carga correctamente', async ({ page }) => {
  await page.goto('/en/doc/api')
  await expect(page.locator('h1').first()).toBeVisible()
})

test('/en/doc/api/i18n carga (antes era 404)', async ({ page }) => {
  await page.goto('/en/doc/api/i18n')
  await expect(page.locator('h1').first()).toBeVisible()
})

// 3. Language switcher visible
test('language switcher visible en /en/doc', async ({ page }) => {
  await page.goto('/en/doc')
  // Fumadocs renderiza LanguageSelect como button con el nombre del locale actual
  const langButton = page.locator('button').filter({ hasText: /English/i }).first()
  await expect(langButton).toBeVisible({ timeout: 5000 })
})

// 4. Cambio de idioma — Fumadocs language items son <button> sin role
test('cambiar idioma navega a /{locale}/doc', async ({ page }) => {
  await page.goto('/en/doc')
  const langButton = page.locator('button').filter({ hasText: /English/i }).first()
  await langButton.click()
  // El dropdown muestra botones con el nombre del idioma
  const esButton = page.locator('button').filter({ hasText: /^Español$/ })
  await expect(esButton).toBeVisible({ timeout: 3000 })
  await esButton.click()
  await expect(page).toHaveURL(/\/es\/doc/)
})

// 5. Sidebar dropdown expande
test('REST API section expands in sidebar', async ({ page }) => {
  await page.goto('/en/doc')
  const restApiTrigger = page.locator('button').filter({ hasText: /REST API/i }).first()
  await expect(restApiTrigger).toBeVisible()
  await restApiTrigger.click()
  await expect(
    page.getByRole('link', { name: /Authentication|Errors/i }).first()
  ).toBeVisible({ timeout: 3000 })
})

// 6. Cursor pointer en triggers
test('sidebar folder trigger tiene cursor pointer', async ({ page }) => {
  await page.goto('/en/doc')
  const trigger = page.locator('button').filter({ hasText: /REST API/i }).first()
  await expect(trigger).toBeVisible()
  const cursor = await trigger.evaluate((el) => window.getComputedStyle(el).cursor)
  expect(cursor).toBe('pointer')
})

// 7. Sin errores de hydration
test('no hay hydration errors en consola', async ({ page }) => {
  const hydrationErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /hydrat/i.test(msg.text())) {
      hydrationErrors.push(msg.text())
    }
  })
  await page.goto('/en/doc')
  await page.waitForLoadState('networkidle')
  expect(hydrationErrors).toHaveLength(0)
})
