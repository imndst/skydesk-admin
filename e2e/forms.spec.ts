import { test, expect } from '@playwright/test'
import { signIn, layoutProblems } from './helpers'

test('login: field errors and wrong credentials', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'ورود' }).click()
  await expect(page.getByText('ایمیل معتبر وارد کنید')).toBeVisible()
  await page.getByLabel('ایمیل').fill('admin@skydesk.demo')
  await page.getByLabel('رمز عبور').fill('wrong-password')
  await page.getByRole('button', { name: 'ورود' }).click()
  await expect(page.getByRole('alert')).toContainText('ایمیل یا رمز عبور اشتباه است')
})

test('flight form: validates, creates, and shows the new flight', async ({ page }) => {
  await signIn(page)
  await page.goto('/flights')
  await page.getByRole('button', { name: 'پرواز جدید' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'ثبت پرواز' }).click()
  await expect(dialog.getByText('نام ایرلاین باید حداقل ۲ کاراکتر باشد')).toBeVisible()
  expect(await layoutProblems(page)).toEqual([])

  await dialog.getByLabel('ایرلاین').fill('هواپیمایی آزمایشی')
  await dialog.getByLabel('شماره پرواز').fill('E2123')
  await dialog.getByLabel('مبدأ (کد فرودگاه)').fill('thr')
  await dialog.getByLabel('مقصد (کد فرودگاه)').fill('thr')
  await dialog.getByLabel('زمان حرکت').fill('2030-01-01T10:00')
  await dialog.getByLabel('زمان رسیدن').fill('2030-01-01T09:00')
  await dialog.getByRole('button', { name: 'ثبت پرواز' }).click()
  await expect(dialog.getByText('مقصد باید با مبدأ متفاوت باشد')).toBeVisible()
  await expect(dialog.getByText('زمان رسیدن باید بعد از زمان حرکت باشد')).toBeVisible()

  await dialog.getByLabel('مقصد (کد فرودگاه)').fill('mhd')
  await dialog.getByLabel('زمان رسیدن').fill('2030-01-01T11:30')
  await dialog.getByLabel('قیمت هر صندلی (تومان)').fill('2500000')
  await dialog.getByLabel('تعداد صندلی').fill('50')
  await dialog.getByRole('button', { name: 'ثبت پرواز' }).click()
  await expect(page.getByText('پرواز ثبت شد', { exact: true })).toBeVisible()
  await page.getByPlaceholder('جستجوی ایرلاین، شماره پرواز یا فرودگاه').fill('E2123')
  await expect(page.getByText('هواپیمایی آزمایشی').filter({ visible: true }).first()).toBeVisible()
})

test('XSS payload typed into a form is rejected and never executed', async ({ page }) => {
  let dialogFired = false
  page.on('dialog', async (d) => { dialogFired = true; await d.dismiss() })
  await signIn(page)
  await page.goto('/hotels')
  await page.getByRole('button', { name: 'هتل جدید' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('نام هتل').fill('<img src=x onerror=alert(1)>')
  await dialog.getByLabel('شهر').fill('مشهد')
  await dialog.getByLabel('قیمت هر شب (تومان)').fill('3000000')
  await dialog.getByLabel('تعداد اتاق').fill('10')
  await dialog.getByRole('button', { name: 'ثبت هتل' }).click()
  await expect(dialog.getByText('نام هتل شامل کاراکترهای غیرمجاز است')).toBeVisible()
  expect(dialogFired).toBe(false)
})

test('search box treats SQL as text', async ({ page }) => {
  await signIn(page)
  await page.goto('/flights')
  await page.getByPlaceholder('جستجوی ایرلاین، شماره پرواز یا فرودگاه').fill("' OR 1=1; DROP TABLE flights;--")
  await expect(page.getByText('پروازی پیدا نشد')).toBeVisible()
  await page.getByPlaceholder('جستجوی ایرلاین، شماره پرواز یا فرودگاه').fill('')
  await expect(page.getByText('IR452').filter({ visible: true }).first()).toBeVisible()
})
