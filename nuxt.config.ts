export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  // Nuxt 3.17 (last line that runs on Node 20.18) with the Nuxt 4 folder layout (app/, shared/)
  future: { compatibilityVersion: 4 },
  modules: ['@nuxt/ui', 'nuxt-security'],
  // Our own composables, utils, components and types are imported explicitly in every file.
  // Directory auto-import scanning is off: on some Windows setups it silently missed app/composables
  // ("useTheme is not defined"). Nuxt/Vue built-ins are still auto-imported; Nuxt UI's useToast is imported explicitly from #ui.
  imports: { scan: false },
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  telemetry: false,
  ui: { fonts: false },
  icon: { provider: 'none', clientBundle: { scan: true, sizeLimitKb: 256, icons: [
      // icons Nuxt UI uses internally (select chevrons, pagination, toasts…) are not found by the scanner
      'lucide:layout-dashboard', 'lucide:ticket', 'lucide:app-window', 'lucide:x', 'lucide:arrow-left', 'lucide:arrow-right', 'lucide:arrow-up-right', 'lucide:check', 'lucide:chevron-down', 'lucide:chevron-left', 'lucide:chevron-right', 'lucide:chevron-up', 'lucide:chevrons-left', 'lucide:chevrons-right', 'lucide:ellipsis', 'lucide:loader-circle', 'lucide:minus', 'lucide:plus', 'lucide:search', 'lucide:upload', 'lucide:circle-alert', 'lucide:circle-check', 'lucide:circle-x', 'lucide:info', 'lucide:triangle-alert', 'lucide:sun', 'lucide:moon', 'lucide:monitor'
    ] }, serverBundle: 'local' },
  colorMode: { preference: 'light', fallback: 'light' },
  app: {
    head: {
      htmlAttrs: { lang: 'fa', dir: 'rtl' },
      title: 'پنل مدیریت',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'robots', content: 'noindex, nofollow' }
      ]
    }
  },
  routeRules: { '/login': { ssr: true } },
  security: {
    nonce: true,
    corsHandler: false, // same-origin only: no CORS headers are emitted
    rateLimiter: false, // own limiter lives in server/middleware/guard.ts (runtime-configurable)
    requestSizeLimiter: { maxRequestSizeInBytes: 20_000, maxUploadFileRequestInBytes: 20_000, throwError: true },
    xssValidator: { methods: ['GET', 'POST', 'PUT', 'PATCH'], throwError: true },
    headers: {
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'base-uri': ["'none'"],
        'connect-src': ["'self'"],
        'font-src': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'frame-src': ["'none'"],
        'img-src': ["'self'", 'data:'],
        'object-src': ["'none'"],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'script-src': ["'self'", "'strict-dynamic'", "'nonce-{{nonce}}'"],
        'upgrade-insecure-requests': false
      },
      strictTransportSecurity: { maxAge: 31536000, includeSubdomains: true },
      xFrameOptions: 'DENY',
      referrerPolicy: 'no-referrer',
      permissionsPolicy: { camera: [], microphone: [], geolocation: [], payment: [] }
    }
  },
  nitro: { compressPublicAssets: true }
})
