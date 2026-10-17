import type { AssetBalance } from "@/features/wallet";
import type {
    WalletAssetViewModel,
    WalletBalanceViewModel,
} from "../types/wallet-balance.types";
import { formatAssetAmount, formatFiatNumber } from "@/lib/formatCurrency";

export const DISPLAY_CURRENCY = "USD";

const ASSET_METADATA: Record<string, { name: string; icon?: string }> = {
    XLM: { name: "Stellar Lumens", icon: "/xlm.png" },
    USDC: { name: "USD Coin", icon: "/usdc.png" },
};

export const BASELINE_ASSET_CODES = ["XLM", "USDC"];

export const DEFAULT_USD_RATES: Record<string, number> = {
    USD: 1,
    USDC: 1,
    USDT: 1,
};

export interface MapWalletBalanceOptions {
    currency?: string;
    rates?: Record<string, number>;
    includeBaselineAssets?: boolean;
}

function buildAsset(
    code: string,
    rawBalance: number,
    issuer: string | null,
    rates: Record<string, number>,
    displayBalance: string | number = rawBalance,
): WalletAssetViewModel {
    const metadata = ASSET_METADATA[code];
    return {
        code,
        name: metadata?.name ?? code,
        icon: metadata?.icon,
        balance: formatAssetAmount(displayBalance),
        rawBalance,
        issuer,
        isPriced: typeof rates[code] === "number",
    };
}

function resolveCode(asset: AssetBalance): string {
    if (asset.asset_type === "native") return "XLM";
    return asset.asset_code || "UNKNOWN";
}

export function mapWalletBalance(
    balances: AssetBalance[] | undefined | null,
    options: MapWalletBalanceOptions = {},
): WalletBalanceViewModel {
    const currency = options.currency ?? DISPLAY_CURRENCY;
    const rates = options.rates ?? DEFAULT_USD_RATES;

    const assets: WalletAssetViewModel[] = (balances ?? []).map((asset) => {
        const parsed = Number.parseFloat(asset.balance);
        return buildAsset(
            resolveCode(asset),
            Number.isFinite(parsed) ? parsed : 0,
            asset.asset_issuer ?? null,
            rates,
            Number.isFinite(parsed) ? asset.balance : "0",
        );
    });

    if (options.includeBaselineAssets !== false && assets.length > 0) {
        const held = new Set(assets.map((asset) => asset.code));
        const missing = BASELINE_ASSET_CODES.filter((code) => !held.has(code));
        assets.push(...missing.map((code) => buildAsset(code, 0, null, rates)));

        const order = (code: string) => {
            const index = BASELINE_ASSET_CODES.indexOf(code);
            return index === -1 ? BASELINE_ASSET_CODES.length : index;
        };
        assets.sort((a, b) => order(a.code) - order(b.code));
    }

    const total = assets.reduce((sum, asset) => {
        const rate = rates[asset.code];
        return typeof rate === "number" ? sum + asset.rawBalance * rate : sum;
    }, 0);

    return {
        totalBalance: formatFiatNumber(total, currency),
        currency,
        assets,
        unpricedAssetCount: assets.filter(
            (asset) => !asset.isPriced && asset.rawBalance > 0,
        ).length,
    };
}
