import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useEscrowStatusSync } from "../useEscrowStatusSync";
import * as UserContextModule from "../../../user/presentation/context/UserContext";
import * as EscrowSocketModule from "../../services/escrow-realtime.service";
import type { EscrowStatusEvent } from "../../types/escrow-events.types";

/* ── Mocks ───────────────────────────────────────────────────────── */

vi.mock("../../../user/presentation/context/UserContext", () => ({
    useUser: vi.fn(),
}));

vi.mock("../../services/escrow-realtime.service", () => ({
    createEscrowSocket: vi.fn(),
}));

const mockedUseUser = vi.mocked(UserContextModule.useUser);
const mockedCreateEscrowSocket = vi.mocked(
    EscrowSocketModule.createEscrowSocket,
);

/* ── Socket mock helper ──────────────────────────────────────────── */

type Handler = (...args: unknown[]) => void;

interface MockSocket {
    connected: boolean;
    on: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    removeAllListeners: ReturnType<typeof vi.fn>;
}

function createMockSocket() {
    const handlers: Record<string, Handler> = {};

    const socket: MockSocket = {
        connected: false,
        on: vi.fn((event: string, handler: Handler) => {
            handlers[event] = handler;
            return socket;
        }),
        emit: vi.fn(),
        connect: vi.fn(() => {
            socket.connected = true;
            return socket;
        }),
        disconnect: vi.fn(() => {
            socket.connected = false;
            return socket;
        }),
        removeAllListeners: vi.fn(),
    };

    return { socket, handlers };
}

/* ── Fixtures ────────────────────────────────────────────────────── */

const baseEvent: EscrowStatusEvent = {
    orderId: "order-1",
    escrowId: "escrow-1",
    status: "funded",
    updatedAt: "2026-08-29T12:00:00.000Z",
    transactionHash: "tx-hash-abc",
    eventId: "evt-001",
};

const terminalEvent: EscrowStatusEvent = {
    ...baseEvent,
    status: "released",
    eventId: "evt-002",
};

const baseOptions = {
    orderId: "order-1",
    escrowId: "escrow-1",
    onStatusChange: vi.fn(),
    enabled: true,
};

/* ── Tests ───────────────────────────────────────────────────────── */

