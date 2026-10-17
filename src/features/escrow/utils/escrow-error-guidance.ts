export function escrowErrorGuidance(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error ?? "");
    if (/wrong network|unsupported network|network mismatch|chain.?id/i.test(message)) {
        return "Your wallet is on the wrong network. Switch to the network shown for this escrow, refresh its status, then try again.";
    }
    if (/sequence|stale|bad_seq|nonce/i.test(message)) {
        return "The transaction is out of date. Refresh the escrow status before requesting a new signature.";
    }
    if (/provider|rpc|unavailable|timeout|failed to fetch|network error/i.test(message)) {
        return "The wallet or network service is temporarily unavailable. Check the escrow status before retrying; do not send a second payment.";
    }
    return "The escrow action did not complete. Refresh the escrow status before trying again, and check transaction history before signing another payment.";
}
