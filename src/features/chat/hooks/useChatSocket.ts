import { useCallback, useEffect, useRef, useState } from 'react';
import { Message } from '../models/message';
import {
    ChatError,
    ChatConnectionStatus,
} from '../types/chat-events.types';
import {
    ChatSocket,
    createChatSocket,
} from '../services/chat-socket.service';

interface UseChatSocketOptions {
    orderId: string;
    accessToken: string | null;
    enabled: boolean;
    onMessage: (message: Message) => void;
    onMessageRead?: (event: { orderId: string; messageId: string; readerId: string; readAt: string }) => void;
    onError: (error: ChatError) => void;
}

function statusForError(error: ChatError): ChatConnectionStatus | null {
    if (error.code === 'INVALID_JWT') return 'authentication-failed';
    if (error.code === 'UNAUTHORIZED_ORDER_ACCESS') return 'unauthorized';
    return null;
}

export function useChatSocket({
    orderId,
    accessToken,
    enabled,
    onMessage,
    onMessageRead = () => {},
    onError,
}: UseChatSocketOptions) {
    const socketRef = useRef<ChatSocket | null>(null);
    const messageHandlerRef = useRef(onMessage);
    const errorHandlerRef = useRef(onError);
    const readHandlerRef = useRef(onMessageRead);
    const [status, setStatus] = useState<ChatConnectionStatus>('disconnected');

    useEffect(() => {
        messageHandlerRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        errorHandlerRef.current = onError;
    }, [onError]);

    useEffect(() => {
        readHandlerRef.current = onMessageRead;
    }, [onMessageRead]);

    useEffect(() => {
        if (!enabled || !accessToken) {
            return;
        }

        let active = true;
        const socket = createChatSocket(accessToken);
        let connectionErrorNotified = false;
        socketRef.current = socket;
        queueMicrotask(() => {
            if (active) setStatus('connecting');
        });

        const handleChatError = (error: ChatError) => {
            const errorStatus = statusForError(error);
            if (errorStatus) setStatus(errorStatus);
            errorHandlerRef.current(error);
        };

        const joinOrder = () => {
            socket.emit('join-order', { orderId }, (response) => {
                if (response.ok) {
                    setStatus('connected');
                    return;
                }
                if (response.error) {
                    const errorStatus = statusForError(response.error);
                    setStatus(errorStatus ?? 'disconnected');
                }
            });
        };

        socket.on('connect', () => {
            connectionErrorNotified = false;
            joinOrder();
        });
        socket.on('message-created', (message) => messageHandlerRef.current(message));
        socket.on('message-read', (event) => {
            if (event.orderId === orderId) readHandlerRef.current(event);
        });
        socket.on('chat-error', handleChatError);
        socket.on('disconnect', (reason) => {
            if (reason !== 'io client disconnect') setStatus('disconnected');
        });
        socket.on('connect_error', (error) => {
            const structuredError = (error as Error & { data?: ChatError }).data;
            if (structuredError) {
                handleChatError(structuredError);
                return;
            }
            setStatus('disconnected');
            if (!connectionErrorNotified) {
                connectionErrorNotified = true;
                errorHandlerRef.current({
                    code: 'CONNECTION_ERROR',
                    message: error.message || 'Unable to connect to real-time chat.',
                    orderId,
                });
            }
        });
        socket.io.on('reconnect_attempt', () => setStatus('reconnecting'));
        socket.connect();

        return () => {
            active = false;
            if (socket.connected) socket.emit('leave-order', { orderId });
            socket.removeAllListeners();
            socket.io.removeAllListeners();
            socket.disconnect();
            if (socketRef.current === socket) socketRef.current = null;
        };
    }, [accessToken, enabled, orderId]);

    const sendMessage = useCallback(
        (content: string, clientMessageId: string): Promise<Message> => {
            const socket = socketRef.current;
            if (!socket?.connected) {
                return Promise.reject(new Error('Chat is currently disconnected.'));
            }

            return new Promise((resolve, reject) => {
                const timeout = window.setTimeout(
                    () => reject(new Error('Message delivery timed out.')),
                    10_000,
                );

                socket.emit('send-message', { orderId, content, clientMessageId }, (response) => {
                    window.clearTimeout(timeout);
                    if (response.ok && response.data) resolve(response.data);
                    else reject(new Error(response.error?.message ?? 'Message could not be sent.'));
                });
            });
        },
        [orderId],
    );

    const markMessageRead = useCallback((messageId: string): Promise<void> => {
        const socket = socketRef.current;
        if (!socket?.connected) return Promise.reject(new Error('Chat is currently disconnected.'));
        return new Promise((resolve, reject) => {
            socket.emit('mark-read', { orderId, messageId }, (response) => {
                if (response.ok) resolve();
                else reject(new Error(response.error?.message ?? 'Read receipt could not be recorded.'));
            });
        });
    }, [orderId]);

    return {
        status: enabled && accessToken ? status : 'disconnected',
        sendMessage,
        markMessageRead,
    };
}