describe("useEscrowStatusSync", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
        mockedUseUser.mockReturnValue({
            accessToken: "test-token",
            logout: vi.fn(),
        } as unknown as ReturnType<typeof UserContextModule.useUser>);
        mockedCreateEscrowSocket.mockReset();
        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    /* ── Initial fetch ─────────────────────────────────────────────── */

    it("fetches escrow status on mount and calls onStatusChange with the event", async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => baseEvent,
        } as Response);

        const onStatusChange = vi.fn();

        renderHook(() =>
            useEscrowStatusSync({ ...baseOptions, onStatusChange }),
        );

        await waitFor(() => {
            expect(onStatusChange).toHaveBeenCalledWith(baseEvent);
        });
    });

    it("starts in idle state", () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => baseEvent,
        } as Response);

        const { result } = renderHook(() => useEscrowStatusSync(baseOptions));

        expect(result.current.syncState.status).toBe("idle");
    });

    /* ── Deduplication ─────────────────────────────────────────────── */

    it("deduplicates events with the same eventId across multiple poll cycles", async () => {
        const identicalEvent = { ...baseEvent };

        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => identicalEvent,
        } as Response);

        const onStatusChange = vi.fn();

        renderHook(() =>
            useEscrowStatusSync({ ...baseOptions, onStatusChange }),
        );

        await waitFor(() => {
            expect(onStatusChange).toHaveBeenCalledTimes(1);
        });

        // Advance past the poll interval — the same eventId should be deduped
        await act(async () => {
            vi.advanceTimersByTime(7000);
        });

        // fetch is called again but the event is deduped
        expect(fetch).toHaveBeenCalledTimes(2);

        // Still only called once because same eventId
        expect(onStatusChange).toHaveBeenCalledTimes(1);
    });

    it("does not notify twice when socket and polling report one status with different event IDs", async () => {
        const socketEvent = { ...baseEvent, eventId: "socket-event", updatedAt: "2026-08-29T12:00:01.000Z" };
        const pollEvent = { ...baseEvent, eventId: "poll-event", updatedAt: "2026-08-29T12:00:02.000Z" };
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => pollEvent,
        } as Response);
        const { socket, handlers } = createMockSocket();
        mockedCreateEscrowSocket.mockReturnValue(socket as unknown as ReturnType<typeof EscrowSocketModule.createEscrowSocket>);
        const onStatusChange = vi.fn();

        renderHook(() => useEscrowStatusSync({ ...baseOptions, onStatusChange }));
        await waitFor(() => expect(onStatusChange).toHaveBeenCalledTimes(1));
        act(() => handlers["escrow-status-updated"]?.(socketEvent));

        expect(onStatusChange).toHaveBeenCalledTimes(1);
    });

    /* ── Terminal state ────────────────────────────────────────────── */

    it("stops polling after a terminal status (released)", async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => terminalEvent,
        } as Response);

        const onStatusChange = vi.fn();

        renderHook(() =>
            useEscrowStatusSync({ ...baseOptions, onStatusChange }),
        );

        await waitFor(() => {
            expect(onStatusChange).toHaveBeenCalledTimes(1);
        });

        expect(onStatusChange).toHaveBeenCalledWith(terminalEvent);

        // Advance past several poll intervals — no more fetches after terminal.
        const callCountBefore = (fetch as ReturnType<typeof vi.fn>).mock
            .calls.length;
        await act(async () => {
            vi.advanceTimersByTime(30_000);
        });

        // After terminal status, no additional fetches should be made.
        expect(
            (fetch as ReturnType<typeof vi.fn>).mock.calls.length,
        ).toBe(callCountBefore);
    });

    it("returns the current status after a status event", async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => baseEvent,
        } as Response);

        const { result } = renderHook(() =>
            useEscrowStatusSync(baseOptions),
        );

        await waitFor(() => {
            expect(result.current.currentStatus).toBe("funded");
        });
    });

    /* ── Error handling ────────────────────────────────────────────── */

    it("preserves last known state on fetch failure", async () => {
        (fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => baseEvent,
            } as Response)
            .mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({}),
            } as Response);

        const onStatusChange = vi.fn();

        const { result } = renderHook(() =>
            useEscrowStatusSync({ ...baseOptions, onStatusChange }),
        );

        await waitFor(() => {
            expect(onStatusChange).toHaveBeenCalledTimes(1);
        });

        // The status should still be "funded" after the failed poll
        expect(result.current.currentStatus).toBe("funded");

        // Trigger the failing poll
        act(() => {
            vi.advanceTimersByTime(7000);
        });

        await waitFor(() => {
            expect(result.current.syncState.status).toBe("error");
        });

        // Status should still be preserved
        expect(result.current.currentStatus).toBe("funded");
    });

    it("calls logout on 401", async () => {
        const logout = vi.fn();
        mockedUseUser.mockReturnValue({
            accessToken: "test-token",
            logout,
        } as unknown as ReturnType<typeof UserContextModule.useUser>);

        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({}),
        } as Response);

        renderHook(() => useEscrowStatusSync(baseOptions));

        await waitFor(() => {
            expect(logout).toHaveBeenCalled();
        });
    });

    /* ── Cleanup on unmount ────────────────────────────────────────── */

    it("cleans up socket, timers, and pending requests on unmount", async () => {
        const { socket } = createMockSocket();
        mockedCreateEscrowSocket.mockReturnValue(
            socket as unknown as ReturnType<
                typeof EscrowSocketModule.createEscrowSocket
            >,
        );

        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => baseEvent,
        } as Response);

        const { unmount } = renderHook(() =>
            useEscrowStatusSync(baseOptions),
        );

        // Let the socket connect
        await act(async () => {
            vi.advanceTimersByTime(0);
        });

        unmount();

        expect(socket.removeAllListeners).toHaveBeenCalled();
        expect(socket.disconnect).toHaveBeenCalled();
    });

    it("aborts in-flight fetch on unmount", async () => {
        // Never resolve the fetch so we can test abort.
        (fetch as ReturnType<typeof vi.fn>).mockReturnValue(
            new Promise(() => {}),
        );

        const { unmount } = renderHook(() =>
            useEscrowStatusSync(baseOptions),
        );

        unmount();

        // No error should be thrown — the abort is handled gracefully.
    });

    /* ── Disabled / missing params ─────────────────────────────────── */

    it("does not fetch or connect when disabled", () => {
        renderHook(() =>
            useEscrowStatusSync({ ...baseOptions, enabled: false }),
        );

        expect(fetch).not.toHaveBeenCalled();
        expect(mockedCreateEscrowSocket).not.toHaveBeenCalled();
    });

    it("does not fetch when escrowId is null", () => {
        renderHook(() =>
            useEscrowStatusSync({ ...baseOptions, escrowId: null }),
        );

        expect(fetch).not.toHaveBeenCalled();
    });

    /* ── Polling interval ──────────────────────────────────────────── */

    it("polls at the correct interval (7 seconds)", async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => baseEvent,
        } as Response);

        renderHook(() => useEscrowStatusSync(baseOptions));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        // Advance 7 seconds — next poll should fire
        await act(async () => {
            vi.advanceTimersByTime(7000);
        });

        expect(fetch).toHaveBeenCalledTimes(2);

        // Advance another 7 seconds
        await act(async () => {
            vi.advanceTimersByTime(7000);
        });

        expect(fetch).toHaveBeenCalledTimes(3);
    });

    /* ── WebSocket events ──────────────────────────────────────────── */

    it("processes escrow-status-updated events from WebSocket", async () => {
        const { socket, handlers } = createMockSocket();
        mockedCreateEscrowSocket.mockReturnValue(
            socket as unknown as ReturnType<
                typeof EscrowSocketModule.createEscrowSocket
            >,
        );

        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => baseEvent,
        } as Response);

        const onStatusChange = vi.fn();

        renderHook(() =>
            useEscrowStatusSync({ ...baseOptions, onStatusChange }),
        );

        // Let initial fetch complete
        await waitFor(() => {
            expect(onStatusChange).toHaveBeenCalledTimes(1);
        });

        // Emit a WebSocket event
        const wsEvent: EscrowStatusEvent = {
            ...baseEvent,
            status: "fiat_sent",
            eventId: "evt-ws-001",
        };

        act(() => {
            handlers["escrow-status-updated"]?.(wsEvent);
        });

        expect(onStatusChange).toHaveBeenCalledTimes(2);
        expect(onStatusChange).toHaveBeenLastCalledWith(wsEvent);
    });

    it("ignores WebSocket events from a different order", async () => {
        const { socket, handlers } = createMockSocket();
        mockedCreateEscrowSocket.mockReturnValue(
            socket as unknown as ReturnType<
                typeof EscrowSocketModule.createEscrowSocket
            >,
        );

        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => baseEvent,
        } as Response);

        const onStatusChange = vi.fn();

        renderHook(() =>
            useEscrowStatusSync({ ...baseOptions, onStatusChange }),
        );

        await waitFor(() => {
            expect(onStatusChange).toHaveBeenCalledTimes(1);
        });

        // Emit event for a different order
        const wrongOrderEvent: EscrowStatusEvent = {
            ...baseEvent,
            orderId: "different-order",
            eventId: "evt-wrong",
        };

        act(() => {
            handlers["escrow-status-updated"]?.(wrongOrderEvent);
        });

        // Should not be called again — event was for wrong order
        expect(onStatusChange).toHaveBeenCalledTimes(1);
    });

    /* ── Manual refresh ────────────────────────────────────────────── */

    it("clears dedup cache and re-fetches on manual refresh", async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => baseEvent,
        } as Response);

        const onStatusChange = vi.fn();

        const { result } = renderHook(() =>
            useEscrowStatusSync({ ...baseOptions, onStatusChange }),
        );

        await waitFor(() => {
            expect(onStatusChange).toHaveBeenCalledTimes(1);
        });

        // Manual refresh should clear dedup and re-process
        act(() => {
            result.current.refresh();
        });

        await waitFor(() => {
            expect(onStatusChange).toHaveBeenCalledTimes(2);
        });
    });
});
