import {
    FREIGHTER_ID,
} from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { LOBSTR_ID } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import { ALBEDO_ID } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { XBULL_ID } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { RABET_ID } from "@creit.tech/stellar-wallets-kit/modules/rabet";
import { HANA_ID } from "@creit.tech/stellar-wallets-kit/modules/hana";

export type WalletCapabilities = {
    connect: true;
    address: true;
    networkDetection: true;
    transactionSigning: true;
    // The kit forwards message signing to each provider. Availability can
    // depend on the provider version, so callers must handle its rejection.
    messageSigning: "provider-dependent";
};

export const walletCapabilityMatrix: Record<string, WalletCapabilities> = {
    [FREIGHTER_ID]: { connect: true, address: true, networkDetection: true, transactionSigning: true, messageSigning: "provider-dependent" },
    [LOBSTR_ID]: { connect: true, address: true, networkDetection: true, transactionSigning: true, messageSigning: "provider-dependent" },
    [ALBEDO_ID]: { connect: true, address: true, networkDetection: true, transactionSigning: true, messageSigning: "provider-dependent" },
    [XBULL_ID]: { connect: true, address: true, networkDetection: true, transactionSigning: true, messageSigning: "provider-dependent" },
    [RABET_ID]: { connect: true, address: true, networkDetection: true, transactionSigning: true, messageSigning: "provider-dependent" },
    [HANA_ID]: { connect: true, address: true, networkDetection: true, transactionSigning: true, messageSigning: "provider-dependent" },
};

export function getWalletCapabilities(walletId: string): WalletCapabilities | null {
    return walletCapabilityMatrix[walletId] ?? null;
}
