# Contributing

## Setup

```bash
npm ci
npm run dev
```

Use Node.js 20.18 or newer (`.nvmrc` is provided). Install with `npm ci`, not `npm install`, so the pinned dependency tree in `package-lock.json` is kept.

## Before opening a pull request

```bash
npm test                                   # build + API, security, theme, performance tests
npx playwright install chromium
npm run test:e2e                           # browser tests on 5 viewports
```

## Conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `ci:`, `chore:`, `refactor:`).
- **Validation:** add or change rules in `shared/schemas.ts`; the same schema runs in the browser and on the server.
- **SQL:** prepared statements only. Never build SQL text from user input; map sort keys through an allow-list.
- **Styling:** do not pass styling props to Nuxt UI components in pages. Extend the theme instead (see [docs/THEMING.md](docs/THEMING.md)).
- **Layout:** no `absolute`/`fixed` positioning in app layouts; use flex/grid in normal flow.
- **Imports:** auto-import scanning of project folders is off. Import project composables, utils, components and types explicitly.
- **Dependencies:** `overrides` in `package.json` keep the tree compatible with Node 20.18. Check `npm ci` shows no `EBADENGINE` warnings after any upgrade.
