"use client";

import { useEffect, useState } from "react";
import { stellarWalletKitService } from "../../application/stellar-wallet-kit.service";

// Drives the AVAILABLE / NOT_INSTALLED distinction for each wallet card:
// asks the kit which of the configured modules can actually be used in this
// browser right now (e.g. is the extension installed).
export function useWalletAvailability() {
    const [availability, setAvailability] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        // This hook is also rendered during SSR. Keep all browser access inside
        // the effect and report an actionable state if no browser is available.
        if (typeof window === "undefined") {
            setError("Wallet connections are only available in a supported browser.");
            setIsLoading(false);
            return () => { cancelled = true; };
        }

        stellarWalletKitService.refreshSupportedWallets()
            .then((wallets) => {
                if (cancelled) return;
                const map: Record<string, boolean> = {};
                for (const wallet of wallets) map[wallet.id] = wallet.isAvailable;
                setAvailability(map);
            })
            .catch(() => {
                if (!cancelled) setError("Wallet providers could not be checked. Refresh the page or install a supported wallet.");
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => { cancelled = true; };
    }, []);

    return { availability, isLoading, error };
}
