# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.
Email **imndst@gmail.com** with a description, steps to reproduce and the affected version.
You will get an answer within 7 days.

## Scope

This is a demo admin panel. Before running it in production:

- set `SESSION_SECRET` to a random string of at least 32 characters;
- change `ADMIN_EMAIL` and `ADMIN_PASSWORD` before the first start (the database is seeded once);
- serve it behind HTTPS and use `npm start` (secure cookies), not `npm run start:demo`;
- set `TRUST_PROXY=1` only behind a reverse proxy you control.

The security measures in place are listed in the [README](README.md#security) and covered by `tests/security.test.ts` and `tests/theme.test.ts`.
