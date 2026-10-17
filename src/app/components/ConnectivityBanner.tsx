"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

type ConnectivityState = "online" | "offline" | "api-unavailable" | "wallet-unavailable";

export function ConnectivityBanner() {
    const [state, setState] = useState<ConnectivityState>(
        typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online",
    );
    const queryClient = useQueryClient();

    useEffect(() => {
        const handleOffline = () => setState("offline");
        const handleOnline = () => {
            setState("online");
            void queryClient.invalidateQueries();
        };
        const handleServiceState = (event: Event) => {
            const detail = (event as CustomEvent<ConnectivityState>).detail;
            if (detail) setState(detail);
        };
        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);
        window.addEventListener("localsettle:connectivity", handleServiceState);
        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("localsettle:connectivity", handleServiceState);
        };
    }, [queryClient]);

    if (state === "online") return null;
    const message = state === "offline"
        ? "You are offline. Read-only cached information remains available; changes will be blocked until you reconnect."
        : state === "api-unavailable"
          ? "LocalSettle services are unavailable. Your saved view remains available; try again shortly."
          : "Your wallet provider is unavailable. Check the wallet extension and reconnect before signing.";

    return (
        <div role="status" aria-live="polite" className="sticky top-0 z-[100] border-b border-amber-500/40 bg-amber-950 px-4 py-2 text-center text-sm text-amber-100">
            {message}
        </div>
    );
}
