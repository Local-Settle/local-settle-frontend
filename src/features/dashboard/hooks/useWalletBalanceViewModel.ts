"use client";

import { useMemo } from "react";
import { useWalletBalance } from "@/features/wallet";
import { mapWalletBalance } from "../utils/mapWalletBalance";
import type { WalletBalanceViewModel } from "../types/wallet-balance.types";

export interface WalletBalanceViewState {
    viewModel: WalletBalanceViewModel;
    isLoading: boolean;
    isFetching: boolean;
    lastUpdatedAt: number | null;
    error: string | null;
    isEmpty: boolean;
    retry: () => void;
}

export function useWalletBalanceViewModel(
    publicKey: string | null,
): WalletBalanceViewState {
    const { balances, isLoading, isFetching, lastUpdatedAt, error, refetch } = useWalletBalance(publicKey);

    const viewModel = useMemo(() => mapWalletBalance(balances), [balances]);

    return {
        viewModel,
        isLoading,
        isFetching,
        lastUpdatedAt,
        error,
        isEmpty: !isLoading && !error && viewModel.assets.length === 0,
        retry: refetch,
    };
}
