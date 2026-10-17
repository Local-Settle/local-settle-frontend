"use client";

import { useCallback, useRef, useState } from "react";
import { useUser } from "@/features/user/presentation/context/UserContext";
import { useWallet } from "@/features/wallet";
import { apiFailureMessage, messages, safeUserMessage } from "@/lib/messages";

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
  const { accessToken } = useUser();
  const { signTransaction } = useWallet();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
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
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

        const resolveRes = await fetch(
          `${apiUrl}/send/resolve?recipient=${encodeURIComponent(query)}`,
          { headers }
        );
        if (!resolveRes.ok) {
          throw new Error(apiFailureMessage(resolveRes.status, messages.wallet.resolveFailed));
        }
        const recipient: RecipientInfo = await resolveRes.json();

        const prepareBody: { recipient: string; amount: string; asset?: string } = {
          recipient: recipient.address,
          amount,
        };
        if (assetCode && assetCode !== "native") {
          prepareBody.asset = assetCode;
        }

        const prepareRes = await fetch(`${apiUrl}/send/prepare`, {
          method: "POST",
          headers,
          body: JSON.stringify(prepareBody),
        });
        if (!prepareRes.ok) {
          throw new Error(apiFailureMessage(prepareRes.status, messages.wallet.prepareFailed));
        }
        const prepared = await prepareRes.json() as Record<string, string>;

        const xdr = prepared.xdr ?? prepared.unsignedXdr ?? prepared.txXdr ?? prepared.transaction ?? prepared.envelope ?? null;
        if (!xdr) {
          console.error("[useSend] prepare response missing XDR field:", prepared);
          throw new Error(messages.wallet.transactionMissing);
        }

        preparedXdrRef.current = xdr;
        setState(s => ({ ...s, step: "confirm", recipient, fee: prepared.fee ?? null }));
      } catch (err) {
        setState(s => ({
          ...s,
          step: "error",
          errorMessage: safeUserMessage(err, messages.wallet.resolveFailed),
        }));
      }
    },
    [accessToken, apiUrl]
  );

  const confirmSend = useCallback(async () => {
    const xdr = preparedXdrRef.current;
    if (!xdr) {
      setState(s => ({ ...s, step: "error", errorMessage: messages.wallet.transactionMissing }));
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
        errorMessage: isCancelled ? null : messages.wallet.signingFailed,
      }));
      return;
    }

    setState(s => ({ ...s, step: "submitting" }));
    try {
      const submitHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) submitHeaders["Authorization"] = `Bearer ${accessToken}`;
      const submitRes = await fetch(`${apiUrl}/send/submit`, {
        method: "POST",
        headers: submitHeaders,
        body: JSON.stringify({ signedXdr }),
      });
      if (!submitRes.ok) {
        throw new Error(apiFailureMessage(submitRes.status, messages.wallet.submitFailed));
      }
      const result: { hash?: string } = await submitRes.json();
      setState(s => ({ ...s, step: "success", txHash: result.hash ?? null }));
    } catch (err) {
      setState(s => ({
        ...s,
        step: "error",
        errorMessage: safeUserMessage(err, messages.wallet.submitFailed),
      }));
    }
  }, [accessToken, apiUrl, signTransaction, network]);

  const reset = useCallback(() => {
    preparedXdrRef.current = null;
    setState({ step: "form", recipient: null, fee: null, txHash: null, errorMessage: null });
  }, []);

  const backToConfirm = useCallback(() => {
    setState(s => ({ ...s, step: "confirm", errorMessage: null }));
  }, []);

  return { state, resolveAndPrepare, confirmSend, reset, backToConfirm };
}
