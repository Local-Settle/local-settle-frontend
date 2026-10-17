import type { StellarNetwork } from "../types/wallet-network.types";

/** Network configured for wallet connections and transaction signing. */
export function getConfiguredStellarNetwork(): StellarNetwork {
  const raw = (process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet").toLowerCase();
  return raw === "mainnet" || raw === "public" ? "mainnet" : "testnet";
}

export function getConfiguredUsdcIssuer(): string | null {
  const issuer = process.env.NEXT_PUBLIC_USDC_ISSUER?.trim();
  return issuer || null;
}
