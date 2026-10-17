"use client";

import { useMemo } from "react";
import { useWalletBalance } from "@/features/wallet";
import { mapWalletBalance } from "../utils/mapWalletBalance";
import type { WalletBalanceViewModel } from "../types/wallet-balance.types";

export interface WalletBalanceViewState {
    viewModel: WalletBalanceViewModel;
    isLoading: boolean;
    error: string | null;
    isStale: boolean;
    hasData: boolean;
    isEmpty: boolean;
    retry: () => void;
}

export function useWalletBalanceViewModel(
    publicKey: string | null,
): WalletBalanceViewState {
    const { balances, isLoading, error, hasData, refetch } = useWalletBalance(publicKey);

    const viewModel = useMemo(() => mapWalletBalance(balances), [balances]);

    return {
        viewModel,
        isLoading,
        error,
        hasData,
        isStale: Boolean(error && hasData),
        isEmpty: hasData && !isLoading && !error && viewModel.assets.length === 0,
        retry: refetch,
    };
}
