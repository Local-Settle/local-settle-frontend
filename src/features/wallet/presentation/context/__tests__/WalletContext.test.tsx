import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletProvider, useWalletContext } from "../WalletContext";
import * as walletServiceModule from "../../../application/wallet.service";

const mockPush = vi.fn();
const mockGetOrCreateByWallet = vi.fn();
const mockSetCurrentUser = vi.fn();
const mockSetAccessToken = vi.fn();
const mockLogout = vi.fn();
const mockNotify = vi.fn();

vi.mock("../../../application/wallet.service", () => ({
    walletService: {
        connect: vi.fn(),
        signTransaction: vi.fn(),
        restoreSession: vi.fn(),
        clearSession: vi.fn(),
        authenticate: vi.fn(),
        detectNetwork: vi.fn().mockResolvedValue("testnet"),
        getExpectedNetwork: vi.fn().mockReturnValue("testnet"),
    },
    isSignatureCancelled: vi.fn(),
}));

vi.mock("../../../../user/hooks/useUsers", () => ({
    useUsers: () => ({ getOrCreateByWallet: mockGetOrCreateByWallet }),
}));

vi.mock("../../../../user/presentation/context/UserContext", () => ({
    useUser: () => ({
        setCurrentUser: mockSetCurrentUser,
        setAccessToken: mockSetAccessToken,
        logout: mockLogout,
    }),
}));

vi.mock("@/features/notifications", () => ({
    useNotifications: () => ({ notify: mockNotify, dismiss: vi.fn(), dismissAll: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
}));

const mockedWalletService = vi.mocked(walletServiceModule.walletService);

function renderWalletContext() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <WalletProvider>{children}</WalletProvider>
        </QueryClientProvider>
    );
    return { ...renderHook(() => useWalletContext(), { wrapper }), queryClient };
}

