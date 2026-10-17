export const messages = {
  wallet: {
    resolveFailed: "Could not resolve the recipient. Check the address or alias and try again.",
    prepareFailed: "Could not prepare this transaction. Review the details and try again.",
    transactionMissing: "Transaction data is missing. Go back and try again.",
    signingFailed: "Your wallet could not sign the transaction. Reconnect and try again.",
    submitFailed: "The transaction could not be submitted. Please try again.",
    unexpected: "Something went wrong. Please try again.",
    sessionExpired: "Your session expired. Reconnect and try again.",
    notFound: "The requested item could not be found.",
    rateLimited: "Too many requests. Wait a moment and try again.",
    serviceUnavailable: "The service is temporarily unavailable. Please try again.",
  },
  order: {
    loadFailed: "Orders could not be loaded. Please try again.",
    updateFailed: "The order could not be updated. Refresh and try again.",
  },
  payment: {
    loadFailed: "Payment details could not be loaded. Please try again.",
    updateFailed: "The payment could not be completed. Check its status before retrying.",
  },
} as const;

export type WalletMessageKey = keyof typeof messages.wallet;

/** Map HTTP failure classes to safe, actionable copy without exposing payloads. */
export function apiFailureMessage(status: number, fallback: string): string {
  if (status === 401 || status === 403) return messages.wallet.sessionExpired;
  if (status === 404) return messages.wallet.notFound;
  if (status === 429) return messages.wallet.rateLimited;
  if (status >= 500) return messages.wallet.serviceUnavailable;
  return fallback;
}

export function safeUserMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const allowed = new Set<string>([
    ...Object.values(messages.wallet),
    ...Object.values(messages.order),
    ...Object.values(messages.payment),
  ]);
  return allowed.has(error.message) ? error.message : fallback;
}
