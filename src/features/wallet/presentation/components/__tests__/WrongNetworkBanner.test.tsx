import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WrongNetworkBanner } from "../WrongNetworkBanner";
import * as walletContextModule from "../../context/WalletContext";
import type { WalletContext } from "@/features/wallet";

vi.mock("../../context/WalletContext", () => ({
    useWalletContext: vi.fn(),
}));

describe("WrongNetworkBanner", () => {
    const mockCheckNetwork = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders nothing when wallet is not connected", () => {
        vi.spyOn(walletContextModule, "useWalletContext").mockReturnValue({
            isConnected: false,
            isCorrectNetwork: false,
            expectedNetwork: "testnet",
            currentNetwork: "mainnet",
            isCheckingNetwork: false,
            checkNetwork: mockCheckNetwork,
        } as unknown as WalletContext);

        const { container } = render(<WrongNetworkBanner />);
        expect(container.firstChild).toBeNull();
    });

    it("renders nothing when wallet is on the correct network", () => {
        vi.spyOn(walletContextModule, "useWalletContext").mockReturnValue({
            isConnected: true,
            isCorrectNetwork: true,
            expectedNetwork: "testnet",
            currentNetwork: "testnet",
            isCheckingNetwork: false,
            checkNetwork: mockCheckNetwork,
        } as unknown as WalletContext);

        const { container } = render(<WrongNetworkBanner />);
        expect(container.firstChild).toBeNull();
    });

    it("renders wrong network warning when wallet is on mainnet but testnet is required", () => {
        vi.spyOn(walletContextModule, "useWalletContext").mockReturnValue({
            isConnected: true,
            isCorrectNetwork: false,
            expectedNetwork: "testnet",
            currentNetwork: "mainnet",
            isCheckingNetwork: false,
            checkNetwork: mockCheckNetwork,
        } as unknown as WalletContext);

        render(<WrongNetworkBanner />);
        expect(screen.getByRole("alert")).toBeTruthy();
        expect(screen.getByText("Wrong Stellar network detected")).toBeTruthy();
        expect(
            screen.getByText(/LocalSettle is currently running on Testnet \(detected: Mainnet\)/)
        ).toBeTruthy();
    });

    it("renders unknown network warning when network cannot be determined", () => {
        vi.spyOn(walletContextModule, "useWalletContext").mockReturnValue({
            isConnected: true,
            isCorrectNetwork: false,
            expectedNetwork: "testnet",
            currentNetwork: "unknown",
            isCheckingNetwork: false,
            checkNetwork: mockCheckNetwork,
        } as unknown as WalletContext);

        render(<WrongNetworkBanner />);
        expect(screen.getByRole("alert")).toBeTruthy();
        expect(
            screen.getByText("Unable to verify the wallet network")
        ).toBeTruthy();
        expect(
            screen.getByText("Unable to verify the wallet network. Reconnect your wallet and try again.")
        ).toBeTruthy();
    });

    it("triggers checkNetwork when Recheck Network button is clicked", () => {
        vi.spyOn(walletContextModule, "useWalletContext").mockReturnValue({
            isConnected: true,
            isCorrectNetwork: false,
            expectedNetwork: "testnet",
            currentNetwork: "mainnet",
            isCheckingNetwork: false,
            checkNetwork: mockCheckNetwork,
        } as unknown as WalletContext);

        render(<WrongNetworkBanner />);
        const button = screen.getByRole("button", { name: /Recheck Network/i });
        fireEvent.click(button);
        expect(mockCheckNetwork).toHaveBeenCalledTimes(1);
    });
});
