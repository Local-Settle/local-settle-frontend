"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { parseAssetBalances } from "@/lib/api/contracts";
import type { AssetBalance } from "@/lib/api/generated/contracts";

export type { AssetBalance };

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
    queryFn: async () => parseAssetBalances(await apiFetch<unknown>(`/stellar/balances/${publicKey}`)),
    enabled: !!publicKey,
  });

  const xlm = data?.find((b) => b.asset_type === "native");
  const balance = xlm ? parseFloat(xlm.balance).toFixed(7) : "0.00";

  return {
    balance: data ? balance : null,
    balances: data || [],
    isLoading,
    error: error?.message || null,
    refetch,
  };
}
