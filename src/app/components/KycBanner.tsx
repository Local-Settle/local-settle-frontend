"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/features/user/presentation/context/UserContext";

export function KycBanner() {
    const { currentUser } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [returningFromKyc, setReturningFromKyc] = useState(false);

    useEffect(() => {
        const refreshAfterProviderReturn = () => {
            if (sessionStorage.getItem("kyc-return-pending") !== "true") return;
            sessionStorage.removeItem("kyc-return-pending");
            setReturningFromKyc(true);
            // Re-fetch the account from the backend; provider URL parameters are never proof of approval.
            window.location.reload();
        };
        window.addEventListener("focus", refreshAfterProviderReturn);
        return () => window.removeEventListener("focus", refreshAfterProviderReturn);
    }, []);

    if (!currentUser || currentUser.kycStatus === "approved") {
        return null;
    }

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
                sessionStorage.setItem("kyc-return-pending", "true");
                const providerWindow = window.open(data.sessionUrl, "_blank", "noopener,noreferrer");
                if (!providerWindow) sessionStorage.removeItem("kyc-return-pending");
                setIsLoading(false);
            } else {
                throw new Error("No verification URL returned");
            }
        } catch (err: unknown) {
            sessionStorage.removeItem("kyc-return-pending");
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
                    <p className="font-bold text-sm text-[#f7931a] uppercase tracking-wide">Verification Required</p>
                    <p className="text-xs text-gray-300">
                        Your account status is currently <span className="font-semibold text-white uppercase">{currentUser.kycStatus}</span>. 
                        Complete KYC verification with Didit to unlock trading and offer creation.
                    </p>
                    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                </div>
            </div>
            <button
                onClick={handleStartKyc}
                disabled={isLoading}
                className="shrink-0 bg-[#f7931a] hover:bg-[#fca130] text-black font-bold text-xs uppercase px-5 py-3 rounded-xl transition-all duration-200 whitespace-nowrap disabled:opacity-50"
            >
                {isLoading ? "Opening tab..." : "Verify Now →"}
            </button>
        </div>
    );
}
