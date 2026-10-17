import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "../../user/presentation/context/UserContext";
import {
    createEscrowSocket,
    type EscrowSocket,
} from "../services/escrow-realtime.service";
import type {
    EscrowStatus,
    EscrowStatusEvent,
    EscrowSyncState,
} from "../types/escrow-events.types";
import {
    deduplicationKey,
    isTerminalStatus,
    nextPollDelay,
} from "../utils/escrow-status.utils";

interface UseEscrowStatusSyncOptions {
    orderId: string;
    escrowId: string | null | undefined;
    /** Called whenever a *new* (deduplicated) status arrives. */
    onStatusChange: (event: EscrowStatusEvent) => void;
    enabled?: boolean;
}

/**
 * Synchronises the local escrow status with the backend in real time.
 *
 * Primary path: WebSocket (`escrow-status-updated` event).
 * Fallback: controlled polling against `GET /escrows/:escrowId/status`.
 *
 * Lifecycle guarantees:
 *  - Stops when the escrow reaches a terminal state (released / resolved).
 *  - Pauses polling when the browser tab is hidden; resumes + refreshes
 *    immediately on visibility change.
 *  - Deduplicates across both sources using a shared key.
 *  - Cancels in-flight requests on unmount and never sets state after unmount.
 *  - Prevents overlapping poll requests.
 *  - Preserves the last known status on transient failures.
 */
