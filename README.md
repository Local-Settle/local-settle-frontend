# LocalSettle Web App

LocalSettle is an open-source Stellar wallet app for peer-to-peer stablecoin trades against local payment methods. Users can browse offers, coordinate orders and payment evidence, track escrow status, send USDC to a wallet or alias, and review transactions.

This repository contains the Next.js frontend. The NestJS API and integration services live in the companion [`iKash-backend` repository](https://github.com/iKa-h/iKash-backend).

## Product flows

- Connect a supported Stellar wallet and authenticate by signing a short-lived challenge.
- Browse or publish buy and sell offers, create orders, and coordinate with the counterparty through order chat.
- Prepare and sign Stellar transactions in the connected wallet; direct USDC sends support wallet addresses and LocalSettle aliases.
- View account balances, transaction history, settings, profile and KYC status.

The app currently defaults to Stellar Testnet. P2P escrow supports USDC and uses Trustless Work through the backend. Fiat payments occur between users off-chain. See the public pages at `/info`, `/info/features`, and `/info/security` for a summary of the current implementation.

## Development

Requirements: Node.js 20+ and pnpm (the repository includes `pnpm-lock.yaml`). Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the local backend URL.

```bash
pnpm install
pnpm dev
```

The development server runs at [http://localhost:3000](http://localhost:3000). Commands:

```bash
pnpm build       # Create a production build
pnpm lint        # Run ESLint
pnpm test        # Run Vitest once
pnpm analyze     # Build with bundle analysis enabled
```

## Structure

- `src/app/` contains App Router routes, public pages, protected product pages, and shared layout components.
- `src/features/` contains wallet, user, offer, order, escrow, chat, settings, and transaction logic.
- `src/lib/` contains API client helpers; `public/` contains static images and LocalSettle brand assets.

## Contributing

Place feature-specific UI and state close to the owning feature. Add regression coverage for changed behavior, follow nearby TypeScript conventions, and document any required environment changes. Keep wallet signing inside the wallet integration and never ask users to share private keys or recovery phrases.
