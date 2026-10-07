import { ArrowLeftRight, MessageCircle, ShieldCheck, Wallet } from "lucide-react";

const features = [
  {
    icon: ArrowLeftRight,
    title: "Offers and orders",
    body: "Users browse buy and sell offers, create orders with fiat and asset amounts, and review their active and completed trades.",
  },
  {
    icon: ShieldCheck,
    title: "Escrow coordination",
    body: "The API asks Trustless Work to deploy a multi-release escrow on Stellar, records the contract reference, and returns an unsigned funding transaction for the seller’s wallet. Stellar events are polled to synchronize escrow and order status.",
  },
  {
    icon: MessageCircle,
    title: "Order chat and evidence",
    body: "Buyers and sellers can communicate in an order-scoped chat. The app also supports uploading payment evidence during the fiat settlement step.",
  },
  {
    icon: Wallet,
    title: "Wallet transfers",
    body: "Users can resolve a LocalSettle alias or Stellar address, review a prepared USDC transfer and fee, sign the transaction in their wallet, and submit it to Stellar.",
  },
];

export default function PlatformFeaturesPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-4 border-b border-white/10 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#55D6BE]">Product flows</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">How LocalSettle works</h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-400">The frontend is a wallet-connected client. The backend coordinates marketplace data, order state, integrations, and transaction preparation.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {features.map(({ icon: Icon, title, body }) => (
          <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 md:p-8">
            <Icon className="h-5 w-5 text-[#55D6BE]" />
            <h2 className="mt-5 text-lg font-semibold text-white">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">{body}</p>
          </article>
        ))}
      </div>
      <p className="text-xs leading-6 text-slate-500">Escrow operations currently accept USDC. Fiat payments happen between users outside the Stellar ledger. Always review the amount, asset, recipient, and network in your wallet before signing.</p>
    </div>
  );
}
