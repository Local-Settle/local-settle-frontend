# Contributing to LocalSettle

Thanks for helping improve LocalSettle. This repository contains the Next.js frontend; coordinate API contract changes with the companion backend repository.

## Before you start

- Check existing issues and pull requests before starting substantial work. For larger changes, open an issue to agree on scope.
- Keep changes focused and preserve the existing App Router and feature-based organization.
- Never include secrets, private keys, recovery phrases, or real user data in code, screenshots, logs, or issues.

## Set up and work locally

Use Node.js 20+ and pnpm from the repository root. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the backend URL.

```bash
pnpm install
pnpm dev
```

Place routes and shared layouts in `src/app/`, feature logic and UI in the owning `src/features/` area, and static assets in `public/`. Follow the nearby TypeScript and React patterns. Use PascalCase for components, `useX` for hooks, and clear descriptive names for other modules.

## Checks and tests

Add or update regression tests for behavior changes. Frontend tests use Vitest and Testing Library; follow existing `*.test.ts(x)` and `__tests__/` patterns.

```bash
pnpm test
pnpm lint
pnpm build
```

Run relevant checks before opening a pull request and report any checks you could not run.

## Commits and pull requests

Use concise Conventional Commit style, for example `feat: add offer filters` or `fix: handle expired wallet session`. Keep commits focused. A pull request should explain the user-visible change and implementation, link related issues, list validation performed, and note configuration or API changes. Include screenshots or a short recording for UI changes, covering mobile layouts when relevant.

## Security reports

Do not disclose vulnerabilities, credentials, or sensitive user information in public issues. Contact the maintainers privately through the GitHub repository's security reporting channel.
