export type OrderHistoryEventType =
    | 'created'
    | 'funded'
    | 'fiat_sent'
    | 'released'
    | 'cancelled'
    | 'disputed';

/** Public, participant-safe event shape returned by GET /orders/:id/history. */
export interface OrderHistoryEvent {
    eventType: OrderHistoryEventType;
    occurredAt: string;
    actorRole?: 'buyer' | 'seller' | 'system';
}
