import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const sections = [
  {
    title: "Information used by the service",
    body: "LocalSettle stores the Stellar public key associated with an account, optional profile details, aliases, KYC status, saved payment methods, offers, orders, escrow references, and order chat. Security audit records may include request IP address, user agent, action, and selected event metadata. Payment evidence is stored through the configured file-storage provider.",
  },
  {
    title: "Wallets and public networks",
    body: "Wallet providers handle your private keys and sign transactions requested by the app. Public keys and transactions submitted to Stellar are visible on the network. LocalSettle cannot remove public blockchain records.",
  },
  {
    title: "Service providers",
    body: "The application integrates with Stellar network services, Trustless Work for escrow operations, Didit for identity-verification sessions, PostgreSQL for application data, and Google Cloud Storage when configured for file storage. Those providers process data needed to deliver their part of the service under their own terms.",
  },
  {
    title: "Sharing during a trade",
    body: "Payment-method details and trade messages may be visible to the other participant in an order because they are needed to complete the off-chain payment. Do not send passwords, wallet recovery phrases, private keys, or unrelated identity documents through chat.",
  },
  {
    title: "Retention and requests",
    body: "Application records are retained as needed to operate the service, support account and trade flows, and meet security or legal obligations. Retention periods and request handling depend on the deployment and applicable requirements. Contact the project maintainers through the repository for privacy questions or data requests.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#081521] text-slate-300">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#081521]/90 px-5 backdrop-blur md:px-8">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" />Back to LocalSettle</Link>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#55D6BE]"><ShieldCheck className="h-4 w-4" />Privacy</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#55D6BE]">Privacy notice</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">Your data in LocalSettle</h1>
        <p className="mt-5 text-sm leading-7 text-slate-400">Last updated: October 2026. This notice describes the information the current LocalSettle application handles and why it is needed.</p>
        <div className="mt-12 space-y-9">
          {sections.map((section, index) => (
            <section key={section.title} className="border-t border-white/10 pt-7">
              <h2 className="text-lg font-semibold text-white">{index + 1}. {section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{section.body}</p>
            </section>
          ))}
        </div>
        <p className="mt-12 rounded-2xl border border-[#55D6BE]/20 bg-[#55D6BE]/5 p-5 text-xs leading-6 text-slate-400">LocalSettle is open-source software in active development. The data practices of a hosted deployment may depend on its operators and configuration.</p>
      </main>
      <footer className="border-t border-white/10 px-5 py-8 text-center text-xs text-slate-500">© 2026 LocalSettle</footer>
    </div>
  );
}
