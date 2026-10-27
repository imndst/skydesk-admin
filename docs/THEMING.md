# Theme system

This document explains how admin theme settings become the look of every page, and how to extend it.

## Data flow

1. The admin edits settings on `/settings`. The page keeps a **draft** and applies every *valid* draft to the whole app immediately (live preview). Invalid drafts, such as a half-typed hex, are ignored so the UI never flickers.
2. **Save** sends `PUT /api/theme` with `{ version, settings }`.
   - The body is validated by `themeSchema` (Zod). Unknown keys are stripped.
   - The write only succeeds if `version` is still current (optimistic concurrency). Otherwise the API answers `409`.
3. The server stores the JSON in the `settings` table and caches the parsed value in memory.
4. On every request, `app/plugins/theme.ts` reads the theme during SSR, then:
   - `buildThemeCss(theme)` → a `<style id="sd-theme">` with CSS custom properties;
   - `buildUiAppConfig(theme)` → merged into `useAppConfig().ui`, which every Nuxt UI component reads.
5. `GET /api/theme` is public (the login page is themed too) and supports `ETag` / `304`.

## Tokens

| Token | CSS output | Used by |
|---|---|---|
| `colors.primary` … `colors.error` | `--color-sd<name>-50 … 950` (500 = exact hex, other shades mixed in OKLab) | Nuxt UI semantic colors (`color="primary"`, `text-primary`, `bg-success/10`, …) |
| `colors.page` | `--sd-page` | page background |
| `colors.surface`, `border`, `text`, `muted` | `--ui-bg`, `--ui-border`, `--ui-text-highlighted`, `--ui-text`, `--ui-text-muted` (light mode) | cards, fields, menus, text |
| `colors.headerBg`, `headerFg` | `--sd-header-bg`, `--sd-header-fg` | page header band |
| `neutral` | Nuxt UI neutral palette | grays, dark mode |
| `typography.font` | `--font-sans` | whole app |
| `typography.scale` | `html { font-size }` | everything sized in rem |
| `shape.radius` | `--ui-radius` | base radius for all components |

## Component defaults

`buildUiAppConfig` maps component settings to Nuxt UI's theming API:

| Setting | Nuxt UI config |
|---|---|
| `button.color/variant/size` | `ui.button.defaultVariants` |
| `button.radius/weight/shadow` | `ui.button.slots.base` (fixed class map, e.g. `rounded-full font-bold shadow-md`) |
| `field.*` | `ui.input`, `ui.textarea`, `ui.inputNumber`, `ui.select`, `ui.selectMenu` (`defaultVariants` + `slots.base`), `ui.formField` |
| `card.*` | `ui.card.defaultVariants.variant`, `ui.card.slots.root` |
| `badge.*` | `ui.badge.defaultVariants`, radius overridden per size variant |
| `tabs.*` | `ui.tabs.defaultVariants`, `ui.tabs.variants.variant.pill` |
| `modal.*` | `ui.modal.slots.overlay` (blur), `ui.modal.variants.fullscreen.false.content` (radius) |

All class names produced here are literals inside `shared/theme.ts`, and `main.css` has `@source "../../../shared"`, so Tailwind always generates them.

## Rule for page code

Pages pass **meaning, not styling**:

- default action: no props
- destructive: `color="error"`
- secondary / cancel: `color="neutral" variant="outline"`
- call to action: `color="secondary"`

Anything else (size, radius, weight, variant of the default button, field style, card style) comes from the theme.

## Adding a setting

1. Add the field to `themeSchema` and `DEFAULT_THEME` in `shared/theme.ts` (use an enum, never free text, for anything that becomes a class or CSS value).
2. Map it in `buildUiAppConfig` (classes from a fixed map) or `buildThemeCss` (validated value).
3. Add a control to `app/pages/settings.vue` and labels to `app/utils/themeOptions.ts`.
4. Add a test in `tests/theme.test.ts`.

Existing stored settings keep working: `normalizeTheme` deep-merges them with the defaults.

## Security model

- Colors must match `^#[0-9a-f]{6}$`.
- Every other option is an enum looked up in a fixed table before it becomes a class or CSS value.
- `buildThemeCss` re-validates its input and falls back to the defaults, so even a corrupted database row cannot inject CSS.
- Covered by `tests/theme.test.ts` (CSS injection, `url()`, class injection, HTML in the brand name, unknown keys, stale versions).

## Exports

- **Design tokens (JSON):** W3C Design Tokens format, importable in Tokens Studio for Figma.
- **Settings backup (JSON):** the raw settings; restoring validates the file before applying it as a draft.
