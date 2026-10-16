const eventName = "chat-unread-changed";
const keyFor = (userId: string, orderId: string) => `chat-unread:${userId}:${orderId}`;

export function getUnreadMessageCount(userId: string, orderId: string): number {
    try {
        return JSON.parse(localStorage.getItem(keyFor(userId, orderId)) ?? "[]").length;
    } catch {
        return 0;
    }
}

export function recordUnreadMessage(userId: string, orderId: string, messageId: string): void {
    const key = keyFor(userId, orderId);
    let ids: string[] = [];
    try { ids = JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { /* reset corrupt local state */ }
    if (ids.includes(messageId)) return;
    localStorage.setItem(key, JSON.stringify([...ids, messageId]));
    window.dispatchEvent(new Event(eventName));
}

export function clearUnreadMessages(userId: string, orderId: string): void {
    localStorage.removeItem(keyFor(userId, orderId));
    window.dispatchEvent(new Event(eventName));
}

export function onUnreadMessagesChanged(listener: () => void): () => void {
    window.addEventListener(eventName, listener);
    window.addEventListener("storage", listener);
    return () => {
        window.removeEventListener(eventName, listener);
        window.removeEventListener("storage", listener);
    };
}
