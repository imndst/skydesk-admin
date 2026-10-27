/** WCAG 2.x contrast ratio between two #rrggbb colors. */
function luminance(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!
}

export function contrastRatio(a: string, b: string) {
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return 0
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100
}

/** AA for normal text = 4.5, for large/bold UI text = 3. */
export const contrastLevel = (ratio: number) => ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA-large' : 'fail'
