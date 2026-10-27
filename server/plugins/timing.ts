/** Adds a Server-Timing header so handler cost is visible in DevTools and testable. */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('request', (event) => { event.context._t0 = process.hrtime.bigint() })
  nitro.hooks.hook('beforeResponse', (event) => {
    const t0 = event.context._t0 as bigint | undefined
    if (t0 && !event.node.res.headersSent) {
      setHeader(event, 'Server-Timing', `app;dur=${(Number(process.hrtime.bigint() - t0) / 1e6).toFixed(2)}`)
    }
  })
})
