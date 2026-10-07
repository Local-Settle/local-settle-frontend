import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SendPage from "../page";

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
};

const mockNotify = vi.fn();
let mockSearchParams: Record<string, string | null> = {};
let mockIsConnected = true;
let mockPublicKey: string | null = "GSOURCE1234567890123456789012345678901234567890123456";
let mockSendState = {
  step: "form" as string,
  recipient: null as unknown,
  fee: null as string | null,
  txHash: null as string | null,
  errorMessage: null as string | null,
};

const mockResolveAndPrepare = vi.fn();
const mockConfirmSend = vi.fn();
const mockReset = vi.fn();
const mockBackToConfirm = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams[key] ?? null,
  }),
  usePathname: () => "/send",
}));

vi.mock("@/features/wallet", () => ({
  useWallet: () => ({
    isConnected: mockIsConnected,
    publicKey: mockPublicKey,
    isLoading: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  useWalletBalance: () => ({
    balance: "100.00",
    balances: [
      {
        asset_type: "credit_alphanum4",
        asset_code: "USDC",
        asset_issuer: "GISSUER",
        balance: "250.0000000",
      },
      {
        asset_type: "native",
        asset_code: null,
        asset_issuer: null,
        balance: "80.0000000",
      },
    ],
    isLoading: false,
    error: null,
  }),
  walletOptions: [
    { id: "freighter", name: "Freighter", description: "Browser extension", icon: "/freighter.png" },
  ],
}));

vi.mock("@/features/wallet/presentation/hooks/useSend", () => ({
  useSend: () => ({
    state: mockSendState,
    resolveAndPrepare: mockResolveAndPrepare,
    confirmSend: mockConfirmSend,
    reset: mockReset,
    backToConfirm: mockBackToConfirm,
  }),
}));

vi.mock("@/features/notifications", () => ({
  useNotifications: () => ({
    notify: mockNotify,
    dismiss: vi.fn(),
    dismissAll: vi.fn(),
  }),
}));

vi.mock("@/features/user/presentation/context/UserContext", () => ({
  useUser: () => ({
    currentUser: { userId: "u1", alias: "chibuike", publicKey: "GSOURCE" },
    accessToken: "jwt-token",
    setCurrentUser: vi.fn(),
    setAccessToken: vi.fn(),
  }),
}));

describe("SendPage standalone route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = {};
    mockIsConnected = true;
    mockPublicKey = "GSOURCE1234567890123456789012345678901234567890123456";
    mockSendState = {
      step: "form",
      recipient: null,
      fee: null,
      txHash: null,
      errorMessage: null,
    };
  });

  it("renders the standalone /send page without redirecting", () => {
    render(<SendPage />);

    expect(screen.getByRole("heading", { name: /Send Funds/i })).toBeTruthy();
    expect(screen.getByText("New Transfer")).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("pre-populates recipient and amount from search params", () => {
    mockSearchParams = {
      wallet: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
      amount: "45.50",
    };

    render(<SendPage />);

    const recipientInput = screen.getByPlaceholderText("alex.localsettle or GXXXXXX...");
    const amountInput = screen.getByPlaceholderText("0.00");

    expect((recipientInput as HTMLInputElement).value).toBe(
      "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
    );
    expect((amountInput as HTMLInputElement).value).toBe("45.50");
  });

  it("validates empty or invalid recipient format", () => {
    render(<SendPage />);

    const recipientInput = screen.getByPlaceholderText("alex.localsettle or GXXXXXX...");
    const amountInput = screen.getByPlaceholderText("0.00");
    const reviewBtn = screen.getByRole("button", { name: /Review & Send/i });

    // Review button should be disabled initially when empty
    expect(reviewBtn.hasAttribute("disabled")).toBe(true);

    // Enter invalid short recipient
    fireEvent.change(recipientInput, { target: { value: " " } });
    fireEvent.change(amountInput, { target: { value: "10" } });

    expect(reviewBtn.hasAttribute("disabled")).toBe(true);
  });

  it("validates amount exceeding available balance", () => {
    render(<SendPage />);

    const recipientInput = screen.getByPlaceholderText("alex.localsettle or GXXXXXX...");
    const amountInput = screen.getByPlaceholderText("0.00");
    const reviewBtn = screen.getByRole("button", { name: /Review & Send/i });

    fireEvent.change(recipientInput, { target: { value: "alex.localsettle" } });
    fireEvent.change(amountInput, { target: { value: "9999" } });

    fireEvent.click(reviewBtn);

    expect(screen.getByText(/Amount exceeds available balance/i)).toBeTruthy();
    expect(mockResolveAndPrepare).not.toHaveBeenCalled();
  });

  it("calls resolveAndPrepare when inputs are valid", () => {
    render(<SendPage />);

    const recipientInput = screen.getByPlaceholderText("alex.localsettle or GXXXXXX...");
    const amountInput = screen.getByPlaceholderText("0.00");
    const reviewBtn = screen.getByRole("button", { name: /Review & Send/i });

    fireEvent.change(recipientInput, {
      target: { value: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
    });
    fireEvent.change(amountInput, { target: { value: "25.00" } });

    fireEvent.click(reviewBtn);

    expect(mockResolveAndPrepare).toHaveBeenCalledWith(
      "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
      "25.00",
      "USDC"
    );
  });

  it("renders confirmation view when step is confirm", () => {
    mockSendState = {
      step: "confirm",
      recipient: {
        address: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        alias: "alex.localsettle",
        exists: true,
        hasUsdcTrustline: true,
      },
      fee: "0.075",
      txHash: null,
      errorMessage: null,
    };

    render(<SendPage />);

    expect(screen.getByText("Review Transaction")).toBeTruthy();
    expect(screen.getByText("alex.localsettle")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Sign & Send/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Sign & Send/i }));
    expect(mockConfirmSend).toHaveBeenCalledTimes(1);
  });

  it("renders success view and notifies when step is success", () => {
    mockSendState = {
      step: "success",
      recipient: {
        address: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        alias: "alex.localsettle",
        exists: true,
        hasUsdcTrustline: true,
      },
      fee: "0.075",
      txHash: "0xhash123456789",
      errorMessage: null,
    };

    render(<SendPage />);

    expect(screen.getByText("Transfer Complete")).toBeTruthy();
    expect(screen.getByText("0xhash123456789")).toBeTruthy();
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        title: "Transfer Sent",
      })
    );
  });

  it("renders guided connect wallet prompt when wallet is disconnected", () => {
    mockIsConnected = false;
    mockPublicKey = null;

    render(<SendPage />);

    expect(screen.getByText("Connect Your Wallet")).toBeTruthy();
    expect(screen.getByText("Freighter")).toBeTruthy();
  });
});
