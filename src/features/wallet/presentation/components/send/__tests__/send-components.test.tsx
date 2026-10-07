import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  SendAssetSelect,
  SendRecipientInput,
  SendAmountInput,
  SendConfirmView,
  SendStatusView,
  SendSuccessView,
  truncateAddress,
  isStellarAddress,
  isPotentialAlias,
} from "../index";
import type { AssetBalance } from "@/features/wallet";

describe("Send Flow Presentation Components", () => {
  const mockBalances: AssetBalance[] = [
    {
      asset_type: "credit_alphanum4",
      asset_code: "USDC",
      asset_issuer: "GISSUER123",
      balance: "150.5000000",
    },
    {
      asset_type: "native",
      asset_code: null,
      asset_issuer: null,
      balance: "50.2500000",
    },
  ];

  describe("Utility Helpers", () => {
    it("truncates Stellar addresses correctly", () => {
      const full = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
      expect(truncateAddress(full)).toBe("GBBD47...LLFLA5");
      expect(truncateAddress("short")).toBe("short");
      expect(truncateAddress("")).toBe("");
    });

    it("identifies valid Stellar public keys", () => {
      expect(isStellarAddress("GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5")).toBe(true);
      expect(isStellarAddress("invalid_address")).toBe(false);
      expect(isStellarAddress("alex.localsettle")).toBe(false);
    });

    it("identifies potential aliases", () => {
      expect(isPotentialAlias("alex.localsettle")).toBe(true);
      expect(isPotentialAlias("john_doe")).toBe(true);
      expect(isPotentialAlias("GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5")).toBe(false);
      expect(isPotentialAlias("a")).toBe(false);
    });
  });

  describe("SendAssetSelect", () => {
    it("renders selected asset and allows opening dropdown to select another asset", () => {
      const onSelectAsset = vi.fn();
      render(
        <SendAssetSelect
          balances={mockBalances}
          selectedAsset={mockBalances[0]}
          onSelectAsset={onSelectAsset}
        />
      );

      expect(screen.getByText("USDC")).toBeTruthy();
      expect(screen.getByText(/Balance: 150.50/)).toBeTruthy();

      // Open dropdown
      const button = screen.getByRole("button", { expanded: false });
      fireEvent.click(button);

      // Click on XLM option
      const xlmOption = screen.getByRole("option", { name: /XLM/i });
      fireEvent.click(xlmOption);

      expect(onSelectAsset).toHaveBeenCalledWith(mockBalances[1]);
    });
  });

  describe("SendRecipientInput", () => {
    it("renders recipient input and badges", () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <SendRecipientInput value="" onChange={onChange} />
      );

      const input = screen.getByPlaceholderText("alex.localsettle or GXXXXXX...");
      expect(input).toBeTruthy();

      // Type alias
      rerender(<SendRecipientInput value="alex.localsettle" onChange={onChange} />);
      expect(screen.getByText("LocalSettle Alias")).toBeTruthy();

      // Type Stellar address
      rerender(
        <SendRecipientInput
          value="GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
          onChange={onChange}
        />
      );
      expect(screen.getByText("Stellar Address")).toBeTruthy();
    });

    it("renders validation error message when provided", () => {
      render(
        <SendRecipientInput
          value="invalid"
          onChange={vi.fn()}
          error="Invalid recipient address"
        />
      );

      expect(screen.getByText("Invalid recipient address")).toBeTruthy();
    });
  });

  describe("SendAmountInput", () => {
    it("renders amount input and handles MAX and percentage clicks", () => {
      const onChangeAmount = vi.fn();
      render(
        <SendAmountInput
          amount="10"
          onChangeAmount={onChangeAmount}
          selectedAsset={mockBalances[0]}
        />
      );

      const input = screen.getByPlaceholderText("0.00");
      expect((input as HTMLInputElement).value).toBe("10");

      // Click MAX
      const maxButtons = screen.getAllByRole("button", { name: "MAX" });
      fireEvent.click(maxButtons[0]);

      expect(onChangeAmount).toHaveBeenCalledWith("150.5");

      // Click 50%
      const fiftyPct = screen.getByRole("button", { name: "50%" });
      fireEvent.click(fiftyPct);

      expect(onChangeAmount).toHaveBeenCalledWith("75.25");
    });
  });

  describe("SendConfirmView", () => {
    it("renders confirmation details and triggers actions", () => {
      const onBack = vi.fn();
      const onConfirm = vi.fn();
      const recipient = {
        address: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        alias: "alex.localsettle",
        exists: true,
        hasUsdcTrustline: true,
      };

      render(
        <SendConfirmView
          recipient={recipient}
          amount="25.00"
          assetName="USDC"
          fee="0.075"
          onBack={onBack}
          onConfirm={onConfirm}
        />
      );

      expect(screen.getByText("alex.localsettle")).toBeTruthy();
      expect(screen.getByText(/25\.00.*USDC/)).toBeTruthy();
      expect(screen.getByText(/0\.075.*USDC/)).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: /Back/i }));
      expect(onBack).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole("button", { name: /Sign & Send/i }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("displays warning when recipient lacks USDC trustline", () => {
      const recipient = {
        address: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        alias: null,
        exists: false,
        hasUsdcTrustline: false,
      };

      render(
        <SendConfirmView
          recipient={recipient}
          amount="10.00"
          assetName="USDC"
          fee="0.03"
          onBack={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      expect(screen.getByText(/Recipient account might not have established a USDC trustline/i)).toBeTruthy();
      expect(screen.getByText(/No LocalSettle profile/i)).toBeTruthy();
    });
  });

  describe("SendStatusView", () => {
    it("renders loading states with appropriate text", () => {
      const { rerender } = render(
        <SendStatusView step="loading" onRetry={vi.fn()} />
      );
      expect(screen.getByText("Preparing Transaction")).toBeTruthy();

      rerender(<SendStatusView step="signing" onRetry={vi.fn()} />);
      expect(screen.getByText("Waiting for Signature")).toBeTruthy();

      rerender(<SendStatusView step="submitting" onRetry={vi.fn()} />);
      expect(screen.getByText("Broadcasting Transfer")).toBeTruthy();
    });

    it("renders cancelled state with retry option", () => {
      const onRetry = vi.fn();
      render(<SendStatusView step="cancelled" onRetry={onRetry} />);

      expect(screen.getByText("Transaction Declined")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: /Try Again/i }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("renders error state with error message and retry option", () => {
      const onRetry = vi.fn();
      render(
        <SendStatusView
          step="error"
          errorMessage="Insufficient balance for network fee"
          onRetry={onRetry}
        />
      );

      expect(screen.getByText("Transfer Failed")).toBeTruthy();
      expect(screen.getByText("Insufficient balance for network fee")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: /Try Again/i }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("SendSuccessView", () => {
    it("renders success screen and triggers actions", () => {
      const onReset = vi.fn();
      const onDone = vi.fn();

      render(
        <SendSuccessView
          amount="50.00"
          assetName="USDC"
          recipientAddress="GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
          recipientAlias="alex.localsettle"
          txHash="0xabc123456789"
          onReset={onReset}
          onDone={onDone}
        />
      );

      expect(screen.getByText("Transfer Complete")).toBeTruthy();
      expect(screen.getByText("0xabc123456789")).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: /Send Another/i }));
      expect(onReset).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole("button", { name: /Dashboard/i }));
      expect(onDone).toHaveBeenCalledTimes(1);
    });
  });
});
