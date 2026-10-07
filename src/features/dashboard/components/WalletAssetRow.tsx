"use client";

import Image from "next/image";
import type { WalletAssetViewModel } from "../types/wallet-balance.types";

interface WalletAssetRowProps {
    asset: WalletAssetViewModel;
}

export function WalletAssetRow({ asset }: WalletAssetRowProps) {
    return (
        <li
            data-testid="wallet-asset-row"
            className="flex-1 min-h-16 flex items-center justify-between gap-3 px-3 md:px-4 py-3 rounded-2xl bg-[#141416] border border-[#1F1F22] hover:border-[#2A2A2E] transition-colors"
        >
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#1E1E22] border border-[#2A2A2E] flex items-center justify-center overflow-hidden shrink-0 text-white font-bold text-[10px]">
                    {asset.icon ? (
                        <Image
                            src={asset.icon}
                            alt={`${asset.code} logo`}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span aria-hidden="true">{asset.code.slice(0, 3)}</span>
                    )}
                </div>

                <div className="min-w-0">
                    <p className="text-white font-bold text-sm tracking-wide truncate">
                        {asset.code}
                    </p>
                    <p className="text-[#9BABB7] text-[12px] tracking-[0.15em] uppercase truncate">
                        {asset.name}
                    </p>
                </div>
            </div>

            <p className="text-white font-semibold text-sm tabular-nums text-right shrink-0 max-w-[45%] truncate">
                {asset.balance}
            </p>
        </li>
    );
}
