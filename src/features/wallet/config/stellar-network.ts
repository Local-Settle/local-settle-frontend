import { Networks } from "@creit.tech/stellar-wallets-kit";
import type { StellarNetwork } from "../types/wallet-network.types";

export interface StellarNetworkConfig {
    network: StellarNetwork;
    passphrase: Networks;
}

export function getStellarNetworkConfig(
    value: string | undefined = process.env.NEXT_PUBLIC_STELLAR_NETWORK,
): StellarNetworkConfig {
    const normalized = value?.trim().toLowerCase() || "testnet";
    if (normalized === "testnet") {
        return { network: "testnet", passphrase: Networks.TESTNET };
    }
    if (normalized === "mainnet" || normalized === "public") {
        return { network: "mainnet", passphrase: Networks.PUBLIC };
    }
    throw new Error(`Unsupported Stellar network: ${value}`);
}
