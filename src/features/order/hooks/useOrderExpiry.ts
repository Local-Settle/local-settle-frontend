import { useEffect, useRef, useState } from "react";

function parseExpiry(expiresAt?: string | null): number | null {
    if (!expiresAt?.trim()) return null;
    const timestamp = Date.parse(expiresAt);
    return Number.isFinite(timestamp) ? timestamp : null;
}

function formatRemaining(milliseconds: number): string {
    const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
    const days = Math.floor(totalSeconds / 86_400);
    const hours = Math.floor((totalSeconds % 86_400) / 3_600);
    const minutes = Math.floor((totalSeconds % 3_600) / 60);
    const seconds = totalSeconds % 60;
    const clock = [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
    return days > 0 ? `${days}d ${clock}` : clock;
}

/** Uses the server-provided expiry timestamp for display; the server remains authoritative. */
export function useOrderExpiry(expiresAt?: string | null, onExpired?: () => void) {
    const expiry = parseExpiry(expiresAt);
    const [now, setNow] = useState(() => Date.now());
    const notifiedExpiry = useRef<number | null>(null);

    useEffect(() => {
        if (expiry === null) {
            setNow(Date.now());
            notifiedExpiry.current = null;
            return;
        }

        const refresh = () => setNow(Date.now());
        refresh();
        const interval = window.setInterval(refresh, 1000);
        document.addEventListener("visibilitychange", refresh);
        window.addEventListener("focus", refresh);
        return () => {
            window.clearInterval(interval);
            document.removeEventListener("visibilitychange", refresh);
            window.removeEventListener("focus", refresh);
        };
    }, [expiry]);

    const isExpired = expiry !== null && now >= expiry;
    useEffect(() => {
        if (isExpired && expiry !== null && notifiedExpiry.current !== expiry) {
            notifiedExpiry.current = expiry;
            onExpired?.();
        }
    }, [expiry, isExpired, onExpired]);

    return {
        isExpired,
        label: expiry === null ? "Expiry unavailable" : isExpired ? "Expired" : formatRemaining(expiry - now),
        hasExpiry: expiry !== null,
    };
}
