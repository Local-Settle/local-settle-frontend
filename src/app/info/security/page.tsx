import { KeyRound, Network, ShieldCheck } from "lucide-react";

const notes = [
  {
    icon: KeyRound,
    title: "Wallet authorization",
    body: "The browser connects to a Stellar wallet for account access and user transaction signatures. LocalSettle stores the public key and application session data; keep your wallet recovery phrase and private keys inside your wallet provider.",
  },
  {
    icon: Network,
    title: "Platform escrow key",
    body: "The backend uses a configured operator secret to sign and broadcast escrow deployment transactions. This platform key is a separate trust boundary from a user’s wallet and must be protected by deployment secret management.",
  },
  {
    icon: ShieldCheck,
    title: "Identity and payment data",
    body: "KYC sessions are created through Didit, and the backend stores the resulting status. Profiles, payment-method details, order chat, and evidence references are handled by the app’s API and storage integrations. Do not include secrets or identity documents in chat or audit metadata.",
  },
];

export default function PlatformSecurityPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-4 border-b border-white/10 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#55D6BE]">Trust boundaries</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Security notes</h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-400">A practical summary of the current implementation. The project is under active development; read the code and deployment configuration before relying on any security property.</p>
      </header>
      <div className="space-y-4">
        {notes.map(({ icon: Icon, title, body }) => (
          <section key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 md:p-8">
            <div className="flex items-start gap-4">
              <Icon className="mt-1 h-5 w-5 shrink-0 text-[#55D6BE]" />
              <div>
                <h2 className="font-semibold text-white">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{body}</p>
              </div>
            </div>
          </section>
        ))}
      </div>
      <p className="text-xs leading-6 text-slate-500">LocalSettle does not provide a refund operation today. If an order has already been funded, do not assume it can be cancelled through the app. Network activity is public and transactions may be irreversible.</p>
    </div>
  );
}
