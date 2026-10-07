import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSend } from "../useSend";

const mockSignTransaction = vi.fn();
const mockUserContext = {
  accessToken: "mock-token-123",
  currentUser: { userId: "user-1", publicKey: "GSOURCE" },
};

vi.mock("@/features/user/presentation/context/UserContext", () => ({
  useUser: () => mockUserContext,
}));

vi.mock("@/features/wallet", () => ({
  useWallet: () => ({
    signTransaction: mockSignTransaction,
  }),
}));

describe("useSend hook", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSignTransaction.mockReset();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("initializes with default form state", () => {
    const { result } = renderHook(() => useSend());

    expect(result.current.state.step).toBe("form");
    expect(result.current.state.recipient).toBeNull();
    expect(result.current.state.fee).toBeNull();
    expect(result.current.state.txHash).toBeNull();
    expect(result.current.state.errorMessage).toBeNull();
  });

  it("resolves recipient and prepares transaction successfully", async () => {
    const mockRecipient = {
      address: "GRECIPIENT1234567890123456789012345678901234567890123456",
      alias: "alex.localsettle",
      exists: true,
      hasUsdcTrustline: true,
    };
    const mockPrepared = {
      xdr: "AAAA_MOCK_PREPARED_XDR",
      fee: "0.03",
    };

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/send/resolve")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRecipient),
        });
      }
      if (url.includes("/send/prepare")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPrepared),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    const { result } = renderHook(() => useSend());

    await act(async () => {
      await result.current.resolveAndPrepare("alex.localsettle", "10.00", "USDC");
    });

    expect(result.current.state.step).toBe("confirm");
    expect(result.current.state.recipient).toEqual(mockRecipient);
    expect(result.current.state.fee).toBe("0.03");
    expect(result.current.state.errorMessage).toBeNull();
  });

  it("handles recipient resolution failure gracefully", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/send/resolve")) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: "Recipient not found" }),
        });
      }
      return Promise.reject(new Error("Unexpected"));
    });

    const { result } = renderHook(() => useSend());

    await act(async () => {
      await result.current.resolveAndPrepare("unknown.alias", "5.00");
    });

    expect(result.current.state.step).toBe("error");
    expect(result.current.state.errorMessage).toBe("Recipient not found");
    expect(result.current.state.recipient).toBeNull();
  });

  it("handles prepare transaction API failure", async () => {
    const mockRecipient = {
      address: "GRECIPIENT1234567890123456789012345678901234567890123456",
      alias: null,
      exists: true,
      hasUsdcTrustline: true,
    };

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/send/resolve")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRecipient),
        });
      }
      if (url.includes("/send/prepare")) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: "Insufficient balance for fee" }),
        });
      }
      return Promise.reject(new Error("Unexpected"));
    });

    const { result } = renderHook(() => useSend());

    await act(async () => {
      await result.current.resolveAndPrepare(mockRecipient.address, "100.00");
    });

    expect(result.current.state.step).toBe("error");
    expect(result.current.state.errorMessage).toBe("Insufficient balance for fee");
  });

  it("handles prepare response missing XDR", async () => {
    const mockRecipient = {
      address: "GRECIPIENT1234567890123456789012345678901234567890123456",
      alias: null,
      exists: true,
      hasUsdcTrustline: true,
    };

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/send/resolve")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRecipient),
        });
      }
      if (url.includes("/send/prepare")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }
      return Promise.reject(new Error("Unexpected"));
    });

    const { result } = renderHook(() => useSend());

    await act(async () => {
      await result.current.resolveAndPrepare(mockRecipient.address, "10.00");
    });

    expect(result.current.state.step).toBe("error");
    expect(result.current.state.errorMessage).toBe("Server response did not include a transaction to sign.");
  });

  it("signs and submits transaction successfully", async () => {
    const mockRecipient = {
      address: "GRECIPIENT1234567890123456789012345678901234567890123456",
      alias: "alex.localsettle",
      exists: true,
      hasUsdcTrustline: true,
    };
    const mockPrepared = {
      xdr: "AAAA_UNSIGNED_XDR",
      fee: "0.03",
    };
    const mockSubmitRes = {
      hash: "0xabcdef1234567890abcdef1234567890",
    };

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/send/resolve")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRecipient),
        });
      }
      if (url.includes("/send/prepare")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPrepared),
        });
      }
      if (url.includes("/send/submit")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSubmitRes),
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    mockSignTransaction.mockResolvedValueOnce("AAAA_SIGNED_XDR");

    const { result } = renderHook(() => useSend());

    await act(async () => {
      await result.current.resolveAndPrepare("alex.localsettle", "10.00");
    });

    expect(result.current.state.step).toBe("confirm");

    await act(async () => {
      await result.current.confirmSend();
    });

    expect(mockSignTransaction).toHaveBeenCalledWith("AAAA_UNSIGNED_XDR", "TESTNET");
    expect(result.current.state.step).toBe("success");
    expect(result.current.state.txHash).toBe("0xabcdef1234567890abcdef1234567890");
  });

  it("handles user cancelling or declining signature", async () => {
    const mockRecipient = {
      address: "GRECIPIENT1234567890123456789012345678901234567890123456",
      alias: "alex.localsettle",
      exists: true,
      hasUsdcTrustline: true,
    };
    const mockPrepared = { xdr: "AAAA_UNSIGNED_XDR", fee: "0.03" };

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/send/resolve")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRecipient) });
      }
      if (url.includes("/send/prepare")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPrepared) });
      }
      return Promise.reject(new Error("Unexpected"));
    });

    mockSignTransaction.mockRejectedValueOnce(new Error("User rejected the signing request"));

    const { result } = renderHook(() => useSend());

    await act(async () => {
      await result.current.resolveAndPrepare("alex.localsettle", "10.00");
    });

    await act(async () => {
      await result.current.confirmSend();
    });

    expect(result.current.state.step).toBe("cancelled");
    expect(result.current.state.errorMessage).toBeNull();

    // backToConfirm restores confirm state
    act(() => {
      result.current.backToConfirm();
    });
    expect(result.current.state.step).toBe("confirm");
  });

  it("handles submission network failure", async () => {
    const mockRecipient = {
      address: "GRECIPIENT1234567890123456789012345678901234567890123456",
      alias: "alex.localsettle",
      exists: true,
      hasUsdcTrustline: true,
    };
    const mockPrepared = { xdr: "AAAA_UNSIGNED_XDR", fee: "0.03" };

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/send/resolve")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRecipient) });
      }
      if (url.includes("/send/prepare")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPrepared) });
      }
      if (url.includes("/send/submit")) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: "Transaction submission timeout on ledger" }),
        });
      }
      return Promise.reject(new Error("Unexpected"));
    });

    mockSignTransaction.mockResolvedValueOnce("AAAA_SIGNED_XDR");

    const { result } = renderHook(() => useSend());

    await act(async () => {
      await result.current.resolveAndPrepare("alex.localsettle", "10.00");
    });

    await act(async () => {
      await result.current.confirmSend();
    });

    expect(result.current.state.step).toBe("error");
    expect(result.current.state.errorMessage).toBe("Transaction submission timeout on ledger");
  });

  it("resets state back to form on reset()", async () => {
    const mockRecipient = {
      address: "GRECIPIENT1234567890123456789012345678901234567890123456",
      alias: "alex.localsettle",
      exists: true,
      hasUsdcTrustline: true,
    };
    const mockPrepared = { xdr: "AAAA_UNSIGNED_XDR", fee: "0.03" };

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/send/resolve")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRecipient) });
      }
      if (url.includes("/send/prepare")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPrepared) });
      }
      return Promise.reject(new Error("Unexpected"));
    });

    const { result } = renderHook(() => useSend());

    await act(async () => {
      await result.current.resolveAndPrepare("alex.localsettle", "10.00");
    });

    expect(result.current.state.step).toBe("confirm");

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.step).toBe("form");
    expect(result.current.state.recipient).toBeNull();
    expect(result.current.state.fee).toBeNull();
  });
});
