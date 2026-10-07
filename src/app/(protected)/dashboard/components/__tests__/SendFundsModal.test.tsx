import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { SendFundsModal } from "../SendFundsModal";

const sendMocks = vi.hoisted(() => ({
    step: "form" as string,
}));

vi.mock("next/navigation", () => ({
    useSearchParams: () => ({ get: () => null }),
}));

vi.mock("@/features/notifications", () => ({
    useNotifications: () => ({
        notify: vi.fn(),
        dismiss: vi.fn(),
        dismissAll: vi.fn(),
    }),
}));

vi.mock("@/features/wallet", () => ({
    useWallet: () => ({ publicKey: "GTRAPTRIGGER" }),
    useWalletBalance: () => ({
        balances: [
            { asset_type: "credit_alphanum4", asset_code: "USDC", asset_issuer: null, balance: "100.00" },
        ],
    }),
}));

vi.mock("@/features/wallet/presentation/hooks/useSend", () => ({
    useSend: () => ({
        state: {
            step: sendMocks.step,
            recipient: null,
            fee: null,
            txHash: null,
            errorMessage: null,
        },
        resolveAndPrepare: vi.fn(),
        confirmSend: vi.fn(),
        reset: vi.fn(),
        backToConfirm: vi.fn(),
    }),
}));

describe("SendFundsModal", () => {
    beforeEach(() => {
        sendMocks.step = "form";
        document.body.innerHTML = "";
    });

    it("renders a dialog with the Send Funds heading as its accessible name", () => {
        render(<SendFundsModal onClose={vi.fn()} />);

        expect(screen.getByRole("dialog", { name: "Send Funds" })).toBeTruthy();
        expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBe("true");
    });

    it("moves initial focus to the recipient address input", () => {
        render(<SendFundsModal onClose={vi.fn()} />);

        const dialog = screen.getByRole("dialog");
        const recipientInput = within(dialog).getByPlaceholderText("alex.localsettle or GXXXXXX...");
        expect(document.activeElement).toBe(recipientInput);
    });

    it("wraps focus back to the close button when tabbing past the last control", () => {
        render(<SendFundsModal onClose={vi.fn()} />);

        const dialog = screen.getByRole("dialog");
        const focusableButtons = within(dialog).getAllByRole("button").filter(b => !b.hasAttribute("disabled"));
        const lastControl = focusableButtons[focusableButtons.length - 1];

        lastControl.focus();
        fireEvent.keyDown(lastControl, { key: "Tab" });

        expect(document.activeElement).toBe(within(dialog).getAllByRole("button")[0]);
    });

    it("closes via Escape and restores focus to the trigger", () => {
        const onClose = vi.fn();
        const trigger = document.createElement("button");
        trigger.textContent = "Open Send";
        document.body.appendChild(trigger);
        trigger.focus();

        render(<SendFundsModal onClose={onClose} />);

        fireEvent.keyDown(document.activeElement as Element, { key: "Escape" });

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(document.activeElement).toBe(trigger);
    });

    it("does not close via Escape while a transaction is in flight", () => {
        sendMocks.step = "loading";
        const onClose = vi.fn();

        render(<SendFundsModal onClose={onClose} />);

        fireEvent.keyDown(document.activeElement as Element, { key: "Escape" });
        expect(onClose).not.toHaveBeenCalled();
    });
});
