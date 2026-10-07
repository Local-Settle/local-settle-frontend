import { FREIGHTER_ID, FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { LOBSTR_ID, LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import { ALBEDO_ID, AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { XBULL_ID, xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { RABET_ID, RabetModule } from "@creit.tech/stellar-wallets-kit/modules/rabet";
import { HANA_ID, HanaModule } from "@creit.tech/stellar-wallets-kit/modules/hana";

export type WalletOption = {
    id: string;
    name: string;
    icon: string;
    description: string;
    url: string;
    enabled: boolean;
};

// Icons for the two wallets LocalSettle already branded locally; every other
// wallet falls back to the icon the kit's own module ships (productIcon),
// so we never have to guess or host artwork ourselves.
const localIcons: Record<string, string> = {
    [FREIGHTER_ID]: "/freighter-icon.png",
    [LOBSTR_ID]: "/lobstr-icon.png",
};

const descriptions: Record<string, string> = {
    [FREIGHTER_ID]: "Secure browser extension for Stellar",
    [LOBSTR_ID]: "Most popular mobile & web wallet",
    [ALBEDO_ID]: "Sign in with your browser, no install required",
    [XBULL_ID]: "Browser extension wallet for Stellar & Soroban",
    [RABET_ID]: "Browser extension wallet for Stellar",
    [HANA_ID]: "Browser extension wallet for Stellar & Soroban",
};

// Presentation metadata only. Connection and signing behavior always goes
// through Stellar Wallets Kit (see application/stellar-wallet-kit.service.ts) —
// this list controls what LocalSettle's own modal renders, nothing more.
function toOption(module: { productId: string; productName: string; productIcon: string; productUrl: string }): WalletOption {
    return {
        id: module.productId,
        name: module.productName,
        icon: localIcons[module.productId] ?? module.productIcon,
        description: descriptions[module.productId] ?? "",
        url: module.productUrl,
        enabled: true,
    };
}

export const walletOptions: WalletOption[] = [
    toOption(new FreighterModule()),
    toOption(new LobstrModule()),
    toOption(new AlbedoModule()),
    toOption(new xBullModule()),
    toOption(new RabetModule()),
    toOption(new HanaModule()),
];
