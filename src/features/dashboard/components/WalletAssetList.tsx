"use client";

import { WalletAssetRow } from "./WalletAssetRow";
import type { WalletAssetViewModel } from "../types/wallet-balance.types";

interface WalletAssetListProps {
    assets: WalletAssetViewModel[];
    isLoading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    onViewAll?: () => void;
}

const SKELETON_ROWS = 2;

export function WalletAssetList({
    assets,
    isLoading = false,
    error = null,
    onRetry,
    onViewAll,
}: WalletAssetListProps) {
    return (
        <section aria-label="Assets" className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-base tracking-wide">
                    Assets
                </h2>
                <button
                        type="button"
                        onClick={onViewAll}
                        className="text-[#55D6BE] text-xs font-semibold hover:underline"
                    >
                        View all
                    </button>
            </div>

            {isLoading ? (
                <ul
                    className="flex-1 flex flex-col gap-3 md:gap-4"
                    role="status"
                    aria-label="Loading assets"
                >
                    {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
                        <li
                            key={index}
                            data-testid="asset-skeleton"
                            className="flex-1 min-h-16 rounded-2xl bg-[#141416] border border-[#1F1F22] animate-pulse"
                        />
                    ))}
                </ul>
            ) : error ? (
                <div className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-[#141416] border border-[#2A1F1F]">
                    <p role="alert" className="text-red-400 text-sm">
                        {`Couldn't load your assets. ${error}`}
                    </p>
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="text-black bg-[#55D6BE] hover:bg-[#55D6BE] text-xs font-bold px-4 py-2 rounded-lg tracking-wide transition-colors"
                        >
                            Retry
                        </button>
                    )}
                </div>
            ) : assets.length === 0 ? (
                <p className="text-[#9BABB7] text-sm p-4 rounded-2xl bg-[#141416] border border-[#1F1F22]">
                    No assets are currently available.
                </p>
            ) : (
                <ul className="flex-1 flex flex-col gap-3 md:gap-4">
                    {assets.map((asset) => (
                        <WalletAssetRow
                            key={`${asset.code}-${asset.issuer ?? "native"}`}
                            asset={asset}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}
