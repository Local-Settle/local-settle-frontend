import { Message } from '../models/message';

export type ChatConnectionStatus =
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'disconnected'
    | 'authentication-failed'
    | 'unauthorized';

export interface ChatError {
    code: string;
    message: string;
    orderId?: string;
}

export interface ChatAck<T = undefined> {
    ok: boolean;
    data?: T;
    error?: ChatError;
}

export interface ServerToClientEvents {
    'message-created': (message: Message) => void;
    'message-read': (event: { orderId: string; messageId: string; readerId: string; readAt: string }) => void;
    'chat-error': (error: ChatError) => void;
    'user-joined': (event: { orderId: string; userId: string }) => void;
    'user-left': (event: { orderId: string; userId: string }) => void;
}

export interface ClientToServerEvents {
    'join-order': (
        payload: { orderId: string },
        acknowledgement: (response: ChatAck) => void,
    ) => void;
    'leave-order': (
        payload: { orderId: string },
        acknowledgement?: (response: ChatAck) => void,
    ) => void;
    'send-message': (
        payload: { orderId: string; content: string; clientMessageId: string },
        acknowledgement: (response: ChatAck<Message>) => void,
    ) => void;
    'mark-read': (
        payload: { orderId: string; messageId: string },
        acknowledgement: (response: ChatAck) => void,
    ) => void;
}
