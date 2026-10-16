"use client";

import { useState } from "react";
import { useUser } from "@/features/user/presentation/context/UserContext";

const KYC_STATUS_GUIDANCE: Record<string, { label: string; guidance: string; action: string }> = {
    pending: { label: "Pending", guidance: "Verification has not started yet. Start the identity check to continue.", action: "Start verification" },
    in_progress: { label: "In progress", guidance: "Finish the identity check in the verification window, then return here.", action: "Continue verification" },
    in_review: { label: "In review", guidance: "Your documents are being reviewed. You can return later to check again.", action: "Check verification" },
    approved: { label: "Approved", guidance: "Your identity verification is approved.", action: "" },
    rejected: { label: "Rejected", guidance: "Your identity check was not approved. You can submit a new verification.", action: "Retry verification" },
    expired: { label: "Expired", guidance: "This verification session expired. Start a new one to continue.", action: "Restart verification" },
    abandoned: { label: "Not completed", guidance: "The verification session was not completed. You can start again when ready.", action: "Restart verification" },
};

export function KycBanner() {
    const { currentUser } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!currentUser || currentUser.kycStatus === "approved") {
        return null;
    }
    const status = KYC_STATUS_GUIDANCE[currentUser.kycStatus?.toLowerCase()] ?? {
        label: "Status unavailable",
        guidance: "We could not identify your verification status. Refresh your account or contact support.",
        action: "Refresh status",
    };

    const handleStartKyc = async () => {
        if (!currentUser.userId) return;
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/kyc/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId: currentUser.userId }),
            });

            if (!res.ok) {
                throw new Error("Failed to initialize KYC verification");
            }

            const data = await res.json();
            if (data?.sessionUrl) {
                window.open(data.sessionUrl, "_blank", "noopener,noreferrer");
                setIsLoading(false);
            } else {
                throw new Error("No verification URL returned");
            }
        } catch (err: unknown) {
            console.error("KYC start error:", err);
            setError(err instanceof Error ? err.message : "Something went wrong starting KYC.");
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[1136px] flex items-center justify-between bg-[#3a2a0a] border border-[#f7931a] rounded-2xl p-4 mb-6 text-white shadow-lg">
            <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0">⚠️</span>
                <div>
                    <p className="font-bold text-sm text-[#f7931a] uppercase tracking-wide">Verification: {status.label}</p>
                    <p className="text-xs text-gray-300">{status.guidance}</p>
                    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                </div>
            </div>
            <button
                onClick={handleStartKyc}
                disabled={isLoading}
                className="shrink-0 bg-[#f7931a] hover:bg-[#fca130] text-black font-bold text-xs uppercase px-5 py-3 rounded-xl transition-all duration-200 whitespace-nowrap disabled:opacity-50"
            >
                {isLoading ? "Opening tab..." : `${status.action} →`}
            </button>
        </div>
    );
}
