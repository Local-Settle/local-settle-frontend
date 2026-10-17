"use client";

import { useCallback, useRef, useState } from "react";
import { useApi } from "@/lib/api";
import { useWallet } from "@/features/wallet";

export type SendStep =
  | "form"
  | "loading"
  | "confirm"
  | "signing"
  | "submitting"
  | "success"
  | "error"
  | "cancelled";

export interface RecipientInfo {
  address: string;
  alias: string | null;
  exists: boolean;
  hasUsdcTrustline: boolean;
}

export interface SendState {
  step: SendStep;
  recipient: RecipientInfo | null;
  fee: string | null;
  txHash: string | null;
  errorMessage: string | null;
}

export function useSend() {
  const { apiFetch } = useApi();
  const { signTransaction } = useWallet();
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "TESTNET";
  const preparedXdrRef = useRef<string | null>(null);

  const [state, setState] = useState<SendState>({
    step: "form",
    recipient: null,
    fee: null,
    txHash: null,
    errorMessage: null,
  });

  const resolveAndPrepare = useCallback(
    async (query: string, amount: string, assetCode?: string) => {
      setState(s => ({ ...s, step: "loading", errorMessage: null }));
      preparedXdrRef.current = null;

      try {
        const recipient = await apiFetch<RecipientInfo>(
          `/send/resolve?recipient=${encodeURIComponent(query)}`,
          { defaultError: "Could not resolve recipient" },
        );

        const prepareBody: { recipient: string; amount: string; asset?: string } = {
          recipient: recipient.address,
          amount,
        };
        if (assetCode && assetCode !== "native") {
          prepareBody.asset = assetCode;
        }

        const prepared = await apiFetch<Record<string, string>>("/send/prepare", {
          method: "POST",
          body: prepareBody,
          defaultError: "Failed to prepare transaction",
        });

        const xdr = prepared.xdr ?? prepared.unsignedXdr ?? prepared.txXdr ?? prepared.transaction ?? prepared.envelope ?? null;
        if (!xdr) {
          console.error("[useSend] prepare response missing XDR field:", prepared);
          throw new Error("Server response did not include a transaction to sign.");
        }

        preparedXdrRef.current = xdr;
        setState(s => ({ ...s, step: "confirm", recipient, fee: prepared.fee ?? null }));
      } catch (err) {
        setState(s => ({
          ...s,
          step: "error",
          errorMessage: err instanceof Error ? err.message : "An unexpected error occurred",
        }));
      }
    },
    [apiFetch]
  );

  const confirmSend = useCallback(async () => {
    const xdr = preparedXdrRef.current;
    if (!xdr) {
      setState(s => ({ ...s, step: "error", errorMessage: "Transaction data missing — please go back and try again." }));
      return;
    }

    setState(s => ({ ...s, step: "signing", errorMessage: null }));

    let signedXdr: string;
    try {
      signedXdr = await signTransaction(xdr, network);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message :
        typeof err === "string" ? err :
        "Signing failed";
      const isCancelled = /cancel|decline|reject|denied|user rejected/i.test(msg);
      setState(s => ({
        ...s,
        step: isCancelled ? "cancelled" : "error",
        errorMessage: isCancelled ? null : msg,
      }));
      return;
    }

    setState(s => ({ ...s, step: "submitting" }));
    try {
      const result = await apiFetch<{ hash?: string }>("/send/submit", {
        method: "POST",
        body: { signedXdr },
        defaultError: "Transaction submission failed",
      });
      setState(s => ({ ...s, step: "success", txHash: result.hash ?? null }));
    } catch (err) {
      setState(s => ({
        ...s,
        step: "error",
        errorMessage: err instanceof Error ? err.message : "Transaction submission failed",
      }));
    }
  }, [apiFetch, signTransaction, network]);

  const reset = useCallback(() => {
    preparedXdrRef.current = null;
    setState({ step: "form", recipient: null, fee: null, txHash: null, errorMessage: null });
  }, []);

  const backToConfirm = useCallback(() => {
    setState(s => ({ ...s, step: "confirm", errorMessage: null }));
  }, []);

  return { state, resolveAndPrepare, confirmSend, reset, backToConfirm };
}
