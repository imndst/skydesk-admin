# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.0.0] - 2026-10-27

### Added
- Admin theme settings: design tokens (colors with generated shade scales, font, scale, radius, color mode, header style) and Nuxt UI component defaults (button, fields, card, badge, tabs, modal).
- Live preview, unsaved-change guard, version-checked saves, WCAG contrast report, 5 presets, W3C design-token export, settings backup and restore.
- Persian RTL interface with self-hosted Vazirmatn, Toman prices, Jalali date display, Persian digit input.
- Mobile bottom navigation; card layout for tables on small screens.
- Theme tests (mapping, presets, injection, concurrency, SSR output) and an end-to-end theme flow test.
- GitHub Actions CI.

### Changed
- Money stored as integer Toman (was USD cents); the demo database is rebuilt automatically on schema change.
- Runs on Node.js 20.18: Nuxt 3.17 + Nuxt UI 3 with pinned transitive dependencies.
- Project symbols are imported explicitly; directory auto-import scanning is disabled.

### Fixed
- Dev server 403 on CSS with Vite ≥ 6.4.4 (Vite pinned to 6.4.3).
- Static assets not served in production with `@rollup/plugin-replace` 6.0.3 (pinned to 6.0.2).
- Tab triggers pointing to missing panels (`aria-controls`), a label not linked to its input.

## [1.0.0] - 2026-10-26

### Added
- Flights, hotels and bookings management with SQLite, transactional inventory and server-side totals.
- Authentication (scrypt, signed sessions), CSRF protection, rate limiting, CSP and security headers.
- Shared Zod validation for client and server.
- API, security and performance tests; Playwright layout and accessibility tests.
