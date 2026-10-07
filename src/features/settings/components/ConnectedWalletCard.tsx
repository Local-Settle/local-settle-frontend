"use client";

import { useState } from "react";
import { Wallet, Copy, Check, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { useWalletContext } from "@/features/wallet/presentation/context/WalletContext";

export function ConnectedWalletCard() {
    const { publicKey, walletId, isConnected } = useWalletContext();
    const [copied, setCopied] = useState(false);
    const [showFullAddress, setShowFullAddress] = useState(false);

    const handleCopy = async () => {
        if (!publicKey) return;
        try {
            await navigator.clipboard.writeText(publicKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback if clipboard API is not available
        }
    };

    const shortenedAddress = publicKey
        ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`
        : "";

    return (
        <div className="rounded-xl border border-[#172B3A] bg-[#0E121B]/60 p-6 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#172B3A] pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#55D6BE]/10 text-[#55D6BE]">
                        <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-[17px] font-semibold text-white">Connected Wallet</h2>
                        <p className="text-xs text-[#9BABB7]">
                            Stellar account managing your on-chain assets and escrows
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isConnected && publicKey ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10B981]/15 px-3 py-1 text-xs font-medium text-[#10B981]">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Connected
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F59E0B]/15 px-3 py-1 text-xs font-medium text-[#F59E0B]">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Not Connected
                        </span>
                    )}
                </div>
            </div>

            <div className="pt-5">
                {isConnected && publicKey ? (
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs font-medium text-[#9BABB7]">Stellar Public Key</span>
                            <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#172B3A] bg-[#081521] p-3.5">
                                <div className="font-mono text-sm text-white break-all select-all">
                                    {showFullAddress ? publicKey : shortenedAddress}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setShowFullAddress((prev) => !prev)}
                                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#9BABB7] hover:bg-[#172B3A] hover:text-white transition cursor-pointer"
                                        aria-label={showFullAddress ? "Hide full address" : "View full address"}
                                    >
                                        {showFullAddress ? (
                                            <>
                                                <EyeOff className="h-3.5 w-3.5" />
                                                Hide
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="h-3.5 w-3.5" />
                                                Full Key
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="inline-flex items-center gap-1 rounded-md bg-[#55D6BE]/15 px-3 py-1.5 text-xs font-medium text-[#55D6BE] hover:bg-[#55D6BE]/25 transition cursor-pointer"
                                        aria-label="Copy wallet address"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="h-3.5 w-3.5" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-3.5 w-3.5" />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {walletId && (
                            <div className="text-xs text-[#9BABB7]">
                                Wallet Provider: <span className="font-medium text-white capitalize">{walletId}</span>
                            </div>
                        )}

                        <div className="rounded-lg bg-[#55D6BE]/5 border border-[#55D6BE]/10 p-3 text-xs text-[#9BABB7]">
                            🔒 <strong className="text-white">Security Note:</strong> Your connected wallet keeps its own private keys. The platform also uses a separately configured operator key for escrow deployment.
                        </div>
                    </div>
                ) : (
                    <div className="py-6 text-center text-sm text-[#9BABB7]">
                        No Stellar wallet is currently connected.
                    </div>
                )}
            </div>
        </div>
    );
}
