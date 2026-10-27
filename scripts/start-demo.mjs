// Cross-platform (Windows PowerShell/cmd too): run the production build over plain http on localhost.
process.env.INSECURE_COOKIES ??= '1'
await import('../.output/server/index.mjs')
