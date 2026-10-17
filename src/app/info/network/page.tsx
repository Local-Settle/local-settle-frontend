import { getConfiguredStellarNetwork, getConfiguredUsdcIssuer } from "@/features/wallet/config/stellar-network";
import CopyIssuer from "./copy-issuer";

export default function NetworkInfoPage() {
  const network = getConfiguredStellarNetwork();
  const issuer = getConfiguredUsdcIssuer();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#55D6BE]">Wallet information</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Network and USDC asset</h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-300">
          LocalSettle uses the network configured for wallet connections and transaction signing. Check that your wallet is on this network before sending or signing a transaction.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-6" aria-labelledby="network-heading">
        <h2 id="network-heading" className="font-semibold text-white">Configured Stellar network</h2>
        <p className="text-lg font-medium text-[#55D6BE]">{network === "testnet" ? "Stellar Testnet" : "Stellar Mainnet (Public Network)"}</p>
        {network === "testnet" && <p className="text-sm leading-6 text-slate-400">Testnet is for development and testing. Testnet tokens have no monetary value and are separate from assets on the public network.</p>}
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-6" aria-labelledby="asset-heading">
        <h2 id="asset-heading" className="font-semibold text-white">USDC asset issuer</h2>
        {issuer ? <CopyIssuer issuer={issuer} /> : <p className="text-sm text-slate-400">No USDC issuer is configured for this deployment.</p>}
        <p className="text-xs leading-5 text-slate-500">This is the public issuer address configured by the deployment. Displaying it does not imply endorsement or verification by LocalSettle.</p>
      </section>
    </div>
  );
}
