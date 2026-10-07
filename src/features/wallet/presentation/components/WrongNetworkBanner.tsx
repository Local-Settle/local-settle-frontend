"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useWalletContext } from "../context/WalletContext";

export function WrongNetworkBanner() {
    const {
        isConnected,
        isCorrectNetwork,
        expectedNetwork,
        currentNetwork,
        isCheckingNetwork,
        checkNetwork,
    } = useWalletContext();

    if (!isConnected || isCorrectNetwork) {
        return null;
    }

    const expectedCapitalized = expectedNetwork === "testnet" ? "Testnet" : "Mainnet";
    const currentCapitalized =
        currentNetwork === "unknown"
            ? "Unknown Network"
            : currentNetwork === "testnet"
            ? "Testnet"
            : "Mainnet";

    return (
        <div
            role="alert"
            aria-live="assertive"
            className="w-full bg-[#3B1219] border-b border-[#F87171]/40 text-[#FCA5A5] px-4 py-3 sticky top-0 z-[100] shadow-lg"
        >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-full bg-[#EF4444]/20 text-[#EF4444] shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-semibold text-white">
                            {currentNetwork === "unknown"
                                ? "Unable to verify the wallet network"
                                : "Wrong Stellar network detected"}
                        </p>
                        <p className="text-xs text-[#FCA5A5] mt-0.5">
                            {currentNetwork === "unknown"
                                ? "Unable to verify the wallet network. Reconnect your wallet and try again."
                                : `LocalSettle is currently running on ${expectedCapitalized} (detected: ${currentCapitalized}). Switch your wallet to ${expectedCapitalized} before continuing. Blockchain actions are temporarily disabled.`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => void checkNetwork()}
                        disabled={isCheckingNetwork}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-white text-xs font-medium border border-[#EF4444]/40 transition disabled:opacity-50 cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCheckingNetwork ? "animate-spin" : ""}`} />
                        {isCheckingNetwork ? "Checking..." : "Recheck Network"}
                    </button>
                </div>
            </div>
        </div>
    );
}
