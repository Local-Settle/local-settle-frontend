"use client";

import { useState } from "react";
import { useUser } from "@/features/user/presentation/context/UserContext";
import { apiFetch } from "@/lib/api";

type ReportReason = "scam" | "threats" | "harassment" | "other";

export function TradeSafetyControls({ orderId, counterpartyId }: { orderId: string; counterpartyId: string }) {
    const { currentUser } = useUser();
    const [isReporting, setIsReporting] = useState(false);
    const [reason, setReason] = useState<ReportReason>("scam");
    const [details, setDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reportMessage, setReportMessage] = useState<string | null>(null);
    const [isBlocking, setIsBlocking] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const request = (path: string, body: Record<string, string>) =>
        apiFetch<unknown>(path, { method: "POST", body, defaultError: "Request failed." });

    const submitReport = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!details.trim() || isSubmitting) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await request("/support/reports", {
                orderId,
                reportedUserId: counterpartyId,
                reason,
                details: details.trim(),
            });
            setReportMessage("Your private report was sent to support.");
            setIsReporting(false);
            setDetails("");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Unable to send the report.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const blockCounterparty = async () => {
        setIsBlocking(true);
        setError(null);
        try {
            await request("/users/me/blocked-users", { userId: counterpartyId });
            setBlocked(true);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Unable to block this user.");
        } finally {
            setIsBlocking(false);
        }
    };

    return (
        <section className="flex flex-wrap items-center gap-3 border-t border-[#172B3A] bg-[#0D1D2C] p-3" aria-label="Trade safety actions">
            <button type="button" onClick={() => { setError(null); setIsReporting(true); }} className="rounded-md border border-[#9BABB7]/30 px-3 py-2 text-xs font-semibold text-[#C2C7D0] hover:bg-white/5">
                Report conversation
            </button>
            <button type="button" onClick={() => void blockCounterparty()} disabled={blocked || isBlocking || !currentUser || !counterpartyId} className="rounded-md border border-red-400/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-400/10 disabled:opacity-60">
                {blocked ? "User blocked" : isBlocking ? "Blocking…" : "Block user"}
            </button>
            {blocked && <span role="status" className="text-xs text-[#9BABB7]">Chat safety setting updated. Escrow is unchanged.</span>}
            {reportMessage && <span role="status" className="text-xs text-[#9BABB7]">{reportMessage}</span>}
            {error && <span role="alert" className="w-full text-xs text-red-300">{error}</span>}

            {isReporting && (
                <div role="dialog" aria-modal="true" aria-labelledby="trade-report-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <form onSubmit={submitReport} className="w-full max-w-md space-y-4 rounded-xl border border-[#263949] bg-[#0D1D2C] p-5 shadow-xl">
                        <div>
                            <h2 id="trade-report-title" className="text-lg font-bold text-white">Report this conversation</h2>
                            <p className="mt-2 text-sm text-[#B8C5CE]">We send the order ID, selected reason, and your note privately to support. Chat history, payment details, and wallet keys are not included.</p>
                        </div>
                        <label className="block space-y-1 text-sm text-[#C2C7D0]">
                            Reason
                            <select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)} className="w-full rounded-md border border-[#263949] bg-[#081521] p-2 text-white">
                                <option value="scam">Scam or fraud</option>
                                <option value="threats">Threats</option>
                                <option value="harassment">Harassment</option>
                                <option value="other">Other</option>
                            </select>
                        </label>
                        <label className="block space-y-1 text-sm text-[#C2C7D0]">
                            What happened?
                            <textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={2000} required rows={4} className="w-full resize-y rounded-md border border-[#263949] bg-[#081521] p-2 text-white" />
                        </label>
                        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsReporting(false)} className="rounded-md px-3 py-2 text-sm text-[#B8C5CE]">Cancel</button>
                            <button type="submit" disabled={!details.trim() || isSubmitting || !currentUser || !counterpartyId} className="rounded-md bg-[#55D6BE] px-3 py-2 text-sm font-bold text-[#081521] disabled:opacity-50">{isSubmitting ? "Sending…" : "Send privately"}</button>
                        </div>
                    </form>
                </div>
            )}
        </section>
    );
}
