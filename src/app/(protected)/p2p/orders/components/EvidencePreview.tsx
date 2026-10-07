"use client";

import { useState, useEffect } from "react";
import { useEscrows } from "@/features/escrow/hooks/useEscrows";
import { useOrders } from "@/features/order/hooks/useOrders";
import { isSignatureCancelled } from "@/features/wallet/application/wallet.service";
import { useSignatureCancellation } from "@/features/wallet/hooks/useSignatureCancellation";
import { CircleCheck, Loader2, Eye, Search } from "lucide-react";
import { SignatureCancelledModal } from "../../components/SignatureCancelledModal";
import { useNotifications } from "@/features/notifications";

export interface EvidencePreviewProps {
    orderId: string;
    escrowId?: string | null;
    escrowStatus: "pending" | "initialized" | "funded" | "fiat_sent" | "released" | "disputed" | "resolved";
    sellerAddress?: string | null;
    amount: number;
    expiresAt?: string;
    evidenceUrl?: string | null;
    onStatusChange: () => void;
    canCancel: boolean;
    isCancelling: boolean;
    onCancelOrder: () => void;
}

export function EvidencePreview({
    orderId,
    escrowId,
    escrowStatus,
    sellerAddress,
    amount,
    expiresAt,
    evidenceUrl,
    onStatusChange,
    canCancel,
    isCancelling,
    onCancelOrder
}: EvidencePreviewProps) {
    const { fundEscrow, releaseEscrow, syncEscrow } = useEscrows();
    const { updateOrder } = useOrders();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>("00:00");
    const [isExpired, setIsExpired] = useState(false);
    const [pendingAction, setPendingAction] = useState<"fund" | "release" | null>(null);
    const { notify } = useNotifications();
    const sig = useSignatureCancellation();

    useEffect(() => {
        if (!expiresAt) return;
        const target = new Date(expiresAt).getTime();
        
        const updateTimer = () => {
            const now = Date.now();
            const diff = target - now;
            if (diff <= 0) {
                setTimeLeft("00:00");
                setIsExpired(true);
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
                setIsExpired(false);
            }
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    const handleFundAction = async () => {
        if (isSubmitting || !sellerAddress || !escrowId){
            alert("Cannot fund escrow: missing required information.");
            console.warn("Fund action blocked due to missing data:", { sellerAddress, escrowId });
            return;
        } 
        console.log("Initiating escrow funding process for escrowId:", escrowId);
        setIsSubmitting(true);
        try {
            const res = await fundEscrow({ escrowId, signerAddress: sellerAddress, amount });
            const fundXdr = res.unsignedFundTransaction || res.unsignedTransaction;
            if (!fundXdr) throw new Error("Funding failed: no unsigned XDR returned");
            const signedXdr = await sig.sign(fundXdr);
            await syncEscrow({ escrowId, action: "fund", signedXdr });
            await updateOrder({ orderStatus: "locked" }, orderId);
            notify("success", "Escrow funded successfully on-chain!");
            onStatusChange();
        } catch (err: unknown) {
            if (isSignatureCancelled(err)) {
                setPendingAction("fund");
                return;
            }
            alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReleaseAction = async () => {
        if (isSubmitting || !sellerAddress || !escrowId) return;
        setIsSubmitting(true);
        try {
            const res = await releaseEscrow({ escrowId, releaseSigner: sellerAddress });
            const releaseXdr = res.unsignedFundTransaction || res.unsignedTransaction;
            if (!releaseXdr) throw new Error("Release failed: no unsigned XDR returned");
            
            const signedXdr = await sig.sign(releaseXdr);
            await syncEscrow({ escrowId, action: "release", signedXdr });
            await updateOrder({ orderStatus: "released" }, orderId);
            
            notify("success", "Crypto released successfully!");
            onStatusChange();
        } catch (err: unknown) {
            if (isSignatureCancelled(err)) {
                setPendingAction("release");
                return;
            }
            alert(`Error releasing crypto: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (!canCancel || isCancelling) return;
        onCancelOrder();
    };

    const handleSignatureRetry = async () => {
        if (!escrowId || !pendingAction) return;
        setIsSubmitting(true);
        try {
            const signedXdr = await sig.retry();
            if (pendingAction === "fund") {
                await syncEscrow({ escrowId, action: "fund", signedXdr });
                await updateOrder({ orderStatus: "locked" }, orderId);
                notify("success", "Escrow funded successfully on-chain!");
            } else {
                await syncEscrow({ escrowId, action: "release", signedXdr });
                await updateOrder({ orderStatus: "released" }, orderId);
                notify("success", "Crypto released successfully!");
            }
            setPendingAction(null);
            onStatusChange();
        } catch (err: unknown) {
            if (isSignatureCancelled(err)) {
                return;
            }
            alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
            setPendingAction(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignatureCancel = () => {
        sig.cancel();
        setPendingAction(null);
    };

    const isUnfunded = escrowStatus === "pending" || escrowStatus === "initialized";
    const isWaitingForBuyer = escrowStatus === "funded";
    const hasEvidence = escrowStatus === "fiat_sent" || escrowStatus === "released";

    return (
        <>
        <div className="bg-[#0D1D2C] w-full rounded-xl flex flex-col justify-between p-[12px_16px] gap-6 font-space shrink-0 select-none">
            
            {/* 1. Estilos Locales de Inyección para Animación Shimmer de lado a lado */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes sideToSide {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
                .animate-side-to-side {
                    animation: sideToSide 2s infinite ease-in-out;
                }
            `}} />

            {/* Minimalist Central Body View Area */}
            <div className="flex-1 flex flex-col justify-center items-center gap-4 shrink-0 min-h-0 w-full h-50">
                {isUnfunded && (
                    <div className="w-full flex flex-col items-center justify-center h-full border border-white/[0.02] bg-[#0D1D2C]/40 rounded-[12px] p-4 text-center">
                        <span className="text-3xl mb-2">🔒</span>
                        <p className="text-[15px] font-bold text-[#C2C7D0]">Escrow Contract Awaiting Funds</p>
                        <p className="text-[12px] text-[rgba(155,171,183,0.8)] mt-1 max-w-[240px]">
                            Lock your assets in escrow to establish a secure trading environment.
                        </p>
                    </div>
                )}

                {isWaitingForBuyer && (
                    <div className="w-full flex flex-col justify-center items-center h-full p-6">
                        <div className="flex flex-col items-center text-center gap-2 w-full">
                            <span className="text-2xl mb-1 opacity-70">📑</span>
                            <p className="text-[16px] font-bold text-[#FFFFFF] tracking-wide">No Evidence Uploaded</p>
                            <p className="text-[13px] text-[rgba(155,171,183,0.8)] font-medium max-w-[240px]">
                                Waiting for the buyer to upload a payment receipt.
                            </p>
                        </div>
                        
                        {/* Indeterminate Moving Loader Line */}
                        <div className="w-[200px] h-[3px] bg-[#11212E] rounded-full overflow-hidden relative mt-6">
                            <div className="absolute top-0 bottom-0 left-0 bg-[#55D6BE] rounded-full w-1/4 animate-side-to-side" />
                        </div>
                    </div>
                )}

                {hasEvidence && (() => {
                    const getFilenameFromUrl = (url: string | null | undefined) => {
                        if (!url) return "payment_receipt.pdf";
                        const parts = url.split("/");
                        const lastPart = parts[parts.length - 1];
                        try {
                            const decoded = decodeURIComponent(lastPart);
                            const match = decoded.match(/^\d+-(.+)$/);
                            return match ? match[1] : decoded;
                        } catch {
                            return lastPart;
                        }
                    };

                    const renderPreviewFile = () => {
                        if (!evidenceUrl) return <div className="text-white font-mono text-xs">NO FILE</div>;
                        const isPdfFile = evidenceUrl.toLowerCase().endsWith(".pdf");

                        if (isPdfFile) {
                            return (
                                <iframe 
                                    src={`${evidenceUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                                    className="w-full h-full border-0 pointer-events-none rounded-[8px]" 
                                />
                            );
                        }

                        return (
                            <img 
                                src={evidenceUrl} 
                                alt="Uploaded receipt preview" 
                                className="w-full h-full object-cover rounded-[8px]" 
                            />
                        );
                    };

                    return (
                        <div className="w-full h-full flex flex-col gap-4">
                            <button 
                                type="button" 
                                onClick={() => evidenceUrl && window.open(evidenceUrl, '_blank')}
                                disabled={!evidenceUrl}
                                className="bg-[#11212E] border border-white/[0.04] w-full h-[48px] text-[#55D6BE] font-bold text-[16px] leading-[24px] rounded-[12px] uppercase flex items-center justify-center gap-2 tracking-[-0.4px] hover:bg-white/[0.04] transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                <Eye className="w-4.5 h-4.5 stroke-[2.5px]" /> VIEW RECEIPT
                            </button>

                            <div className="border border-white/[0.05] bg-[#0D1D2C] w-full h-[214.5px] rounded-[12px] flex flex-col items-center justify-between p-6 select-none shadow-[inset_0_0_12px_rgba(218,255,0,0.05)] transition-all duration-300 relative">
                                <div className="w-full flex items-center justify-between border-b border-[rgba(218,255,0,0.1)] pb-3">
                                    <span className="text-[10px] text-[#64748B] font-bold tracking-[1px] uppercase font-space">
                                        EVIDENCE RECEIVED
                                    </span>
                                    <span className="text-[9px] text-[#55D6BE] bg-[#55D6BE]/10 border border-[#55D6BE]/20 font-black p-[2px_8px] rounded-full uppercase tracking-wider font-space">
                                        Verified
                                    </span>
                                </div>
                                
                                <div className="flex flex-row items-center gap-4 my-auto w-full px-2">
                                    <div 
                                        onClick={() => evidenceUrl && window.open(evidenceUrl, '_blank')}
                                        className="w-[80px] h-[100px] relative rounded-[8px] bg-[#0D1D2C] overflow-hidden border border-white/[0.08] shadow-md flex items-center justify-center group cursor-pointer shrink-0"
                                    >
                                        {renderPreviewFile()}
                                        <div className="absolute bottom-1 right-1 bg-black/70 rounded-full p-1 border border-white/20">
                                            <Search className="w-3 h-3 text-white stroke-[2.5px]" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 min-w-0 font-space">
                                        <p className="text-[14px] font-black text-[#D7E0E6] truncate max-w-[160px]">
                                            {getFilenameFromUrl(evidenceUrl)}
                                        </p>
                                        <p className="text-[10px] text-[#55D6BE] font-bold tracking-wider uppercase">
                                            SECURED ON-CHAIN
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="w-full flex justify-between text-[10px] text-[#64748B] font-semibold border-t border-[rgba(218,255,0,0.05)] pt-3 font-space">
                                    <span>TX REF: IK-9821-B</span>
                                    <span>METHOD: SEPA BANK</span>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Action Buttons Footer Block */}
            <div className="flex flex-col gap-3 shrink-0">
                {isUnfunded ? (
                    <button 
                        type="button" 
                        onClick={handleFundAction}
                        disabled={isSubmitting}
                        className="bg-[#55D6BE] w-full h-[56px] text-[#081521] font-extrabold text-[16px] leading-[24px] rounded-[12px] hover:bg-[#dcff15] hover:cursor-pointer uppercase transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 tracking-[-0.4px]"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 text-[#081521] animate-spin" /> : <CircleCheck className="w-5 h-5 text-[#081521] stroke-[3px]" />}
                        {isSubmitting ? "PROCESSING..." : "FUND ESCROW"}
                    </button>
                ) : isWaitingForBuyer ? (
                    isExpired ? (
                        <div role="status" className="bg-[#11212E] border border-red-500/50 w-full h-[56px] rounded-[12px] flex items-center justify-center">
                            <span className="text-red-500 font-bold text-[16px] leading-[24px] uppercase tracking-[-0.4px]">EXPIRED</span>
                        </div>
                    ) : (
                        <button type="button" disabled className="bg-[#2A292F] w-full h-[56px] text-[#C2C7D0] font-extrabold text-[16px] leading-[24px] rounded-[12px] uppercase cursor-not-allowed tracking-[-0.4px] flex items-center justify-center gap-2">
                            <span role="status" className="w-2 h-2 rounded-full bg-[#55D6BE] animate-pulse shadow-[0_0_8px_rgba(218,255,0,0.6)]" />
                            WAITING FOR PAYMENT ({timeLeft})
                        </button>
                    )
                ) : escrowStatus === "fiat_sent" ? (
                    <button 
                        type="button" 
                        onClick={handleReleaseAction}
                        disabled={isSubmitting}
                        className="bg-[#55D6BE] w-full h-[56px] text-[#081521] font-extrabold text-[16px] leading-[24px] rounded-[12px] hover:bg-[#38B99F] uppercase transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 tracking-[-0.4px]"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 text-[#081521] animate-spin" /> : <CircleCheck className="w-5 h-5 text-[#081521] stroke-[3px]" />}
                        {isSubmitting ? "PROCESSING..." : "RELEASE CRYPTO"}
                    </button>
                ) : escrowStatus === "released" ? (
                    <div role="status" className="bg-[#55D6BE]/10 border border-[#55D6BE]/30 w-full h-[56px] rounded-[12px] flex items-center justify-center">
                        <span className="text-[#55D6BE] font-bold text-[16px] leading-[24px] uppercase tracking-[-0.4px]">COMPLETED!</span>
                    </div>
                ) : null}

                {/* Cancel Action Button */}
                {escrowStatus !== "released" && (
                    <button 
                        type="button" 
                        onClick={handleCancel}
                        disabled={!canCancel || isCancelling}
                        className="bg-transparent hover:bg-[#FF6B6B]/5 hover:border-[#FF6B6B]/50 hover:text-[#FF6B6B] disabled:hover:bg-transparent disabled:hover:border-[rgba(69,73,50,0.3)] disabled:hover:text-[#C2C7D0] w-full h-[58px] text-[#C2C7D0] border border-[rgba(69,73,50,0.3)] font-bold text-[16px] leading-[24px] rounded-[12px] uppercase transition-all duration-200 tracking-[-0.4px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isCancelling ? "CANCELLING..." : "CANCEL OPERATION"}
                    </button>
                )}
            </div>
        </div>

            {sig.showModal && (
                <SignatureCancelledModal
                    onRetry={handleSignatureRetry}
                    onCancel={handleSignatureCancel}
                />
            )}
        </>
    );
}