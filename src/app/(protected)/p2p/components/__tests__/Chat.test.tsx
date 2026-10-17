import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, act, within } from "@testing-library/react";
import { Chat } from "../Chat";
import { NotificationProvider } from "@/features/notifications/context/NotificationContext";
import type { Message } from "@/features/chat/models/message";

const { onMessageCapture, mockSendMessage, currentUser } = vi.hoisted(() => ({
    onMessageCapture: { current: null as null | ((message: Message) => void) },
    mockSendMessage: vi.fn(),
    currentUser: {
        userId: "buyer-1",
        alias: "Buyer",
        publicKey: "G_BUYER_KEY",
        kycStatus: "approved",
        notificationsEnabled: false,
        pendingAccountInfo: false,
        totalVolume: "0",
        createdAt: "2026-01-01T00:00:00.000Z",
    },
}));

vi.mock("@/features/chat/hooks/useChatSocket", () => ({
    useChatSocket: (options: { onMessage: (message: Message) => void }) => {
        onMessageCapture.current = options.onMessage;
        return { status: "connected", sendMessage: mockSendMessage };
    },
}));

vi.mock("@/features/user/presentation/context/UserContext", () => ({
    useUser: () => ({
        currentUser,
        accessToken: "token",
        logout: vi.fn(),
        setCurrentUser: vi.fn(),
        setAccessToken: vi.fn(),
    }),
}));

function incomingMessage(overrides: Partial<Message> = {}): Message {
    return {
        messageId: "live-msg-1",
        orderId: "order-1",
        senderId: "seller-2",
        content: "Payment received!",
        timestamp: new Date().toISOString(),
        senderAlias: "Seller",
        ...overrides,
    };
}

describe("Chat real-time notifications", () => {
    beforeAll(() => {
        Element.prototype.scrollIntoView = vi.fn();
    });

    beforeEach(() => {
        onMessageCapture.current = null;
        mockSendMessage.mockReset();

        global.fetch = vi.fn(async () =>
            new Response(JSON.stringify([]), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        ) as unknown as typeof fetch;
    });

    function renderChat() {
        return render(
            <NotificationProvider>
                <Chat orderId="order-1" />
            </NotificationProvider>,
        );
    }

    it("creates a notification when a real-time chat message is received", async () => {
        renderChat();

        expect(screen.getByRole("complementary", { name: "Message policy" }).textContent)
            .toContain("Sent messages are currently immutable");

        await act(async () => {
            onMessageCapture.current?.(incomingMessage());
        });

        const toast = await screen.findByRole("status");
        expect(within(toast).getByText("New message received")).toBeDefined();
        expect(within(toast).getByText("Payment received!")).toBeDefined();
    });

    it("does not notify the current user for their own message", async () => {
        renderChat();

        await act(async () => {
            onMessageCapture.current?.(
                incomingMessage({
                    messageId: "own-msg-1",
                    senderId: "buyer-1",
                    senderAlias: "Buyer",
                    content: "Hello from me",
                }),
            );
        });

        expect(screen.queryByRole("status")).toBeNull();
        expect(screen.queryByText("New message received")).toBeNull();
    });

    it("does not duplicate toasts for repeated real-time events", async () => {
        renderChat();

        const message = incomingMessage();
        await act(async () => {
            onMessageCapture.current?.(message);
        });
        await act(async () => {
            onMessageCapture.current?.(message);
        });

        const toasts = screen.getAllByText("New message received");
        expect(toasts).toHaveLength(1);
    });
});
