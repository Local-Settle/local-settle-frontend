interface KitLikeError {
    code?: number;
    message?: string | { message?: string };
}

// Normalize common wallet-provider failures without exposing arbitrary SDK details.
export function mapWalletError(err: unknown): string {
    if (typeof err === "object" && err !== null && (err as KitLikeError).code === -4) {
        return "The wallet request was cancelled. You can retry or edit the transfer details.";
    }

    let message = "";
    if (typeof err === "object" && err !== null) {
        const value = (err as KitLikeError).message;
        message = typeof value === "string" ? value : value?.message ?? "";
    } else if (err instanceof Error || typeof err === "string") {
        message = typeof err === "string" ? err : err.message;
    }

    const lower = message.toLowerCase();
    if (["cancel", "reject", "declined"].some((term) => lower.includes(term))) {
        return "The wallet request was cancelled. You can retry or edit the transfer details.";
    }
    if (["wrong network", "network mismatch", "unsupported network"].some((term) => lower.includes(term))) {
        return "Your wallet is on a different Stellar network. Switch networks and try again.";
    }
    if (["insufficient balance", "insufficient funds", "not enough balance"].some((term) => lower.includes(term))) {
        return "Your wallet balance is too low to cover this transfer and its network fee.";
    }
    if (["approval", "allowance", "authorization required"].some((term) => lower.includes(term))) {
        return "Approve the requested wallet action, then retry the transfer.";
    }
    if (["not installed", "not available", "not found"].some((term) => lower.includes(term))) {
        return "That wallet isn't installed or available in this browser. Install or unlock it, then retry.";
    }
    if (["timeout", "timed out", "provider not responding"].some((term) => lower.includes(term))) {
        return "The wallet did not respond. Unlock or reconnect it, then retry.";
    }

    return "The wallet couldn't complete this request. Please retry or reconnect your wallet.";
}
