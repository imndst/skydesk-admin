import type { Page } from '@playwright/test'

export async function signIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel('ایمیل').fill('admin@skydesk.demo')
  await page.getByLabel('رمز عبور').fill('Admin#2026demo')
  await page.getByRole('button', { name: 'ورود' }).click()
  await page.waitForURL('**/')
}

/** Returns a list of layout problems found in the current DOM. Empty list = pass. */
export async function layoutProblems(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = []
    const de = document.documentElement
    if (de.scrollWidth > de.clientWidth + 1) problems.push(`page scrolls horizontally (${de.scrollWidth} > ${de.clientWidth})`)

    const describe = (el: Element) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/).slice(0, 3).join('.') : ''}`
    const visible = (el: Element) => {
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect()
      return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0
    }
    const inFlow = (el: Element) => !['absolute', 'fixed'].includes(getComputedStyle(el).position)

    // 1. siblings in normal flow must never intersect
    for (const parent of document.querySelectorAll('body *')) {
      if (parent.closest('[role="dialog"], [aria-live], [data-slot="leading"], [data-slot="trailing"]')) continue
      const kids = [...parent.children].filter(k => visible(k) && inFlow(k) && !['contents', 'inline'].includes(getComputedStyle(k).display))
      for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i]!.getBoundingClientRect(), b = kids[j]!.getBoundingClientRect()
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
        if (w > 1 && h > 1) problems.push(`overlap: ${describe(kids[i]!)} x ${describe(kids[j]!)} (${Math.round(w)}x${Math.round(h)}px)`)
      }
    }
    // 2. nothing may stick out of the viewport to the right
    for (const el of document.querySelectorAll('body *')) {
      if (!visible(el) || el.closest('.overflow-x-auto')) continue
      const r = el.getBoundingClientRect()
      if (r.right > de.clientWidth + 1) problems.push(`outside viewport: ${describe(el)} right=${Math.round(r.right)}`)
    }
    // 3. tap targets on touch layouts
    if (de.clientWidth < 768) {
      for (const el of document.querySelectorAll('button, a[href], [role="button"]')) {
        if (!visible(el)) continue
        const r = el.getBoundingClientRect()
        if (r.height < 28 || r.width < 28) problems.push(`small tap target: ${describe(el)} ${Math.round(r.width)}x${Math.round(r.height)}`)
      }
    }
    return problems.slice(0, 20)
  })
}
