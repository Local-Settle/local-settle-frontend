import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { ConnectWalletModal } from "../page";

const mocks = vi.hoisted(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    push: vi.fn(),
}));

vi.mock("../../../features/wallet/presentation/context/WalletContext", () => ({
    useWalletContext: () => ({
        connect: mocks.connect,
        disconnect: mocks.disconnect,
        isConnected: false,
        walletId: null,
    }),
}));

vi.mock("../../../features/wallet/presentation/hooks/useWalletAvailability", () => ({
    useWalletAvailability: () => ({ availability: {}, isLoading: false }),
}));

vi.mock("../../../features/wallet/config/wallet-options", () => ({
    walletOptions: [
        { id: "freighter-id", name: "Freighter", icon: "/freighter.png", description: "", url: "https://freighter.app", enabled: true },
        { id: "lobstr-id", name: "LOBSTR", icon: "/lobstr.png", description: "", url: "https://lobstr.co", enabled: true },
    ],
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mocks.push }),
}));

describe("ConnectWalletModal", () => {
    beforeEach(() => {
        mocks.connect.mockReset();
        mocks.push.mockReset();
        mocks.connect.mockImplementation(() => new Promise(() => {}));
        document.body.innerHTML = "";
    });

    it("renders a dialog labelled Connect Your Wallet when open", () => {
        render(<ConnectWalletModal isOpen onClose={vi.fn()} />);

        const dialog = screen.getByRole("dialog", { name: "Connect Your Wallet" });
        expect(dialog.getAttribute("aria-modal")).toBe("true");
        expect(within(dialog).getByText(/separate transaction signature approves a payment/i)).toBeTruthy();
        expect(within(dialog).getByText(/never asks for your secret or recovery phrase/i)).toBeTruthy();
    });

    it("renders nothing when closed", () => {
        const { container } = render(<ConnectWalletModal isOpen={false} onClose={vi.fn()} />);

        expect(container.children.length).toBe(0);
    });

    it("makes wallet options and the waitlist keyboard-accessible buttons", () => {
        render(<ConnectWalletModal isOpen onClose={vi.fn()} />);

        const dialog = screen.getByRole("dialog");
        expect(within(dialog).getByRole("button", { name: /join the waitlist/i })).toBeTruthy();
        expect(within(dialog).getByRole("button", { name: /freighter/i })).toBeTruthy();
        expect(within(dialog).getByRole("button", { name: /lobstr/i })).toBeTruthy();
        expect(document.activeElement).toBe(within(dialog).getAllByRole("button")[0]);
    });

    it("connects to the selected wallet and shows the connecting state", () => {
        render(<ConnectWalletModal isOpen onClose={vi.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: /freighter/i }));

        expect(mocks.connect).toHaveBeenCalledWith("freighter-id");
        expect(screen.getByRole("dialog", { name: /connecting to freighter/i })).toBeTruthy();
    });

    it("shows the failed state on connection error and Try Again returns to select", async () => {
        mocks.connect.mockRejectedValueOnce(new Error("Connection request was rejected."));
        render(<ConnectWalletModal isOpen onClose={vi.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: /freighter/i }));

        await waitFor(() =>
            expect(screen.getByRole("dialog", { name: "Connection Failed" })).toBeTruthy(),
        );

        fireEvent.click(screen.getByRole("button", { name: /try again/i }));

        await waitFor(() =>
            expect(screen.getByRole("dialog", { name: "Connect Your Wallet" })).toBeTruthy(),
        );
    });

    it("navigates to the waitlist from the Join the Waitlist button", () => {
        const onClose = vi.fn();
        render(<ConnectWalletModal isOpen onClose={onClose} />);

        fireEvent.click(screen.getByRole("button", { name: /join the waitlist/i }));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(mocks.push).toHaveBeenCalledWith("/register");
    });

    it("closes via Escape and restores focus to the trigger", () => {
        const onClose = vi.fn();
        const trigger = document.createElement("button");
        trigger.textContent = "Connect Wallet";
        document.body.appendChild(trigger);
        trigger.focus();

        render(<ConnectWalletModal isOpen onClose={onClose} />);

        fireEvent.keyDown(document.activeElement as Element, { key: "Escape" });

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(document.activeElement).toBe(trigger);
    });
});