export function useEscrowStatusSync({
    orderId,
    escrowId,
    onStatusChange,
    enabled = true,
}: UseEscrowStatusSyncOptions) {
    const { accessToken, logout } = useUser();

    /* ── State ──────────────────────────────────────────────────── */
    const [syncState, setSyncState] = useState<EscrowSyncState>({
        status: "idle",
        lastUpdated: null,
        source: null,
    });
    const [currentStatus, setCurrentStatus] = useState<EscrowStatus | null>(
        null,
    );

    /* ── Refs (survive re-renders, never trigger effects) ────────── */
    const socketRef = useRef<EscrowSocket | null>(null);
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const seenKeysRef = useRef<Set<string>>(new Set());
    const isPollingRef = useRef(false);
    const refreshAfterReconnectRef = useRef(false);
    const mountedRef = useRef(true);
    const onStatusChangeRef = useRef(onStatusChange);
    const currentStatusRef = useRef<EscrowStatus | null>(null);

    /* Keep refs in sync with latest props / state. */
    useEffect(() => {
        onStatusChangeRef.current = onStatusChange;
    }, [onStatusChange]);

    useEffect(() => {
        currentStatusRef.current = currentStatus;
    }, [currentStatus]);

    /* ── Helpers ────────────────────────────────────────────────── */

    /** Process an incoming event through dedup before notifying. */
    const processEvent = useCallback((event: EscrowStatusEvent) => {
        if (!mountedRef.current) return;

        const key = deduplicationKey(event);
        if (seenKeysRef.current.has(key)) return;
        seenKeysRef.current.add(key);

        // Socket and polling can report the same transition with different
        // timestamps/IDs. Keep the view fresh, but only notify on a real
        // status transition.
        const statusChanged = currentStatusRef.current !== event.status;
        currentStatusRef.current = event.status;

        setCurrentStatus(event.status);
        setSyncState((prev) => ({
            ...prev,
            lastUpdated: event.updatedAt,
            status: "synchronized",
        }));
        if (statusChanged) onStatusChangeRef.current(event);

        // Stop syncing if terminal.
        if (isTerminalStatus(event.status)) {
            cleanupAll();
        }
    }, []);

    /* ── Polling ────────────────────────────────────────────────── */

    const pollStatus = useCallback(async () => {
        if (
            !mountedRef.current ||
            !escrowId ||
            isPollingRef.current ||
            (currentStatusRef.current !== null &&
                isTerminalStatus(currentStatusRef.current))
        ) {
            return;
        }

        isPollingRef.current = true;

        // Cancel any previous in-flight request.
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const headers: Record<string, string> = {
                "Content-type": "application/json",
            };
            if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/escrows/${escrowId}/status`,
                { headers, signal: controller.signal },
            );

            if (!mountedRef.current) return;

            if (res.status === 401) {
                logout();
                return;
            }

            if (!res.ok) {
                // Transient failure — preserve last known status, don't blank UI.
                setSyncState((prev) => ({
                    ...prev,
                    status: "error",
                }));
                return;
            }

            const data: EscrowStatusEvent = await res.json();
            processEvent(data);

            setSyncState((prev) => ({
                ...prev,
                source: prev.source ?? "polling",
                status: isTerminalStatus(data.status)
                    ? prev.status
                    : "polling",
            }));
        } catch (err: unknown) {
            if (!mountedRef.current) return;
            // AbortError means we intentionally cancelled — don't flag as error.
            if (err instanceof DOMException && err.name === "AbortError") return;
            setSyncState((prev) => ({
                ...prev,
                status: "error",
            }));
        } finally {
            isPollingRef.current = false;
            if (refreshAfterReconnectRef.current && mountedRef.current) {
                refreshAfterReconnectRef.current = false;
                void pollStatus();
            }
        }
    }, [escrowId, accessToken, logout, processEvent]);

    /** Schedule the next poll (steady-state interval). */
    const schedulePoll = useCallback(() => {
        if (!mountedRef.current) return;
        if (pollTimerRef.current !== null) {
            clearTimeout(pollTimerRef.current);
        }
        pollTimerRef.current = setTimeout(() => {
            pollTimerRef.current = null;
            pollStatus();
            schedulePoll();
        }, nextPollDelay());
    }, [pollStatus]);

    /* ── WebSocket ──────────────────────────────────────────────── */

    const connectSocket = useCallback(() => {
        if (!accessToken || !orderId || socketRef.current) return;

        let socket: EscrowSocket | null = null;
        try {
            socket = createEscrowSocket(accessToken);
        } catch {
            // API URL not configured — fall through to polling.
            return;
        }

        if (!socket) return;

        socketRef.current = socket;
        setSyncState((prev) => ({ ...prev, status: "syncing" }));

        socket.on("connect", () => {
            if (!mountedRef.current) return;
            socket.emit("subscribe-order", { orderId }, (response) => {
                if (response.ok) {
                    setSyncState((prev) => ({
                        ...prev,
                        source: "websocket",
                        status: "synchronized",
                    }));
                }
                // If subscribe fails, the polling fallback will pick up.
            });
            // A reconnect may have missed events while disconnected. Refresh
            // from the authoritative status endpoint after each subscription.
            if (isPollingRef.current) refreshAfterReconnectRef.current = true;
            else pollStatus();
        });

        socket.on("escrow-status-updated", (event) => {
            // Only process events that belong to the current order/escrow.
            if (event.orderId !== orderId) return;
            if (escrowId && event.escrowId !== escrowId) return;
            processEvent(event);
        });

        socket.on("escrow-error", () => {
            setSyncState((prev) => ({ ...prev, status: "error" }));
        });

        socket.on("disconnect", (reason) => {
            if (reason !== "io client disconnect") {
                setSyncState((prev) => ({
                    ...prev,
                    source: null,
                    status: "reconnecting",
                }));
            }
        });

        socket.on("connect_error", () => {
            setSyncState((prev) => ({
                ...prev,
                source: null,
                status: "reconnecting",
            }));
        });

        socket.connect();
    }, [accessToken, orderId, escrowId, processEvent, pollStatus]);

    /* ── Visibility handling ────────────────────────────────────── */

    useEffect(() => {
        if (!enabled || !escrowId) return;

        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                // Refresh immediately on return.
                pollStatus();
                schedulePoll();
            } else {
                // Pause polling while hidden.
                if (pollTimerRef.current !== null) {
                    clearTimeout(pollTimerRef.current);
                    pollTimerRef.current = null;
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);
        return () =>
            document.removeEventListener("visibilitychange", handleVisibility);
    }, [enabled, escrowId, pollStatus, schedulePoll]);

    /* ── Main lifecycle ─────────────────────────────────────────── */

    useEffect(() => {
        mountedRef.current = true;

        if (!enabled || !escrowId) return;

        // Initial fetch.
        pollStatus();

        // Start WebSocket; if it can't connect polling will handle it.
        connectSocket();

        // Begin polling fallback (will no-op if WS is connected and healthy).
        schedulePoll();

        return () => {
            mountedRef.current = false;
            cleanupAll();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId, escrowId, enabled]);

    /* ── Teardown ───────────────────────────────────────────────── */

    function cleanupAll() {
        mountedRef.current = false;

        // Polling timer.
        if (pollTimerRef.current !== null) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }

        // In-flight fetch.
        abortRef.current?.abort();
        abortRef.current = null;

        // WebSocket.
        const socket = socketRef.current;
        if (socket) {
            if (socket.connected) {
                socket.emit("unsubscribe-order", { orderId });
            }
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
        }
    }

    /* ── Manual refresh (e.g. after a user action) ──────────────── */
    const refresh = useCallback(() => {
        pollStatus();
    }, [pollStatus]);

    return {
        currentStatus,
        syncState,
        refresh,
    };
}
