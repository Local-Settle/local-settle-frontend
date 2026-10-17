import type { EscrowStatus, EscrowStatusEvent } from "../types/escrow-events.types";

export type EscrowParticipantRole = "buyer" | "seller";

export interface EscrowStatusPresentation {
    label: string;
    buyerAction: string;
    sellerAction: string;
}

export const ESCROW_STATUS_PRESENTATION: Record<EscrowStatus, EscrowStatusPresentation> = {
    pending: { label: "Pending", buyerAction: "Review the trade details.", sellerAction: "Wait for the buyer to fund escrow." },
    initialized: { label: "Escrow initialized", buyerAction: "Fund the escrow to continue.", sellerAction: "Wait for escrow funding." },
    funded: { label: "USDC secured", buyerAction: "Send the agreed local payment.", sellerAction: "Wait for the buyer's payment." },
    fiat_sent: { label: "Payment reported", buyerAction: "Wait for the seller to confirm receipt.", sellerAction: "Confirm receipt before releasing USDC." },
    released: { label: "Completed", buyerAction: "The USDC has been released.", sellerAction: "The trade is complete." },
    disputed: { label: "Under review", buyerAction: "Follow the dispute instructions.", sellerAction: "Follow the dispute instructions." },
    resolved: { label: "Resolved", buyerAction: "Check the dispute resolution details.", sellerAction: "Check the dispute resolution details." },
};

export function getEscrowStatusPresentation(status: string, role: EscrowParticipantRole): { label: string; action: string } {
    const presentation = ESCROW_STATUS_PRESENTATION[status as EscrowStatus];
    if (!presentation) return { label: "Unknown status", action: "Refresh the order or contact support." };
    return { label: presentation.label, action: role === "buyer" ? presentation.buyerAction : presentation.sellerAction };
}

/**
 * Escrow statuses that represent a final / resolved state.
 * Once the escrow reaches one of these, real-time sync should stop.
 */
export const TERMINAL_ESCROW_STATUSES: readonly EscrowStatus[] = [
    "released",
    "resolved",
];

/**
 * Returns true when the given status is terminal and no further
 * automatic sync is needed.
 */
export function isTerminalStatus(status: EscrowStatus): boolean {
    return TERMINAL_ESCROW_STATUSES.includes(status);
}

/**
 * Build a deduplication key from an incoming event.
 *
 * Priority: eventId (if the backend provides one) > composite key of
 * status + transactionHash + updatedAt.
 *
 * This key is shared across both WebSocket and polling sources so that
 * a poll racing a socket event can never double-transition the UI.
 */
export function deduplicationKey(event: EscrowStatusEvent): string {
    if (event.eventId) return `evt:${event.eventId}`;
    const hash = event.transactionHash ?? "";
    return `sha:${event.status}:${hash}:${event.updatedAt}`;
}

/**
 * Recommended polling interval in milliseconds while the escrow is active.
 * 7 seconds — avoids 1-second spam while still feeling responsive.
 */
export const POLL_INTERVAL_MS = 7_000;

/**
 * Calculate the next poll delay in ms. If the browser tab was hidden and
 * just became visible again the caller should poll immediately; this
 * function is for the steady-state interval.
 */
export function nextPollDelay(): number {
    return POLL_INTERVAL_MS;
}
