"use client";

import { useState, useRef, useEffect } from "react";
import { useEscrows } from "@/features/escrow/hooks/useEscrows";
import { isSignatureCancelled } from "@/features/wallet/application/wallet.service";
import { useSignatureCancellation } from "@/features/wallet/hooks/useSignatureCancellation";
import { Info, Upload, FileUp, CircleCheck, Loader2, Search, Trash2 } from "lucide-react";
import { SignatureCancelledModal } from "../../components/SignatureCancelledModal";
import { useNotifications } from "@/features/notifications";

export interface TradeEvidenceUploaderProps {
    orderId: string;
    escrowId?: string | null;
    escrowStatus: "pending" | "initialized" | "funded" | "fiat_sent" | "released" | "disputed" | "resolved";
    buyerAddress?: string | null;
    amount: number;
    evidenceUrl?: string | null;
    onStatusChange: () => void;
    canCancel: boolean;
    isCancelling: boolean;
    onCancelOrder: () => void;
}

export function TradeEvidenceUploader({
    escrowId,
    escrowStatus,
    buyerAddress,
    evidenceUrl,
    onStatusChange,
    canCancel,
    isCancelling,
    onCancelOrder
}: TradeEvidenceUploaderProps) {
    const { markFiatSent, syncEscrow, uploadEvidence } = useEscrows();

    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [evidenceUrlState, setEvidenceUrlState] = useState<string | null>(evidenceUrl || null);
    const [uploadState, setUploadState] = useState<'idle' | 'selected' | 'uploading' | 'uploaded'>(
        evidenceUrl ? 'uploaded' : 'idle'
    );
    const [uploadedTime, setUploadedTime] = useState<string | null>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { notify } = useNotifications();
    const sig = useSignatureCancellation();

    // Sync with incoming evidenceUrl prop (e.g. on page refresh or peer update)
    useEffect(() => {
        if (evidenceUrl) {
            setEvidenceUrlState(evidenceUrl);
            setUploadState('uploaded');
            if (!uploadedTime) {
                setUploadedTime(new Date().toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }));
            }
        } else if (escrowStatus === "funded") {
            // Only clear if we are in funded state, to avoid clearing during page transition
            setEvidenceUrlState(null);
            setUploadedFile(null);
            setPreviewUrl(null);
            setUploadState('idle');
            setUploadedTime(null);
        }
    }, [evidenceUrl, escrowStatus, uploadedTime]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setUploadedFile(file);
            setUploadState('selected');
            
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            setUploadedFile(file);
            setUploadState('selected');
            
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    const handleUploadToServer = async () => {
        if (!uploadedFile || !escrowId) return;
        setUploadState('uploading');
        try {
            const uploadRes = await uploadEvidence(escrowId, uploadedFile);
            setEvidenceUrlState(uploadRes.url);
            setUploadState('uploaded');
            setUploadedTime(new Date().toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }));
            notify("success", "Evidence uploaded successfully!");
        } catch (err: unknown) {
            setUploadState('selected');
            alert(`Error uploading file: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    const handleRemove = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setUploadedFile(null);
        setPreviewUrl(null);
        setEvidenceUrlState(null);
        setUploadState('idle');
        setUploadedTime(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handlePreviewClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = previewUrl || evidenceUrlState;
        if (url) {
            window.open(url, '_blank');
        }
    };

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

    const handleAction = async () => {
        if (isSubmitting || !buyerAddress || !escrowId || !evidenceUrlState) return;
        setIsSubmitting(true);
        try {
            if (escrowStatus === "funded") {
                const res = await markFiatSent(escrowId, {
                    buyerAddress,
                    evidence: evidenceUrlState
                });
                const actionXdr = res.unsignedFundTransaction || res.unsignedTransaction;
                if (!actionXdr) throw new Error("Confirmation failed: no unsigned XDR returned");
                
                const signedXdr = await sig.sign(actionXdr);
                await syncEscrow({ escrowId, action: "fiat_sent", signedXdr });
                
                notify("success", "Payment confirmed and registered successfully!");
                onStatusChange();
            }
        } catch (err: unknown) {
            if (isSignatureCancelled(err)) return;
            alert(`Error processing action: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (!canCancel || isCancelling) return;
        onCancelOrder();
    };

    const handleSignatureRetry = async () => {
        if (!escrowId) return;
        setIsSubmitting(true);
        try {
            const signedXdr = await sig.retry();
            await syncEscrow({ escrowId, action: "fiat_sent", signedXdr });
            notify("success", "Payment confirmed and registered successfully!");
            onStatusChange();
        } catch (err: unknown) {
            if (isSignatureCancelled(err)) return;
            notify("error", `Error: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignatureCancel = () => {
        sig.cancel();
    };

    const renderStatusDescription = () => {
        switch (escrowStatus) {
            case "pending":
            case "initialized":
                return "Waiting for the seller to lock the funds in the smart Escrow contract.";
            case "funded":
                return "Ensure the payment receipt clearly shows the destination IBAN and transaction reference. Operations are monitored 24/7 for security.";
            case "fiat_sent":
                return "Payment sent! Waiting for the seller to verify the funds and release the locked crypto from the escrow.";
            case "released":
                return "The transaction has been successfully completed. The cryptocurrency has been released to your wallet.";
            default:
                return "Transaction in progress.";
        }
    };

    const renderPreviewFile = () => {
        const url = previewUrl || evidenceUrlState;
        if (!url) return <div className="text-white font-mono text-xs">NO FILE</div>;

        const isPdfFile = uploadedFile 
            ? (uploadedFile.type === "application/pdf" || uploadedFile.name.endsWith(".pdf"))
            : (evidenceUrlState?.toLowerCase().endsWith(".pdf") || false);

        if (isPdfFile) {
            return (
                <iframe 
                    src={`${url}#toolbar=0&navpanes=0&scrollbar=0`} 
                    className="w-full h-full border-0 pointer-events-none rounded-[8px]" 
                />
            );
        }

        return (
            <img 
                src={url} 
                alt="Uploaded receipt preview" 
                className="w-full h-full object-cover rounded-[8px]" 
            />
        );
    };

    const isEvidenceSubmitted = escrowStatus === "fiat_sent" || escrowStatus === "released";

    return (
        <>
        <div className="bg-[#0D1D2C] w-[402.8px] h-[571.5px] rounded-[16px] flex flex-col justify-between p-[12px_16px] gap-6 font-space shrink-0 select-none">
            
            {/* Header Info Banner */}
            <div className="bg-[#0D1D2C] border-l border-[rgba(69,73,50,0.3)] rounded-[8px] p-[20px_12px] h-[99px] flex gap-3 shrink-0">
                <span className="w-[11.67px] h-[11.67px] bg-[#55D6BE] rounded-full flex items-center justify-center shrink-0 mt-1 shadow-[0_0_8px_rgba(218,255,0,0.5)]">
                    <Info className="w-[8px] h-[8px] text-black stroke-[3.5px]" />
                </span>
                <p className="text-[#C2C7D0] text-[12px] leading-[20px] font-manrope font-normal">
                    {renderStatusDescription()}
                </p>
            </div>

            {/* Upload Body Area */}
            <div className="flex-1 flex flex-col justify-center items-center gap-4 shrink-0 min-h-0">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*,application/pdf"
                />
                
                {!isEvidenceSubmitted && (
                    <button 
                        type="button" 
                        onClick={uploadState === 'idle' ? triggerUpload : handleUploadToServer}
                        disabled={escrowStatus !== "funded" || uploadState === 'uploading' || uploadState === 'uploaded'}
                        className="bg-[#55D6BE] disabled:bg-[#11212E] disabled:text-[rgba(155,171,183,0.5)] w-full h-[48px] text-[#081521] font-extrabold text-[16px] leading-[24px] rounded-[12px] hover:bg-[#38B99F] uppercase transition-all duration-200 flex items-center justify-center gap-2 select-none tracking-[-0.4px] disabled:cursor-not-allowed shrink-0 cursor-pointer"
                    >
                        {uploadState === 'uploading' ? (
                            <>
                                <Loader2 className="w-5 h-5 text-[#081521] animate-spin" /> UPLOADING...
                            </>
                        ) : uploadState === 'uploaded' ? (
                            <span role="status">
                                <CircleCheck className="w-5 h-5 text-[#081521] stroke-[3px]" /> EVIDENCE UPLOADED
                            </span>
                        ) : (
                            <>
                                <Upload className="w-4.5 h-4.5 stroke-[2.5px]" /> Upload Evidence
                            </>
                        )}
                    </button>
                )}

                {isEvidenceSubmitted ? (
                    /* Display Submitted Evidence Preview when Completed or Fiat Sent */
                    <div className="border border-[#55D6BE]/30 bg-[#0D1D2C] w-full h-[276.5px] rounded-[12px] flex flex-col items-center justify-between p-6 select-none shadow-[inset_0_0_12px_rgba(218,255,0,0.05)] transition-all duration-300">
                        <div className="w-full flex items-center justify-between border-b border-[rgba(218,255,0,0.1)] pb-3">
                            <span className="text-[10px] text-[#64748B] font-bold tracking-[1px] uppercase">
                                EVIDENCE SUBMITTED
                            </span>
                            <span className="text-[9px] text-[#55D6BE] bg-[#55D6BE]/10 border border-[#55D6BE]/20 font-black p-[2px_8px] rounded-full uppercase tracking-wider">
                                Verified
                            </span>
                        </div>
                        
                        <div className="flex flex-row items-center gap-4 my-auto w-full px-2">
                            <div 
                                onClick={handlePreviewClick}
                                className="w-[80px] h-[100px] relative rounded-[8px] bg-[#0D1D2C] overflow-hidden border border-white/[0.08] shadow-md flex items-center justify-center group cursor-pointer shrink-0"
                            >
                                {renderPreviewFile()}
                                <div className="absolute bottom-1 right-1 bg-black/70 rounded-full p-1 border border-white/20">
                                    <Search className="w-3 h-3 text-white stroke-[2.5px]" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 min-w-0">
                                <p className="text-[14px] font-black text-[#D7E0E6] truncate max-w-[160px]">
                                    {getFilenameFromUrl(evidenceUrlState)}
                                </p>
                                <p className="text-[10px] text-[#55D6BE] font-bold tracking-wider uppercase">
                                    SECURED ON-CHAIN
                                </p>
                            </div>
                        </div>
                        
                        <div className="w-full flex justify-between text-[10px] text-[#64748B] font-semibold border-t border-[rgba(218,255,0,0.05)] pt-3">
                            <span>TX REF: IK-9821-B</span>
                            <span>METHOD: SEPA BANK</span>
                        </div>
                    </div>
                ) : uploadState === 'idle' ? (
                    /* Standard Dropzone */
                    <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={escrowStatus === "funded" ? triggerUpload : undefined}
                        className={`border-2 border-dashed w-full h-[214.5px] rounded-[12px] flex flex-col items-center justify-center transition-all duration-200 select-none ${
                            escrowStatus !== "funded"
                                ? "border-[rgba(155,171,183,0.2)] bg-[#0D1D2C]/10 cursor-not-allowed"
                                : isDragging 
                                    ? "border-[#55D6BE] bg-[#55D6BE]/5 cursor-pointer" 
                                    : "border-[rgba(155,171,183,0.8)] hover:border-[#55D6BE]/40 bg-[#0D1D2C] cursor-pointer"
                        }`}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <FileUp className="w-8 h-8 text-[rgba(155,171,183,0.8)]" />
                            <p className="text-[16px] font-medium leading-[24px] text-[rgba(155,171,183,0.8)] text-center tracking-normal font-space max-w-[200px]">
                                Drop your evidence file here
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Dashed border preview box for Selected / Uploading / Uploaded states */
                    <div className="border-2 border-dashed border-[rgba(155,171,183,0.4)] w-full h-[214.5px] rounded-[12px] flex flex-row items-center p-4 gap-4 bg-[#0D1D2C]/30 select-none relative">
                        {/* Preview thumbnail box (left) */}
                        <div 
                            onClick={handlePreviewClick}
                            className="w-[110px] h-[140px] relative rounded-[8px] bg-[#0D1D2C] overflow-hidden border border-white/[0.08] shadow-md flex items-center justify-center group cursor-pointer shrink-0"
                        >
                            {renderPreviewFile()}
                            {/* Magnifier Glass overlay */}
                            <div className="absolute bottom-2 right-2 bg-black/70 rounded-full p-1.5 border border-white/20 hover:bg-black/95 transition-colors">
                                <Search className="w-3.5 h-3.5 text-white stroke-[3px]" />
                            </div>
                        </div>

                        {/* File Info and Action (right) */}
                        <div className="flex-1 flex flex-col justify-center gap-1 min-w-0 font-space">
                            <p className="text-[14px] font-bold text-white truncate w-full">
                                {uploadedFile ? uploadedFile.name : getFilenameFromUrl(evidenceUrlState)}
                            </p>
                            
                            {uploadState === 'selected' && (
                                <p className="text-[12px] text-[#C2C7D0] font-semibold">
                                    Ready to upload
                                </p>
                            )}
                            
                            {uploadState === 'uploading' && (
                                <p className="text-[12px] text-[#55D6BE] font-semibold animate-pulse">
                                    Uploading...
                                </p>
                            )}

                            {uploadState === 'uploaded' && (
                                <p className="text-[12px] text-[rgba(155,171,183,0.8)] font-semibold">
                                    Uploaded at {uploadedTime || "14:25"}
                                </p>
                            )}

                            {/* Remove button (only if they are in funded state and haven't released/completed) */}
                            {escrowStatus === "funded" && uploadState !== 'uploading' && (
                                <button 
                                    type="button" 
                                    onClick={handleRemove}
                                    className="flex items-center gap-1.5 text-[#FF6B6B] hover:text-red-400 text-[13px] font-bold uppercase mt-2 tracking-wide w-fit transition-colors cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4 text-[#FF6B6B]" /> REMOVE
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Footer */}
            <div className="flex flex-col gap-3 shrink-0">
                {escrowStatus === "pending" || escrowStatus === "initialized" ? (
                    <button type="button" disabled className="bg-[#2A292F] w-full h-[56px] text-[#C2C7D0] font-extrabold text-[16px] leading-[24px] rounded-[12px] uppercase cursor-not-allowed tracking-[-0.4px]">
                        WAITING FOR FUNDING
                    </button>
                ) : escrowStatus === "funded" ? (
                    <button 
                        type="button" 
                        onClick={handleAction}
                        disabled={isSubmitting || uploadState !== 'uploaded'}
                        className="bg-[#55D6BE] disabled:bg-[#11212E] disabled:text-[rgba(155,171,183,0.5)] disabled:cursor-not-allowed w-full h-[56px] text-[#081521] font-extrabold text-[16px] leading-[24px] rounded-[12px] hover:bg-[#38B99F] uppercase transition-all duration-200 flex items-center justify-center gap-2 tracking-[-0.4px] cursor-pointer"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 text-[#081521] animate-spin" /> : <CircleCheck className="w-5 h-5 text-[#081521] stroke-[3px]" />}
                        {isSubmitting ? "PROCESSING..." : "MARK AS PAID"}
                    </button>
                ) : escrowStatus === "fiat_sent" ? (
                    <button type="button" disabled className="bg-[#2A292F] w-full h-[56px] text-[#C2C7D0] font-extrabold text-[16px] leading-[24px] rounded-[12px] uppercase cursor-not-allowed tracking-[-0.4px]">
                        WAITING FOR RELEASE
                    </button>
                ) : escrowStatus === "released" ? (
                    <div className="bg-[#55D6BE]/10 border border-[#55D6BE]/30 w-full h-[56px] rounded-[12px] flex items-center justify-center">                            <span role="status" className="text-[#55D6BE] font-bold text-[16px] leading-[24px] uppercase tracking-[-0.4px]">COMPLETED!</span>
                    </div>
                ) : null}

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
