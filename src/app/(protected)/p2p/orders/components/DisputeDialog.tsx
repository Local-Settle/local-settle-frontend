"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";

const REASONS = ["Payment not received", "Incorrect payment", "Evidence concern", "Other"] as const;

export function DisputeDialog({ orderId, onClose, onSubmitted }: { orderId: string; onClose: () => void; onSubmitted: () => void }) {
    const [reason, setReason] = useState<string>("");
    const [details, setDetails] = useState("");
    const [evidenceUrl, setEvidenceUrl] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        const note = details.trim();
        if (!REASONS.includes(reason as typeof REASONS[number]) || note.length < 10 || note.length > 2000) {
            setError("Choose a reason and provide 10–2,000 characters of context.");
            return;
        }
        if (evidenceUrl.trim()) {
            try {
                const url = new URL(evidenceUrl.trim());
                if (url.protocol !== "https:") throw new Error();
            } catch {
                setError("Evidence must be a valid HTTPS link.");
                return;
            }
        }
        setSubmitting(true);
        setError("");
        try {
            await apiFetch(`/orders/${encodeURIComponent(orderId)}/disputes`, {
                method: "POST",
                body: { reason, details: note, evidenceUrl: evidenceUrl.trim() || undefined },
            });
            onSubmitted();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not submit the dispute. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation">
        <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="dispute-title" className="w-full max-w-lg space-y-4 rounded-xl border border-[#263949] bg-[#0D1D2C] p-6 text-white">
            <h2 id="dispute-title" className="text-lg font-bold">Open a trade dispute</h2>
            <p className="text-sm text-[#C2C7D0]">This sends your context to support. Funds remain in escrow; this does not resolve or change the on-chain escrow.</p>
            <label className="block text-sm">Reason
                <select required value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded border border-[#52616d] bg-[#081521] p-2">
                    <option value="">Select a reason</option>{REASONS.map((item) => <option key={item}>{item}</option>)}
                </select>
            </label>
            <label className="block text-sm">What happened?
                <textarea required minLength={10} maxLength={2000} value={details} onChange={(event) => setDetails(event.target.value)} className="mt-1 min-h-28 w-full rounded border border-[#52616d] bg-[#081521] p-2" />
            </label>
            <label className="block text-sm">Evidence link (optional)
                <input type="url" inputMode="url" value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="https://…" className="mt-1 w-full rounded border border-[#52616d] bg-[#081521] p-2" />
            </label>
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded border border-[#52616d] px-4 py-2">Cancel</button><button type="submit" disabled={submitting} className="rounded bg-[#55D6BE] px-4 py-2 font-bold text-[#081521] disabled:opacity-50">{submitting ? "Submitting…" : "Submit dispute"}</button></div>
        </form>
    </div>;
}