describe("WalletContext", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedWalletService.restoreSession.mockResolvedValue(null);
        mockedWalletService.authenticate.mockResolvedValue("jwt-token");
        mockGetOrCreateByWallet.mockResolvedValue({ pendingAccountInfo: false });

        global.fetch = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes("horizon-testnet.stellar.org")) {
                return new Response(JSON.stringify({}), { status: 200 });
            }
            return new Response(JSON.stringify({}), { status: 200 });
        }) as unknown as typeof fetch;
    });

    it("connects successfully, stores the address and redirects to dashboard", async () => {
        mockedWalletService.connect.mockResolvedValueOnce("GABCPUBLICKEY");

        const { result } = renderWalletContext();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.connect("freighter-id");
        });

        expect(mockedWalletService.connect).toHaveBeenCalledWith("freighter-id");
        expect(result.current.publicKey).toBe("GABCPUBLICKEY");
        expect(result.current.walletId).toBe("freighter-id");
        expect(result.current.isConnected).toBe(true);
        expect(result.current.error).toBeNull();
        expect(mockedWalletService.authenticate).toHaveBeenCalledWith("GABCPUBLICKEY");
        expect(mockSetAccessToken).toHaveBeenCalledWith("jwt-token");
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("clears the session and surfaces an error when challenge authentication fails", async () => {
        mockedWalletService.connect.mockResolvedValueOnce("GABCPUBLICKEY");
        mockedWalletService.authenticate.mockRejectedValueOnce(
            new Error("Wallet signature is required to verify ownership and complete login.")
        );

        const { result } = renderWalletContext();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await expect(result.current.connect("freighter-id")).rejects.toBeTruthy();
        });

        expect(mockedWalletService.clearSession).toHaveBeenCalled();
        expect(mockSetAccessToken).not.toHaveBeenCalled();
        expect(mockGetOrCreateByWallet).not.toHaveBeenCalled();
        expect(result.current.isConnected).toBe(false);
        expect(result.current.error).toMatch(/signature is required/i);
    });

    it("redirects to setupAccount when onboarding is pending", async () => {
        mockedWalletService.connect.mockResolvedValueOnce("GABCPUBLICKEY");
        mockGetOrCreateByWallet.mockResolvedValueOnce({ pendingAccountInfo: true });

        const { result } = renderWalletContext();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.connect("freighter-id");
        });

        expect(mockPush).toHaveBeenCalledWith("/setupAccount");
    });

    it("clears the previous wallet's state when switching wallets", async () => {
        mockedWalletService.connect
            .mockResolvedValueOnce("GABC_FREIGHTER")
            .mockResolvedValueOnce("GXYZ_LOBSTR");

        const { result, queryClient } = renderWalletContext();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.connect("freighter-id");
        });
        expect(result.current.publicKey).toBe("GABC_FREIGHTER");
        queryClient.setQueryData(["private", "wallet"], { balance: "cached" });

        await act(async () => {
            await result.current.connect("lobstr-id");
        });

        expect(result.current.publicKey).toBe("GXYZ_LOBSTR");
        expect(result.current.walletId).toBe("lobstr-id");
        expect(queryClient.getQueryData(["private", "wallet"])).toBeUndefined();
    });

    it("surfaces a rejected connection as an error and notifies the user", async () => {
        mockedWalletService.connect.mockRejectedValueOnce({ code: -4, message: "The user rejected this request." });

        const { result } = renderWalletContext();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await expect(result.current.connect("freighter-id")).rejects.toBeTruthy();
        });

        expect(result.current.isConnected).toBe(false);
        expect(result.current.error).toBe("Connection request was rejected.");
        expect(mockNotify).toHaveBeenCalledWith("error", "Connection request was rejected.");
    });

    it("rejects connection when the account isn't funded on Testnet", async () => {
        mockedWalletService.connect.mockResolvedValueOnce("GUNFUNDED");
        global.fetch = vi.fn(async () => new Response(null, { status: 404 })) as unknown as typeof fetch;

        const { result } = renderWalletContext();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await expect(result.current.connect("freighter-id")).rejects.toBeTruthy();
        });

        expect(mockedWalletService.clearSession).toHaveBeenCalled();
        expect(result.current.isConnected).toBe(false);
        expect(result.current.error).toMatch(/not funded/i);
    });

    it("disconnect clears session, logs out and resets state", async () => {
        mockedWalletService.connect.mockResolvedValueOnce("GABCPUBLICKEY");

        const { result } = renderWalletContext();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.connect("freighter-id");
        });
        expect(result.current.isConnected).toBe(true);

        act(() => {
            result.current.disconnect();
        });

        expect(mockedWalletService.clearSession).toHaveBeenCalled();
        expect(mockLogout).toHaveBeenCalled();
        expect(result.current.isConnected).toBe(false);
        expect(result.current.publicKey).toBeNull();
    });

    it("restores a valid previous session on mount", async () => {
        mockedWalletService.restoreSession.mockResolvedValueOnce({ publicKey: "GRESTORED", walletId: "freighter-id" });
        mockGetOrCreateByWallet.mockResolvedValueOnce({ pendingAccountInfo: false });

        const { result } = renderWalletContext();

        await waitFor(() => expect(result.current.isConnected).toBe(true));
        expect(result.current.publicKey).toBe("GRESTORED");
        expect(result.current.walletId).toBe("freighter-id");
    });

    it("does not restore a session when none is stored", async () => {
        mockedWalletService.restoreSession.mockResolvedValueOnce(null);

        const { result } = renderWalletContext();

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.isConnected).toBe(false);
        expect(result.current.publicKey).toBeNull();
    });

    describe("network detection & guard", () => {
        it("identifies correct network when detected matches expected", async () => {
            mockedWalletService.connect.mockResolvedValueOnce("GABCPUBLICKEY");
            mockedWalletService.detectNetwork.mockResolvedValueOnce("testnet");

            const { result } = renderWalletContext();
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await act(async () => {
                await result.current.connect("freighter-id");
            });

            expect(result.current.currentNetwork).toBe("testnet");
            expect(result.current.isCorrectNetwork).toBe(true);
        });

        it("identifies wrong network when wallet is on mainnet but testnet is expected", async () => {
            mockedWalletService.connect.mockResolvedValueOnce("GABCPUBLICKEY");
            mockedWalletService.detectNetwork.mockResolvedValueOnce("mainnet");

            const { result } = renderWalletContext();
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await act(async () => {
                await result.current.connect("freighter-id");
            });

            expect(result.current.currentNetwork).toBe("mainnet");
            expect(result.current.isCorrectNetwork).toBe(false);
        });

        it("identifies unknown network when network cannot be determined", async () => {
            mockedWalletService.connect.mockResolvedValueOnce("GABCPUBLICKEY");
            mockedWalletService.detectNetwork.mockResolvedValueOnce("unknown");

            const { result } = renderWalletContext();
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await act(async () => {
                await result.current.connect("freighter-id");
            });

            expect(result.current.currentNetwork).toBe("unknown");
            expect(result.current.isCorrectNetwork).toBe(false);
        });

        it("updates network state when checkNetwork is triggered", async () => {
            mockedWalletService.connect.mockResolvedValueOnce("GABCPUBLICKEY");
            mockedWalletService.detectNetwork.mockResolvedValueOnce("mainnet");

            const { result } = renderWalletContext();
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await act(async () => {
                await result.current.connect("freighter-id");
            });
            expect(result.current.isCorrectNetwork).toBe(false);

            // User switches network to testnet
            mockedWalletService.detectNetwork.mockResolvedValueOnce("testnet");
            await act(async () => {
                await result.current.checkNetwork();
            });

            expect(result.current.currentNetwork).toBe("testnet");
            expect(result.current.isCorrectNetwork).toBe(true);
        });

        it("blocks signTransaction when on wrong network", async () => {
            mockedWalletService.connect.mockResolvedValueOnce("GABCPUBLICKEY");
            mockedWalletService.detectNetwork.mockResolvedValueOnce("mainnet");

            const { result } = renderWalletContext();
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await act(async () => {
                await result.current.connect("freighter-id");
            });

            mockedWalletService.detectNetwork.mockResolvedValueOnce("mainnet");
            await expect(result.current.signTransaction("dummy-xdr")).rejects.toThrow(
                /Wrong Stellar network detected/
            );
            expect(mockedWalletService.signTransaction).not.toHaveBeenCalled();
        });

        it("allows signTransaction when on correct network", async () => {
            mockedWalletService.connect.mockResolvedValueOnce("GABCPUBLICKEY");
            mockedWalletService.detectNetwork.mockResolvedValueOnce("testnet");
            mockedWalletService.signTransaction.mockResolvedValueOnce("signed-xdr");

            const { result } = renderWalletContext();
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await act(async () => {
                await result.current.connect("freighter-id");
            });

            mockedWalletService.detectNetwork.mockResolvedValueOnce("testnet");
            let signed = "";
            await act(async () => {
                signed = await result.current.signTransaction("dummy-xdr");
            });

            expect(signed).toBe("signed-xdr");
            expect(mockedWalletService.signTransaction).toHaveBeenCalledWith("dummy-xdr");
        });
    });
});
