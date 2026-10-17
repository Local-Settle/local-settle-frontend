import { describe, it, expect, vi, beforeEach } from "vitest";
import { isSignatureCancelled, walletService } from "../wallet.service";
import { stellarWalletKitService } from "../stellar-wallet-kit.service";
import { resetCsrfToken } from "@/lib/api";

vi.mock("../stellar-wallet-kit.service", () => ({
    stellarWalletKitService: {
        setWallet: vi.fn(),
        getAddress: vi.fn(),
        connect: vi.fn(),
        signTransaction: vi.fn(),
        signMessage: vi.fn(),
        supportsMessageSigning: vi.fn().mockReturnValue(true),
        disconnect: vi.fn(),
    },
}));

const mockedKit = vi.mocked(stellarWalletKitService);
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("walletService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        fetchMock.mockReset();
    });

    describe("connect", () => {
        it("persists walletId and publicKey on success", async () => {
            mockedKit.connect.mockResolvedValueOnce("GADDRESS");

            const publicKey = await walletService.connect("freighter-id");

            expect(publicKey).toBe("GADDRESS");
            expect(localStorage.getItem("wallet:provider")).toBe("freighter-id");
            expect(localStorage.getItem("wallet:publicKey")).toBe("GADDRESS");
        });
    });

    describe("signTransaction", () => {
        it("throws when no wallet is connected", async () => {
            await expect(walletService.signTransaction("XDR")).rejects.toThrow("No wallet connected");
        });

        it("selects the stored wallet and signs through the kit", async () => {
            localStorage.setItem("wallet:provider", "freighter-id");
            localStorage.setItem("wallet:publicKey", "GADDRESS");
            mockedKit.signTransaction.mockResolvedValueOnce("SIGNED_XDR");

            const result = await walletService.signTransaction("XDR");

            expect(mockedKit.setWallet).toHaveBeenCalledWith("freighter-id");
            expect(mockedKit.signTransaction).toHaveBeenCalledWith("XDR", "GADDRESS");
            expect(result).toBe("SIGNED_XDR");
        });
    });

    describe("restoreSession", () => {
        it("returns null when nothing is stored", async () => {
            await expect(walletService.restoreSession()).resolves.toBeNull();
        });

        it("restores a session when the kit confirms the same address", async () => {
            localStorage.setItem("wallet:provider", "freighter-id");
            localStorage.setItem("wallet:publicKey", "GADDRESS");
            mockedKit.getAddress.mockResolvedValueOnce("GADDRESS");

            const session = await walletService.restoreSession();

            expect(session).toEqual({ publicKey: "GADDRESS", walletId: "freighter-id" });
        });

        it("clears a stale session when the kit returns a different address", async () => {
            localStorage.setItem("wallet:provider", "freighter-id");
            localStorage.setItem("wallet:publicKey", "GOLD_ADDRESS");
            mockedKit.getAddress.mockResolvedValueOnce("GNEW_ADDRESS");

            const session = await walletService.restoreSession();

            expect(session).toBeNull();
            expect(localStorage.getItem("wallet:provider")).toBeNull();
            expect(localStorage.getItem("wallet:publicKey")).toBeNull();
        });

        it("clears a stale session when the kit fails to reconnect", async () => {
            localStorage.setItem("wallet:provider", "freighter-id");
            localStorage.setItem("wallet:publicKey", "GADDRESS");
            mockedKit.getAddress.mockRejectedValueOnce(new Error("extension not found"));

            const session = await walletService.restoreSession();

            expect(session).toBeNull();
            expect(localStorage.getItem("wallet:provider")).toBeNull();
        });
    });

    describe("clearSession", () => {
        it("removes stored wallet data and disconnects the kit", () => {
            localStorage.setItem("wallet:provider", "freighter-id");
            localStorage.setItem("wallet:publicKey", "GADDRESS");

            walletService.clearSession();

            expect(localStorage.getItem("wallet:provider")).toBeNull();
            expect(localStorage.getItem("wallet:publicKey")).toBeNull();
            expect(mockedKit.disconnect).toHaveBeenCalled();
        });
    });

    describe("authenticate", () => {
        function mockAuthFetch(responses: Array<{ ok: boolean; json: () => Promise<unknown> }>) {
            const queue = [...responses];
            fetchMock.mockImplementation((url: string) => {
                if (String(url).endsWith("/auth/csrf")) {
                    return Promise.resolve({ ok: true, json: async () => ({ csrfToken: "csrf-token" }) });
                }
                const next = queue.shift();
                if (!next) return Promise.reject(new Error(`Unexpected fetch: ${String(url)}`));
                return Promise.resolve(next);
            });
        }

        const authCalls = () =>
            fetchMock.mock.calls.filter(([url]) => !String(url).endsWith("/auth/csrf"));

        beforeEach(() => {
            localStorage.setItem("wallet:provider", "freighter-id");
            localStorage.setItem("wallet:publicKey", "G123");
            process.env.NEXT_PUBLIC_API_URL = "http://127.0.0.1:3001";
            resetCsrfToken();
        });

        it("requests a challenge, signs it through the kit, and logs in with the returned token", async () => {
            mockAuthFetch([
                { ok: true, json: async () => ({ challenge: "abc123", expiresAt: "2026-07-14T15:00:00.000Z" }) },
                { ok: true, json: async () => ({ access_token: "jwt-token" }) },
            ]);
            mockedKit.signMessage.mockResolvedValueOnce("signed-message");

            const token = await walletService.authenticate("G123");

            expect(token).toBe("jwt-token");
            expect(mockedKit.setWallet).toHaveBeenCalledWith("freighter-id");
            expect(mockedKit.signMessage).toHaveBeenCalledWith("abc123", "G123");
            expect(authCalls()).toHaveLength(2);
            expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:3001/auth/login", expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ publicKey: "G123", challenge: "abc123", signature: "signed-message" }),
            }));
        });

        it("sends the CSRF token with the login request", async () => {
            mockAuthFetch([
                { ok: true, json: async () => ({ challenge: "abc123" }) },
                { ok: true, json: async () => ({ access_token: "jwt-token" }) },
            ]);
            mockedKit.signMessage.mockResolvedValueOnce("signed-message");

            await walletService.authenticate("G123");

            const loginCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/auth/login"));
            const init = loginCall?.[1] as RequestInit;
            expect(new Headers(init.headers).get("x-csrf-token")).toBe("csrf-token");
            expect(init.credentials).toBe("include");
        });

        it("stops authentication when the wallet signature is rejected", async () => {
            mockAuthFetch([{ ok: true, json: async () => ({ challenge: "abc123" }) }]);
            mockedKit.signMessage.mockRejectedValueOnce({ code: -4, message: "The user rejected this request." });

            await expect(walletService.authenticate("G123")).rejects.toThrow("Wallet signature is required to verify ownership and complete login.");
            expect(authCalls()).toHaveLength(1);
        });

        it("detects wallets without SEP-43 support before requesting a challenge", async () => {
            mockedKit.supportsMessageSigning.mockReturnValueOnce(false);

            await expect(walletService.authenticate("G123")).rejects.toThrow(/does not support SEP-43 message signing/i);

            expect(mockedKit.supportsMessageSigning).toHaveBeenCalledWith("freighter-id");
            expect(authCalls()).toHaveLength(0);
            expect(mockedKit.signMessage).not.toHaveBeenCalled();
        });

        it("prevents duplicate authentication requests while one is in flight", async () => {
            mockAuthFetch([
                { ok: true, json: async () => ({ challenge: "abc123" }) },
                { ok: true, json: async () => ({ access_token: "jwt-token" }) },
            ]);
            mockedKit.signMessage.mockResolvedValueOnce("signed-message");

            const [first, second] = await Promise.all([walletService.authenticate("G123"), walletService.authenticate("G123")]);

            expect(first).toBe("jwt-token");
            expect(second).toBe("jwt-token");
            expect(authCalls()).toHaveLength(2);
        });
    });
});

