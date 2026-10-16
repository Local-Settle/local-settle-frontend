import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider, useUser } from "../UserContext";
import type { Users } from "@/features/user/models/users";
import { walletService } from "@/features/wallet/application/wallet.service";

vi.mock("@/features/wallet/application/wallet.service", () => ({
    walletService: { clearSession: vi.fn() },
}));

const mockedWalletService = vi.mocked(walletService);

const sampleUser: Users = {
    userId: "user-123",
    publicKey: "GABC",
    notificationsEnabled: true,
    pendingAccountInfo: false,
    kycStatus: "verified",
    totalVolume: "0",
    createdAt: "2026-01-01T00:00:00.000Z",
};

function makeToken(expiresInSeconds: number): string {
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return `header.${btoa(JSON.stringify({ exp }))}.signature`;
}

function renderUserContext() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <UserProvider>{children}</UserProvider>
        </QueryClientProvider>
    );
    return { ...renderHook(() => useUser(), { wrapper }), queryClient };
}

describe("UserContext", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        localStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("restores a valid session from localStorage on mount", () => {
        const token = makeToken(3600);
        localStorage.setItem("ikash_token", token);
        localStorage.setItem("ikash_user", JSON.stringify(sampleUser));

        const { result } = renderUserContext();
        act(() => vi.advanceTimersByTime(0));

        expect(result.current.accessToken).toBe(token);
        expect(result.current.currentUser).toEqual(sampleUser);
    });

    it("does not restore an expired token or its user", () => {
        localStorage.setItem("ikash_token", makeToken(-10));
        localStorage.setItem("ikash_user", JSON.stringify(sampleUser));

        const { result } = renderUserContext();
        act(() => vi.advanceTimersByTime(0));

        expect(result.current.accessToken).toBeNull();
        expect(result.current.currentUser).toBeNull();
    });

    it("persists the access token and user on login", () => {
        const token = makeToken(3600);
        const { result } = renderUserContext();
        act(() => vi.advanceTimersByTime(0));

        act(() => {
            result.current.setAccessToken(token);
            result.current.setCurrentUser(sampleUser);
        });
        expect(result.current.accessToken).toBe(token);
        expect(result.current.currentUser).toEqual(sampleUser);
        expect(localStorage.getItem("ikash_token")).toBe(token);
        expect(localStorage.getItem("ikash_user")).toBe(JSON.stringify(sampleUser));
    });

    it("clears state, storage, and the wallet session on logout", () => {
        const token = makeToken(3600);
        const { result, queryClient } = renderUserContext();
        act(() => vi.advanceTimersByTime(0));

        act(() => {
            result.current.setAccessToken(token);
            result.current.setCurrentUser(sampleUser);
        });

        queryClient.setQueryData(["private", "user"], { secret: "cached" });

        act(() => {
            result.current.logout();
        });

        expect(result.current.accessToken).toBeNull();
        expect(result.current.currentUser).toBeNull();
        expect(localStorage.getItem("ikash_token")).toBeNull();
        expect(localStorage.getItem("ikash_user")).toBeNull();
        expect(localStorage.getItem("ikash_wallet_session")).toBeNull();
        expect(queryClient.getQueryData(["private", "user"])).toBeUndefined();
        expect(mockedWalletService.clearSession).toHaveBeenCalled();
    });

    it("logs out automatically once the polled token expires", () => {
        const { result } = renderUserContext();
        act(() => vi.advanceTimersByTime(0));

        act(() => {
            result.current.setAccessToken(makeToken(60));
        });

        // Token is still valid at the first 30s poll.
        act(() => vi.advanceTimersByTime(30_000));
        expect(mockedWalletService.clearSession).not.toHaveBeenCalled();
        expect(result.current.accessToken).not.toBeNull();

        // Replacing the token with an expired one arms the next poll.
        act(() => {
            result.current.setAccessToken(makeToken(-10));
        });
        act(() => vi.advanceTimersByTime(30_000));

        expect(mockedWalletService.clearSession).toHaveBeenCalled();
        expect(result.current.accessToken).toBeNull();
        expect(result.current.currentUser).toBeNull();
    });

    it("clears the polling interval on unmount", () => {
        const { result, unmount } = renderUserContext();
        act(() => vi.advanceTimersByTime(0));

        // An already-expired token arms the poll; if the interval survived
        // unmount, the next 30s tick would trigger a logout.
        act(() => {
            result.current.setAccessToken(makeToken(-10));
        });

        unmount();

        act(() => vi.advanceTimersByTime(30_000));
        expect(mockedWalletService.clearSession).not.toHaveBeenCalled();
    });
});
