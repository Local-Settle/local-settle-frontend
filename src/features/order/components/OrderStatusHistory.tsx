"use client";

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { OrderHistoryEvent, OrderHistoryEventType } from '../models/orderHistory';

const eventLabels: Record<OrderHistoryEventType, string> = {
    created: 'Order created',
    funded: 'Escrow funded',
    fiat_sent: 'Fiat payment marked as sent',
    released: 'Escrow released',
    cancelled: 'Order cancelled',
    disputed: 'Order disputed',
};

export function OrderStatusHistory({ orderId }: { orderId: string }) {
    const [events, setEvents] = useState<OrderHistoryEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadHistory = useCallback(async () => {
        setIsLoading(true);
        setError(false);
        try {
            const result = await apiFetch<OrderHistoryEvent[]>(`/orders/${orderId}/history`);
            setEvents(Array.isArray(result) ? result : []);
        } catch {
            setError(true);
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => { void loadHistory(); }, [loadHistory]);

    const chronologicalEvents = [...events]
        .filter(event => event && eventLabels[event.eventType] && !Number.isNaN(Date.parse(event.occurredAt)))
        .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));

    return (
        <section aria-labelledby="order-history-title" className="w-full rounded-xl border border-[#263949] bg-[#0D1D2C] p-5">
            <h3 id="order-history-title" className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Order status history</h3>
            {isLoading ? <p role="status" className="text-sm text-[#9BABB7]">Loading order history…</p> : null}
            {error ? (
                <div role="alert" className="flex items-center justify-between gap-3 text-sm text-[#C2C7D0]">
                    <span>Order history is temporarily unavailable.</span>
                    <button type="button" onClick={() => void loadHistory()} className="font-semibold text-[#55D6BE]">Retry</button>
                </div>
            ) : null}
            {!isLoading && !error && chronologicalEvents.length === 0 ? (
                <p className="text-sm text-[#9BABB7]">No status changes have been recorded yet.</p>
            ) : null}
            {chronologicalEvents.length > 0 ? (
                <ol className="space-y-4">
                    {chronologicalEvents.map((event, index) => (
                        <li key={`${event.eventType}-${event.occurredAt}-${index}`} className="flex items-start gap-3">
                            <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#55D6BE]" />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">{eventLabels[event.eventType]}</p>
                                <p className="text-xs text-[#9BABB7]">
                                    {event.actorRole ? `${event.actorRole === 'system' ? 'System' : event.actorRole === 'buyer' ? 'Buyer' : 'Seller'} · ` : ''}
                                    <time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString()}</time>
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            ) : null}
        </section>
    );
}
