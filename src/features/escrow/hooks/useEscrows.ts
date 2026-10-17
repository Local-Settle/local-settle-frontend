import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch, getApiBaseUrl } from "@/lib/api";
import { getCsrfToken } from "@/lib/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { useUser } from "@/features/user/presentation/context/UserContext";

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
    const { accessToken, logout } = useUser();

    const { mutateAsync: openEscrow } = useMutation({
        mutationFn: (params: OpenEscrowParams) => apiFetch<EscrowSigningResponse>('/escrows/open', {
            method: "POST",
            body: params,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        }
    });

    const { mutateAsync: fundEscrow } = useMutation({
        mutationFn: (params: FundEscrowParams) => apiFetch<EscrowSigningResponse>('/escrows/fund', {
            method: "POST",
            body: params,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        }
    });

    const { mutateAsync: syncEscrow } = useMutation({
        mutationFn: (params: SyncEscrowParams) => apiFetch<void>('/escrows/sync', {
            method: "POST",
            body: params,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        }
    });

    const { mutateAsync: markFiatSent } = useMutation({
        mutationFn: ({ escrowId, params }: { escrowId: string, params: FiatSentParams }) => apiFetch<EscrowSigningResponse>(`/escrows/${escrowId}/fiat-sent`, {
            method: "POST",
            body: params,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        }
    });

    const { mutateAsync: releaseEscrow } = useMutation({
        mutationFn: (params: ReleaseEscrowParams) => apiFetch<EscrowSigningResponse>('/escrows/release', {
            method: "POST",
            body: params,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        }
    });

    const { mutateAsync: uploadEvidenceMutation } = useMutation({
        mutationFn: async ({ escrowId, file, signal, onProgress, idempotencyKey }: {
            escrowId: string;
            file: File;
            signal?: AbortSignal;
            onProgress?: (loaded: number, total: number) => void;
            idempotencyKey: string;
        }) => {
            const formData = new FormData();
            formData.append("file", file);
            const csrfToken = await getCsrfToken();

            return new Promise<{ url: string }>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", `${getApiBaseUrl()}/escrows/${escrowId}/evidence`);
                xhr.withCredentials = true;
                if (accessToken) xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
                if (csrfToken) xhr.setRequestHeader("x-csrf-token", csrfToken);
                xhr.setRequestHeader("Idempotency-Key", idempotencyKey);
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) onProgress?.(event.loaded, event.total);
                };
                xhr.onload = () => {
                    if (xhr.status === 401) {
                        logout();
                        reject(new ApiError("Session expired. Please sign in again.", 401));
                        return;
                    }
                    let body: { url?: string; message?: string } = {};
                    try { body = JSON.parse(xhr.responseText) as typeof body; } catch { /* invalid response */ }
                    if (xhr.status < 200 || xhr.status >= 300) {
                        reject(new ApiError(body.message || "Evidence upload failed", xhr.status));
                        return;
                    }
                    if (!body.url) {
                        reject(new Error("Upload completed without an evidence URL."));
                        return;
                    }
                    resolve({ url: body.url });
                };
                xhr.onerror = () => reject(new Error("Network error while uploading evidence."));
                xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
                if (signal?.aborted) {
                    xhr.abort();
                    return;
                }
                signal?.addEventListener("abort", () => xhr.abort(), { once: true });
                xhr.send(formData);
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        }
    });

    const wrappedMarkFiatSent = (escrowId: string, params: FiatSentParams) => markFiatSent({ escrowId, params });
    const wrappedUploadEvidence = (
        escrowId: string,
        file: File,
        options: { signal?: AbortSignal; onProgress?: (loaded: number, total: number) => void; idempotencyKey: string },
    ) => uploadEvidenceMutation({ escrowId, file, ...options });

    return { 
        openEscrow, 
        fundEscrow, 
        syncEscrow, 
        markFiatSent: wrappedMarkFiatSent, 
        releaseEscrow, 
        uploadEvidence: wrappedUploadEvidence 
    };
}
