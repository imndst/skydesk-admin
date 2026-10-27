import { readTheme } from '../utils/theme'
/** Public: the login page is themed too. Contains no secrets. */
export default defineEventHandler((event) => {
  const t = readTheme()
  const etag = `"theme-v${t.version}"`
  setHeader(event, 'ETag', etag)
  setHeader(event, 'Cache-Control', 'no-cache')
  if (getHeader(event, 'if-none-match') === etag) { setResponseStatus(event, 304); return null }
  return { version: t.version, updatedAt: t.updatedAt, settings: t.settings }
})
