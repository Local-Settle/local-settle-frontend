"use client";

import { FormEvent, useState } from "react";
import type { Offer } from "@/features/offer/models/offer";
import type { UpdateOffer } from "@/features/offer/models/updateOffer";

export function EditOfferDialog({ offer, onSave, onClose }: { offer: Offer; onSave: (update: UpdateOffer) => Promise<unknown>; onClose: () => void }) {
    const [price, setPrice] = useState(offer.price);
    const [minAmount, setMinAmount] = useState(offer.minAmount);
    const [maxAmount, setMaxAmount] = useState(offer.maxAmount);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const changed = price !== offer.price || minAmount !== offer.minAmount || maxAmount !== offer.maxAmount;
    const fields = [
        { label: "Price", before: offer.price, value: price, onChange: setPrice },
        { label: "Minimum", before: offer.minAmount, value: minAmount, onChange: setMinAmount },
        { label: "Maximum", before: offer.maxAmount, value: maxAmount, onChange: setMaxAmount },
    ];

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!changed || ![price, minAmount, maxAmount].every((value) => Number.isFinite(Number(value)) && Number(value) > 0) || Number(minAmount) > Number(maxAmount)) {
            setError("Enter positive values and ensure the minimum is not greater than the maximum.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await onSave({ price, minAmount, maxAmount });
            onClose();
        } catch (err) {
            const status = (err as { status?: number }).status;
            setError(status === 409
                ? "This offer changed while you were editing it. Close this preview, reload the offer, and try again."
                : err instanceof Error ? err.message : "Offer could not be updated.");
        } finally {
            setSaving(false);
        }
    };

    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="edit-offer-title" className="w-full max-w-lg space-y-4 rounded-xl border border-[#263949] bg-[#0D1D2C] p-6 text-white">
            <h2 id="edit-offer-title" className="text-lg font-bold">Review offer changes</h2>
            <p className="text-sm text-[#C2C7D0]">Preview the new terms before saving. Existing orders keep the terms they accepted; only future orders use these changes.</p>
            {fields.map(({ label, before, value, onChange }) => <label key={label} className="block text-sm">{label}
                <div className="mt-1 grid grid-cols-2 gap-2"><span className="rounded bg-[#081521] p-2 text-[#9BABB7]">Current: {before}</span><input aria-label={`New ${label.toLowerCase()}`} type="number" min="0" step="any" value={value} onChange={(event) => onChange(event.target.value)} className="rounded border border-[#52616d] bg-[#081521] p-2" /></div>
            </label>)}
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded border border-[#52616d] px-4 py-2">Cancel</button><button type="submit" disabled={saving || !changed} className="rounded bg-[#55D6BE] px-4 py-2 font-bold text-[#081521] disabled:opacity-50">{saving ? "Saving…" : "Save offer"}</button></div>
        </form>
    </div>;
}
