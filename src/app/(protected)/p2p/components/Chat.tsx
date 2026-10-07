"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { User, MoreVertical, SendHorizontal, Paperclip } from "lucide-react";
import { useUser } from "@/features/user/presentation/context/UserContext";
import { useNotifications } from "@/features/notifications";
import { useChatSocket } from "@/features/chat/hooks/useChatSocket";
import { Message } from "@/features/chat/models/message";
import { ChatError } from "@/features/chat/types/chat-events.types";
import { DEMO_MODE } from "@/config/demo-mode";
import {
    initialMockMessages,
    createDemoUserMessage,
    createDemoSellerReply,
    demoReplyFor,
} from "./chat-demo";

type ChatProps = {
    orderId: string;
    chatName?: string;
    counterpartyProfileImageUrl?: string;
};

export const Chat = ({ orderId, chatName = "Merchant Chat", counterpartyProfileImageUrl }: ChatProps) => {
    const { currentUser, accessToken } = useUser();
    const { notify } = useNotifications();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [isCounterpartyTyping, setIsCounterpartyTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Demo chat is only reachable when the demo flag is on; otherwise mock ids
    // fall through to the real chat flow (which loads from the backend).
    const isDemo = DEMO_MODE && (orderId === "demo" || orderId.startsWith("mock-"));

    // Scroll bottom helper
    const scrollToBottom = useCallback((behavior: "smooth" | "auto" = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, []);

    const mergeMessages = useCallback((incoming: Message | Message[]) => {
        const additions = Array.isArray(incoming) ? incoming : [incoming];
        setMessages((previous) => {
            const byId = new Map(previous.map((message) => [message.messageId, message]));
            for (const message of additions) {
                if (message.orderId !== orderId) continue;
                if (message.clientMessageId) {
                    byId.delete(`optimistic:${message.clientMessageId}`);
                }
                byId.set(message.messageId, {
                    ...message,
                    deliveryStatus: message.deliveryStatus ?? "delivered",
                });
            }
            return Array.from(byId.values()).sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
            );
        });
        setTimeout(() => scrollToBottom("smooth"), 50);
    }, [orderId, scrollToBottom]);

    const handleSocketError = useCallback((error: ChatError) => {
        notify("error", error.message);
    }, [notify]);

    const handleIncomingMessage = useCallback(
        (message: Message) => {
            mergeMessages(message);
            if (currentUser && message.senderId !== currentUser.userId) {
                notify({
                    type: "info",
                    title: "New message received",
                    message: message.content,
                    dedupeKey: `chat-message:${message.messageId}`,
                });
            }
        },
        [currentUser, mergeMessages, notify],
    );

    const { status: connectionStatus, sendMessage } = useChatSocket({
        orderId,
        accessToken,
        enabled: Boolean(currentUser && accessToken && historyLoaded && !isDemo),
        onMessage: handleIncomingMessage,
        onError: handleSocketError,
    });

    // Load initial messages
    useEffect(() => {
        if (!currentUser) return;

        let cancelled = false;
        queueMicrotask(() => {
            if (cancelled) return;
            setMessages(isDemo ? initialMockMessages(orderId, currentUser.userId) : []);
            setHistoryLoaded(isDemo);
            if (isDemo) setTimeout(() => scrollToBottom("auto"), 100);
        });

        if (!isDemo) {
            const loadHistory = async () => {
                try {
                    const headers: Record<string, string> = {};
                    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/chat-messages?orderId=${encodeURIComponent(orderId)}`,
                        { headers },
                    );
                    if (!response.ok) throw new Error("Unable to load chat history.");
                    const history: Message[] = await response.json();
                    if (!cancelled) {
                        mergeMessages(history);
                        setHistoryLoaded(true);
                    }
                } catch (error) {
                    if (!cancelled) {
                        notify("error", error instanceof Error ? error.message : "Unable to load chat history.");
                        // History failure should not prevent live messages from working.
                        setHistoryLoaded(true);
                    }
                }
            };
            void loadHistory();
        }

        return () => {
            cancelled = true;
        };
    }, [orderId, currentUser, accessToken, isDemo, mergeMessages, notify, scrollToBottom]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputText.trim() || !currentUser || isSending) return;
        if (!isDemo && connectionStatus !== "connected") return;

        const currentText = inputText.trim();
        setIsSending(true);

        if (isDemo) {
            // Add user message to demo state
            setMessages(prev => [...prev, createDemoUserMessage(
                orderId,
                currentUser.userId,
                currentUser.alias || "Buyer",
                currentText,
            )]);
            setInputText("");
            setTimeout(() => scrollToBottom("smooth"), 50);
            setIsSending(false);

            // Simulate counterparty smart response after 1.5 seconds
            setIsCounterpartyTyping(true);
            setTimeout(() => {
                setIsCounterpartyTyping(false);
                setMessages(prev => [...prev, createDemoSellerReply(orderId, demoReplyFor(currentText))]);
                setTimeout(() => scrollToBottom("smooth"), 50);
            }, 1800);

        } else {
            const clientMessageId = crypto.randomUUID();
            const optimisticId = `optimistic:${clientMessageId}`;
            mergeMessages({
                messageId: optimisticId,
                clientMessageId,
                orderId,
                senderId: currentUser.userId,
                content: currentText,
                timestamp: new Date().toISOString(),
                deliveryStatus: "sending",
            });
            setInputText("");

            try {
                const created = await sendMessage(currentText, clientMessageId);
                mergeMessages(created);
            } catch (error) {
                setMessages((previous) => previous.map((message) =>
                    message.messageId === optimisticId
                        ? { ...message, deliveryStatus: "failed" }
                        : message,
                ));
                notify("error", error instanceof Error ? error.message : "Message could not be sent.");
            } finally {
                setIsSending(false);
            }
        }
    };

    const connectionLabel = isDemo
        ? "Demo chat"
        : ({
            connected: "Live",
            connecting: "Connecting…",
            reconnecting: "Reconnecting…",
            disconnected: "Disconnected",
            "authentication-failed": "Authentication failed",
            unauthorized: "Chat access denied",
        } as const)[connectionStatus];
    const canSend = Boolean(
        inputText.trim() && !isSending && currentUser && (isDemo || connectionStatus === "connected"),
    );

    return (
        <div className="w-full h-full bg-[#0D1D2C] flex flex-col overflow-hidden shrink-0 font-space select-none">
            {/* Header */}
            <header className="h-[64px] border-b border-[rgba(69,73,50,0.1)] px-[24px] flex items-center justify-between shrink-0 bg-[#0D1D2C]">
                <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 bg-[#35343A] rounded-full flex items-center justify-center border border-white/[0.04] shrink-0 overflow-hidden">
                        {counterpartyProfileImageUrl ? (
                            <img src={counterpartyProfileImageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-4 h-4 text-white" />
                        )}
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#55D6BE] border border-[#0D1D2C]" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-white font-bold text-[14px] leading-5 font-space">
                            {chatName}
                        </p>
                        <p className={`text-[10px] font-bold leading-[15px] tracking-[0.5px] uppercase ${
                            isDemo || connectionStatus === "connected" ? "text-[#55D6BE]" : "text-amber-400"
                        }`}>
                            {connectionLabel}
                        </p>
                    </div>
                </div>
                <button className="text-[#9BABB7] hover:text-white cursor-pointer px-1">
                    <MoreVertical className="w-5 h-5 text-[#9BABB7]" />
                </button>
            </header>
            
            {/* Chat Messages Body */}
            <main role="log" aria-live="polite" aria-label="Chat messages" className="flex-grow overflow-y-auto p-6 space-y-5 bg-[#0D1D2C]/10 scrollbar-thin flex flex-col">
                {/* Order Created status banner */}
                <section className="flex items-center justify-center my-2 shrink-0">
                    <div className="bg-[#11212E] px-4 py-1.5 flex items-center justify-center rounded-full border border-[rgba(69,73,50,0.2)]">
                        <p className="uppercase text-[9px] text-[#9BABB7] font-bold tracking-widest font-space">
                            ORDER CREATED - {orderId.substring(0, 8).toUpperCase()}
                        </p>
                    </div>
                </section>

                <div className="flex-grow space-y-5 flex flex-col justify-end">
                    {messages.map((msg) => {
                        const isOwnMessage = currentUser && msg.senderId === currentUser.userId;
                        const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                            <div
                                key={msg.messageId}
                                className={`flex flex-col gap-1.5 max-w-[85%] transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-2 ${
                                    isOwnMessage ? "items-end ml-auto" : "items-start"
                                }`}
                            >
                                <div
                                    className={`text-[12px] leading-relaxed p-[12px_16px] rounded-[12px] font-manrope ${
                                        isOwnMessage
                                            ? "bg-[#55D6BE] text-[#081521] font-semibold rounded-br-[4px]"
                                            : "bg-[#11212E] text-[#C2C7D0] font-medium rounded-bl-[4px] border border-white/[0.01]"
                                    }`}
                                >
                                    {msg.content}
                                </div>
                                <span className={`text-[9px] font-bold px-1 ${
                                    msg.deliveryStatus === "failed" ? "text-red-400" : "text-[#9BABB7]"
                                }`}>
                                    {timeStr} {isOwnMessage && (
                                        msg.deliveryStatus === "sending"
                                            ? "• Sending…"
                                            : msg.deliveryStatus === "failed"
                                                ? "• Failed"
                                                : "• Delivered"
                                    )}
                                </span>
                            </div>
                        );
                    })}

                    {/* Typing Indicator */}
                    {isCounterpartyTyping && (
                        <div role="status" aria-live="polite" className="flex flex-col items-start gap-1.5 max-w-[85%] transition-all duration-200">
                            <div className="bg-[#11212E] text-gray-400 text-[12px] p-[10px_16px] rounded-r-[12px] rounded-bl-[4px] border border-white/[0.01] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-[#55D6BE] rounded-full animate-bounce delay-75" />
                                <span className="w-1.5 h-1.5 bg-[#55D6BE] rounded-full animate-bounce delay-150" />
                                <span className="w-1.5 h-1.5 bg-[#55D6BE] rounded-full animate-bounce delay-300" />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </main>
            
            {/* Input message footer */}
            <form onSubmit={handleSend} className="h-[96px] bg-[#0D1D2C] border-t border-[rgba(69,73,50,0.1)] flex flex-col justify-center px-6 shrink-0 gap-1.5">
                <div className="relative flex items-center">
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        disabled={!isDemo && connectionStatus !== "connected"}
                        className="bg-[#081521] text-white w-full h-[44px] pl-4 pr-12 rounded-[8px] border border-[rgba(69,73,50,0.3)] focus:border-[#55D6BE]/50 focus:outline-none placeholder:text-[#9BABB7CC] text-[12px] font-semibold font-space" 
                        placeholder={connectionStatus === "connected" || isDemo ? "Type a message..." : connectionLabel}
                    />
                    <div className="absolute right-3 flex items-center gap-2">
                        <button type="submit" disabled={!canSend} className="text-[#55D6BE] hover:scale-105 transition-transform cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                            <SendHorizontal className="w-5 h-5 text-[#55D6BE]" />
                        </button>
                    </div>
                </div>
                
                {/* Options attachments bar */}
                <div className="flex items-center justify-between px-1 text-[10px] text-[#9BABB7] font-bold font-space uppercase tracking-wide">
                    <div className="flex items-center gap-3">
                        <button type="button" className="hover:text-white cursor-pointer transition-colors flex items-center gap-1">
                            <Paperclip className="w-3 h-3" /> Attach
                        </button>
                    </div>
                    <span className="normal-case tracking-normal text-[9px] font-medium text-[#9BABB7CC]">Press enter to send</span>
                </div>
            </form>
        </div>
    );
};
