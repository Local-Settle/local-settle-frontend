import { ArrowDownUp, Database, Wallet } from "lucide-react";

const components = [
  {
    icon: ArrowDownUp,
    title: "Local currency marketplace",
    body: "People publish buy and sell offers, agree on an amount and payment method, and coordinate the off-chain transfer through an order chat.",
  },
  {
    icon: Wallet,
    title: "Stellar wallet flows",
    body: "A connected Stellar wallet proves account ownership and signs user transactions. The app currently targets Stellar Testnet by default.",
  },
  {
    icon: Database,
    title: "Settlement coordination",
    body: "The NestJS API stores profiles, offers, orders, chat, and escrow references in PostgreSQL. Trustless Work and a Stellar event listener help coordinate escrow state.",
  },
];

export default function PlatformOverviewPage() {
  return (
    <div className="space-y-12">
      <header className="max-w-3xl space-y-4 border-b border-white/10 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#55D6BE]">Project overview</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">LocalSettle connects local payments with Stellar assets.</h1>
        <p className="text-base leading-7 text-slate-300">
          It is an open-source peer-to-peer marketplace and wallet app for people who want to exchange stablecoins for local payment methods. The project combines offer discovery, order chat, escrow coordination, direct USDC transfers, and transaction history.
        </p>
      </header>

      <section className="space-y-5">
        <h2 className="text-xl font-semibold text-white">What the system does</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {components.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
              <Icon className="h-5 w-5 text-[#55D6BE]" />
              <h3 className="mt-5 font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4 text-sm leading-7 text-slate-300">
        <h2 className="text-xl font-semibold text-white">Repository layout</h2>
        <p>The web client contains the Next.js app and wallet integration. The API contains the NestJS services, Prisma schema, and external integrations. They are separate Git repositories and can be developed and released independently.</p>
        <p>The backend coordinates application state and integrations. Stellar transactions that require a user’s authorization are prepared as XDR and signed by the connected wallet. Platform escrow setup also uses a configured operator account, so review the backend escrow implementation and deployment configuration when evaluating its trust boundaries.</p>
        <p>See <a className="text-[#55D6BE] underline underline-offset-4" href="/info/features">Platform Features</a> for the trade lifecycle and <a className="text-[#55D6BE] underline underline-offset-4" href="/info/security">Security Notes</a> for current boundaries and limitations.</p>
      </section>
    </div>
  );
}
