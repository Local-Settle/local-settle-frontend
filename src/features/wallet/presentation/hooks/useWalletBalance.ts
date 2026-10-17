"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { ApiError } from "@/lib/api";
import { walletApiErrorMessage } from "@/features/wallet/utils/wallet-api-errors";

export interface AssetBalance {
  asset_type: string;
  asset_code: string | null;
  asset_issuer: string | null;
  balance: string;
  limit?: string | null;
}

export interface BalanceState {
  balance: string | null; // Native XLM balance
  balances: AssetBalance[]; // All balances
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useWalletBalance(publicKey: string | null): BalanceState {
  const { apiFetch } = useApi();

  const { data, isLoading, error, refetch } = useQuery<AssetBalance[], Error>({
    queryKey: queryKeys.wallet.balance(publicKey),
    queryFn: () => apiFetch(`/stellar/balances/${publicKey}`),
    enabled: !!publicKey,
  });

  const xlm = data?.find((b) => b.asset_type === "native");
  const balance = xlm ? parseFloat(xlm.balance).toFixed(7) : "0.00";

  return {
    balance: data ? balance : null,
    balances: data || [],
    isLoading,
    error: error ? walletApiErrorMessage(error instanceof ApiError ? error.code : undefined, error.message) : null,
    refetch,
  };
}
