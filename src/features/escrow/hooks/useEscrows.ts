import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useWalletContext } from "@/features/wallet/presentation/context/WalletContext";

export interface OpenEscrowParams {
    orderId: string;
    sellerAddress: string;
    buyerAddress: string;
    amount: number;
    title: string;
    assetCode?: string;
}

export interface FundEscrowParams {
    escrowId: string;
    signerAddress: string;
    amount: number;
}

export interface SyncEscrowParams {
    escrowId: string;
    action: "initialize" | "fund" | "fiat_sent" | "release";
    signedXdr: string;
}

export interface FiatSentParams {
    buyerAddress: string;
    evidence?: string;
}

export interface ReleaseEscrowParams {
    escrowId: string;
    releaseSigner: string;
}

export interface EscrowSigningResponse {
    unsignedFundTransaction?: string;
    unsignedTransaction?: string;
}

export function useEscrows() {
    const queryClient = useQueryClient();
    const { assertCorrectNetwork } = useWalletContext();

    const { mutateAsync: openEscrow } = useMutation({
        mutationFn: async (params: OpenEscrowParams) => {
            await assertCorrectNetwork();
            return apiFetch<EscrowSigningResponse>('/escrows/open', {
                method: "POST",
                body: params,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        }
    });

    const { mutateAsync: fundEscrow } = useMutation({
        mutationFn: async (params: FundEscrowParams) => {
            await assertCorrectNetwork();
            return apiFetch<EscrowSigningResponse>('/escrows/fund', {
                method: "POST",
                body: params,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        }
    });

    const { mutateAsync: syncEscrow } = useMutation({
        mutationFn: async (params: SyncEscrowParams) => {
            await assertCorrectNetwork();
            return apiFetch<void>('/escrows/sync', {
                method: "POST",
                body: params,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        }
    });

    const { mutateAsync: markFiatSent } = useMutation({
        mutationFn: async ({ escrowId, params }: { escrowId: string, params: FiatSentParams }) => {
            await assertCorrectNetwork();
            return apiFetch<EscrowSigningResponse>(`/escrows/${escrowId}/fiat-sent`, {
                method: "POST",
                body: params,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        }
    });

    const { mutateAsync: releaseEscrow } = useMutation({
        mutationFn: async (params: ReleaseEscrowParams) => {
            await assertCorrectNetwork();
            return apiFetch<EscrowSigningResponse>('/escrows/release', {
                method: "POST",
                body: params,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        }
    });

    const { mutateAsync: uploadEvidenceMutation } = useMutation({
        mutationFn: async ({ escrowId, file }: { escrowId: string, file: File }) => {
            await assertCorrectNetwork();
            const formData = new FormData();
            formData.append("file", file);
            return apiFetch<{ url: string }>(`/escrows/${escrowId}/evidence`, {
                method: "POST",
                body: formData,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        }
    });

    const wrappedMarkFiatSent = (escrowId: string, params: FiatSentParams) => markFiatSent({ escrowId, params });
    const wrappedUploadEvidence = (escrowId: string, file: File) => uploadEvidenceMutation({ escrowId, file });

    return { 
        openEscrow, 
        fundEscrow, 
        syncEscrow, 
        markFiatSent: wrappedMarkFiatSent, 
        releaseEscrow, 
        uploadEvidence: wrappedUploadEvidence 
    };
}
