import { test, expect } from '@playwright/test'
import { signIn } from './helpers'

const primary = (page: any) => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-sdprimary-500').trim())

test.describe.configure({ mode: 'serial' })

/** Desktop shows tabs, mobile shows a select: same sections. */
async function openSection(page: any, name: string) {
  const tab = page.getByRole('tab', { name })
  if (await tab.isVisible()) return tab.click()
  await page.getByRole('combobox', { name: 'بخش تنظیمات' }).click()
  await page.getByRole('option', { name }).click()
}

test('theme settings: live preview, save, applied everywhere, unsaved changes revert', async ({ page }) => {
  page.on('dialog', d => d.accept())
  await signIn(page)
  await page.goto('/settings')
  const hex = page.getByLabel('کد رنگ اصلی (Primary)')

  await hex.fill('#7c3aed')
  await expect.poll(() => primary(page)).toBe('#7c3aed') // live preview
  await hex.fill('#7c3') // half-typed: theme must not break
  await hex.blur()
  await expect.poll(() => primary(page)).toBe('#7c3aed')
  await expect(page.getByText('رنگ اصلی باید کد رنگ شش‌رقمی باشد', { exact: false })).toBeVisible()
  await hex.fill('#7c3aed')

  await page.getByRole('button', { name: 'ذخیره تغییرات' }).click()
  await expect(page.getByText('ظاهر سایت ذخیره شد', { exact: true })).toBeVisible()

  await page.goto('/hotels')
  expect(await primary(page)).toBe('#7c3aed')

  // unsaved change, then leave: the preview is dropped
  await page.goto('/settings')
  await page.getByLabel('کد رنگ اصلی (Primary)').fill('#ff0000')
  await page.getByRole('link', { name: 'رزروها' }).first().click()
  await page.waitForURL('**/bookings')
  expect(await primary(page)).toBe('#7c3aed')

  // restore defaults for the other tests
  await page.goto('/settings')
  await openSection(page, 'قالب‌ها')
  await page.getByRole('button', { name: 'بازنشانی به پیش‌فرض' }).click()
  await page.getByRole('button', { name: 'ذخیره تغییرات' }).click()
  await expect(page.getByText('ظاهر سایت ذخیره شد', { exact: true })).toBeVisible()
})
