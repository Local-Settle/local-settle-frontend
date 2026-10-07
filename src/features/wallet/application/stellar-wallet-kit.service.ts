import { StellarWalletsKit, Networks, type ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { RabetModule } from "@creit.tech/stellar-wallets-kit/modules/rabet";
import { HanaModule } from "@creit.tech/stellar-wallets-kit/modules/hana";

// This is the only file in the app allowed to import the kit directly.
// Every wallet connection, address lookup, and transaction signature goes
// through here, on Testnet only — the app must never open the kit's own
// modal (StellarWalletsKit.authModal / createButton), only LocalSettle's.

import type {
    StellarNetwork,
    DetectedStellarNetwork,
} from "../types/wallet-network.types";

export function getExpectedStellarNetwork(): StellarNetwork {
    const raw = (process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet").toLowerCase();
    return raw === "mainnet" || raw === "public" ? "mainnet" : "testnet";
}

export function getExpectedNetworkPassphrase(): Networks {
    return getExpectedStellarNetwork() === "mainnet"
        ? Networks.PUBLIC
        : Networks.TESTNET;
}

let initialized = false;

function ensureInitialized(selectedWalletId?: string) {
    if (initialized) {
        if (selectedWalletId) StellarWalletsKit.setWallet(selectedWalletId);
        return;
    }

    const network = getExpectedNetworkPassphrase();
    StellarWalletsKit.init({
        network,
        selectedWalletId,
        modules: [
            new FreighterModule(),
            new LobstrModule(),
            new AlbedoModule(),
            new xBullModule(),
            new RabetModule(),
            new HanaModule(),
        ],
    });
    initialized = true;
}

async function detectNetwork(): Promise<DetectedStellarNetwork> {
    ensureInitialized();
    try {
        const net = await StellarWalletsKit.getNetwork();
        if (!net?.networkPassphrase) return "unknown";
        const phrase = net.networkPassphrase;
        if (phrase === Networks.TESTNET || phrase.toLowerCase().includes("test")) {
            return "testnet";
        }
        if (phrase === Networks.PUBLIC || phrase.toLowerCase().includes("public")) {
            return "mainnet";
        }
        return "unknown";
    } catch {
        return "unknown";
    }
}

async function assertExpectedNetwork(): Promise<void> {
    const expected = getExpectedStellarNetwork();
    const current = await detectNetwork();
    if (current === "unknown") {
        throw new Error("Unable to verify the wallet network. Reconnect your wallet and try again.");
    }
    if (current !== expected) {
        const expCap = expected === "testnet" ? "Testnet" : "Mainnet";
        const curCap = current === "testnet" ? "Testnet" : "Mainnet";
        throw new Error(
            `Wrong Stellar network detected. LocalSettle is configured for ${expCap}, but your wallet is connected to ${curCap}. Switch your wallet to ${expCap} before continuing.`
        );
    }
}

// We never call the kit's own authModal()/createButton() (those populate the
// kit's internal address cache for us). Since LocalSettle's modal drives selection
// directly, every read here must go through fetchAddress() — which actually
// asks the active module for the address (triggering Freighter's permission
// popup, etc.) — rather than getAddress(), which only returns whatever is
// already cached in the kit's memory and would otherwise come back empty.
async function getAddress(): Promise<string> {
    const { address } = await StellarWalletsKit.fetchAddress();
    if (!address) throw new Error("No public key found after connection.");
    return address;
}

export const stellarWalletKitService = {
    init(selectedWalletId?: string) {
        ensureInitialized(selectedWalletId);
    },

    setWallet(walletId: string) {
        ensureInitialized(walletId);
        StellarWalletsKit.setWallet(walletId);
    },

    getAddress,

    detectNetwork,

    assertExpectedNetwork,

    async connect(walletId: string): Promise<string> {
        ensureInitialized(walletId);
        StellarWalletsKit.setWallet(walletId);
        const address = await getAddress();
        await assertExpectedNetwork();
        return address;
    },

    async signTransaction(xdr: string, address?: string): Promise<string> {
        await assertExpectedNetwork();
        const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
            networkPassphrase: getExpectedNetworkPassphrase(),
            address,
        });
        return signedTxXdr;
    },

    // Used for the backend's login challenge: sign an arbitrary string
    // (not a transaction) to prove ownership of the address, per SEP-43.
    async signMessage(message: string, address?: string): Promise<string> {
        await assertExpectedNetwork();
        const { signedMessage } = await StellarWalletsKit.signMessage(message, {
            networkPassphrase: getExpectedNetworkPassphrase(),
            address,
        });
        return signedMessage.trim();
    },

    async refreshSupportedWallets(): Promise<ISupportedWallet[]> {
        ensureInitialized();
        try {
            return await StellarWalletsKit.refreshSupportedWallets();
        } catch {
            return [];
        }
    },

    async disconnect(): Promise<void> {
        if (!initialized) return;
        try {
            await StellarWalletsKit.disconnect();
        } catch {
            // Not every module implements disconnect (e.g. plain browser
            // extensions) — nothing to clean up on the kit's side then.
        }
    },
};
