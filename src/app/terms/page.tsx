import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

const terms = [
  {
    title: "Development service",
    body: "LocalSettle is an open-source application in active development. Features, supported assets, networks, payment methods, and availability may change. The current wallet experience is configured for Stellar Testnet by default; test assets have no real-world value.",
  },
  {
    title: "Wallets and transactions",
    body: "You are responsible for choosing and securing your wallet, reviewing every transaction, and confirming its network, recipient, asset, and amount before signing. Transactions submitted to a public blockchain may be irreversible. LocalSettle cannot recover wallet keys or reverse a confirmed transaction.",
  },
  {
    title: "Peer-to-peer trades",
    body: "Buyers and sellers agree to local payment terms directly. Fiat payments happen outside Stellar and LocalSettle does not process those payments. Confirm payment details with your counterparty and verify receipt through your own financial provider before taking an on-chain action.",
  },
  {
    title: "Escrow and service limits",
    body: "The app coordinates Stellar escrow operations through Trustless Work and currently supports USDC for escrow. Contract state, role permissions, and available actions depend on the deployed contract and platform configuration. The application currently has no in-app refund operation. Do not treat interface status or uploaded evidence as a guarantee that a fiat payment has settled.",
  },
  {
    title: "Third-party services and eligibility",
    body: "Wallet providers, Stellar services, Trustless Work, Didit, and hosting or storage providers are operated by third parties. Their services are subject to their own terms. Some product flows require identity verification through Didit where enabled by the deployment.",
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#081521] text-slate-300">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#081521]/90 px-5 backdrop-blur md:px-8">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" />Back to LocalSettle</Link>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#55D6BE]"><FileText className="h-4 w-4" />Terms</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#55D6BE]">Terms of use</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">Using LocalSettle</h1>
        <p className="mt-5 text-sm leading-7 text-slate-400">Last updated: October 2026. By using a LocalSettle deployment, you agree to use it lawfully and to review these terms and the deployment’s configuration.</p>
        <div className="mt-12 space-y-9">
          {terms.map((term, index) => (
            <section key={term.title} className="border-t border-white/10 pt-7">
              <h2 className="text-lg font-semibold text-white">{index + 1}. {term.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{term.body}</p>
            </section>
          ))}
        </div>
        <p className="mt-12 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5 text-xs leading-6 text-slate-400">This page is a project-level usage notice. Hosted deployments should publish terms that identify their operator and applicable jurisdiction.</p>
      </main>
      <footer className="border-t border-white/10 px-5 py-8 text-center text-xs text-slate-500">© 2026 LocalSettle</footer>
    </div>
  );
}
