interface KitLikeError {
    code?: number;
    message?: string | { message?: string };
}

export function isWalletConnectionCancelled(err: unknown): boolean {
    if (typeof err !== "object" || err === null) return false;
    const kitErr = err as KitLikeError;
    if (kitErr.code === -4) return true;
    const message = typeof kitErr.message === "string"
        ? kitErr.message
        : kitErr.message?.message;
    return typeof message === "string" && /cancel|reject|declin/i.test(message);
}

// Maps kit/module errors (IKitError, extension-not-found, user-rejected, ...)
// to short user-facing copy. Never surfaces raw SDK stack traces.
export function mapWalletError(err: unknown): string {
    if (typeof err === "object" && err !== null) {
        const kitErr = err as KitLikeError;

        // Freighter/kit style rejection: { code: -4, message: "..." }
        if (kitErr.code === -4) return "Connection request was rejected.";

        const rawMessage = typeof kitErr.message === "string"
            ? kitErr.message
            : kitErr.message?.message;

        if (typeof rawMessage === "string" && rawMessage.trim()) {
            const lower = rawMessage.toLowerCase();
            if (lower.includes("cancel") || lower.includes("reject") || lower.includes("declined")) {
                return "Connection request was rejected.";
            }
            if (lower.includes("not installed") || lower.includes("not available") || lower.includes("not found")) {
                return "That wallet isn't installed or available in this browser.";
            }
            if (lower.includes("mainnet")) {
                return rawMessage;
            }
            return rawMessage;
        }
    }

    if (err instanceof Error && err.message) return err.message;

    return "Something went wrong while connecting your wallet. Please try again.";
}