describe("isSignatureCancelled", () => {
    // --- Freighter/kit rejection object (primary code-based detection) ---

    it("detects Freighter rejection via code -4", () => {
        const err = { code: -4, message: "The user rejected this request." };
        expect(isSignatureCancelled(err)).toBe(true);
    });

    it("detects Freighter rejection regardless of message text when code is -4", () => {
        const err = { code: -4, message: "Some other message without keywords" };
        expect(isSignatureCancelled(err)).toBe(true);
    });

    // --- Error instances (fallback message-based detection) ---

    it("detects Error with 'cancel' in message", () => {
        const err = new Error("User canceled the request");
        expect(isSignatureCancelled(err)).toBe(true);
    });

    it("detects Error with 'reject' in message", () => {
        const err = new Error("User rejected the request");
        expect(isSignatureCancelled(err)).toBe(true);
    });

    it("detects Error with 'declined' in message", () => {
        const err = new Error("User declined the request");
        expect(isSignatureCancelled(err)).toBe(true);
    });

    it("detects Error with mixed case", () => {
        const err = new Error("USER CANCELED");
        expect(isSignatureCancelled(err)).toBe(true);
    });

    // --- Plain objects (fallback message-based detection) ---

    it("detects plain object with cancel message (no code)", () => {
        const err = { message: "User canceled" };
        expect(isSignatureCancelled(err)).toBe(true);
    });

    it("detects plain object with reject message (no code)", () => {
        const err = { message: "user rejected" };
        expect(isSignatureCancelled(err)).toBe(true);
    });

    it("detects plain object with declined message (no code)", () => {
        const err = { message: "User declined" };
        expect(isSignatureCancelled(err)).toBe(true);
    });

    // --- False positives ---

    it("returns false for unrelated error with code !== -4", () => {
        const err = { code: 1, message: "Network error" };
        expect(isSignatureCancelled(err)).toBe(false);
    });

    it("returns false for unrelated Error", () => {
        const err = new Error("Network error");
        expect(isSignatureCancelled(err)).toBe(false);
    });

    it("returns false for a generic object", () => {
        const err = { foo: "bar" };
        expect(isSignatureCancelled(err)).toBe(false);
    });

    it("returns false for null", () => {
        expect(isSignatureCancelled(null)).toBe(false);
    });

    it("returns false for undefined", () => {
        expect(isSignatureCancelled(undefined)).toBe(false);
    });

    it("returns false for a string", () => {
        expect(isSignatureCancelled("cancel")).toBe(false);
    });

    it("returns false for a number", () => {
        expect(isSignatureCancelled(42)).toBe(false);
    });
});
