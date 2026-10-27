import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { signIn, layoutProblems } from './helpers'

const pages = ['/', '/flights', '/hotels', '/bookings', '/settings']

test.describe('layout: no overlap, no horizontal scroll, accessible', () => {
  test('login page', async ({ page }) => {
    await page.goto('/login')
    expect(await layoutProblems(page)).toEqual([])
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(axe.violations.map(v => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([])
  })

  for (const path of pages) {
    test(`page ${path}`, async ({ page }) => {
      await signIn(page)
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      expect(await layoutProblems(page)).toEqual([])
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      expect(axe.violations.map(v => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([])
    })
  }

  test('dark mode keeps the layout intact', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await signIn(page)
    await page.goto('/bookings')
    expect(await layoutProblems(page)).toEqual([])
  })
})
