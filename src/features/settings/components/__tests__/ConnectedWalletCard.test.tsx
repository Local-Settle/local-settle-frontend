import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConnectedWalletCard } from "../ConnectedWalletCard";
import * as walletContextModule from "@/features/wallet/presentation/context/WalletContext";
import type { WalletContext } from "@/features/wallet";

vi.mock("@/features/wallet/presentation/context/WalletContext", () => ({
    useWalletContext: vi.fn(),
}));

describe("ConnectedWalletCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("displays not connected message when wallet is disconnected", () => {
        vi.spyOn(walletContextModule, "useWalletContext").mockReturnValue({
            publicKey: null,
            walletId: null,
            isConnected: false,
        } as unknown as WalletContext);

        render(<ConnectedWalletCard />);

        expect(screen.getByText("Not Connected")).toBeTruthy();
        expect(screen.getByText("No Stellar wallet is currently connected.")).toBeTruthy();
    });

    it("displays truncated address and allows toggling full address", () => {
        const fullKey = "GABC1234567890123456789012345678901234567890123456789012XYZ";
        vi.spyOn(walletContextModule, "useWalletContext").mockReturnValue({
            publicKey: fullKey,
            walletId: "freighter",
            isConnected: true,
            currentNetwork: "testnet",
        } as unknown as WalletContext);

        render(<ConnectedWalletCard />);

        expect(screen.getByText("Connected")).toBeTruthy();
        expect(screen.getByText("GABC12...012XYZ")).toBeTruthy();

        // Toggle full key
        expect(screen.getByText("Wallet Provider:").parentElement?.textContent).toContain("freighter");
        expect(screen.getByText("Stellar Network:").parentElement?.textContent).toContain("testnet");
        expect(screen.getByLabelText(`Stellar public key: ${fullKey}`)).toBeTruthy();

        const toggleBtn = screen.getByRole("button", { name: `View full Stellar public key ${fullKey}` });
        fireEvent.click(toggleBtn);

        expect(screen.getByText(fullKey)).toBeTruthy();
    });

    it("copies the full key from the keyboard and announces success accessibly", async () => {
        const writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
            clipboard: {
                writeText: writeTextMock,
            },
        });

        const fullKey = "GABC1234567890123456789012345678901234567890123456789012XYZ";
        vi.spyOn(walletContextModule, "useWalletContext").mockReturnValue({
            publicKey: fullKey,
            walletId: "freighter",
            isConnected: true,
            currentNetwork: "mainnet",
        } as unknown as WalletContext);

        render(<ConnectedWalletCard />);

        const copyBtn = screen.getByRole("button", { name: `Copy Stellar public key ${fullKey}` });
        copyBtn.focus();
        fireEvent.keyDown(copyBtn, { key: "Enter" });

        await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith(fullKey));
        await waitFor(() => expect(screen.getByRole("status").textContent).toContain(`Copied Stellar public key ${fullKey}`));
        expect(screen.getByText("Stellar Network:").parentElement?.textContent).toContain("mainnet");
    });

    it("reveals the full public key from the keyboard", () => {
        const fullKey = "GABC1234567890123456789012345678901234567890123456789012XYZ";
        vi.spyOn(walletContextModule, "useWalletContext").mockReturnValue({
            publicKey: fullKey,
            walletId: "freighter",
            isConnected: true,
            currentNetwork: "unknown",
            expectedNetwork: "testnet",
        } as unknown as WalletContext);

        render(<ConnectedWalletCard />);

        const revealButton = screen.getByRole("button", { name: `View full Stellar public key ${fullKey}` });
        revealButton.focus();
        fireEvent.keyDown(revealButton, { key: " " });

        expect(screen.getByText(fullKey)).toBeTruthy();
        expect(screen.getByText("Stellar Network:").parentElement?.textContent).toContain("testnet (unable to verify)");
    });
});
