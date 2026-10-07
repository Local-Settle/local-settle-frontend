import { CloseModalProps } from "@/app/utils/closeModalProps";
import { useWallet } from "@/features/wallet";
import { useUser } from "@/features/user/presentation/context/UserContext";
import dynamic from "next/dynamic";
const QRCodeSVG = dynamic(() => import("qrcode.react").then(mod => mod.QRCodeSVG), { ssr: false });
import { useState, useMemo } from "react";
import { useFocusTrap } from "@/app/hooks/useFocusTrap";

export function ReceiveFundsModal({ onClose }: CloseModalProps) {
    const { publicKey } = useWallet();
    const { currentUser } = useUser();
    
    const [copiedType, setCopiedType] = useState("");

    const panelRef = useFocusTrap<HTMLDivElement>({ onClose });

    const qrUrl = useMemo(() => {
        if (typeof window !== "undefined" && publicKey) {
            return `${window.location.origin}/send?wallet=${publicKey}`;
        }
        return "";
    }, [publicKey]);

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedType(type);
            setTimeout(() => setCopiedType(""), 2000);
        });
    };

    const handleShareDetails = () => {
        if (!qrUrl) return;
        navigator.clipboard.writeText(qrUrl).then(() => {
            setCopiedType("Share Link");
            setTimeout(() => setCopiedType(""), 2000);
        });
    };

    if (!publicKey) {
        return (
            <div
                className="fixed inset-0 bg-[black/60] backdrop-blur-sm z-40 flex items-center justify-end"
                onClick={() => onClose()}
            >
                <div
                    ref={panelRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="receive-funds-title"
                    tabIndex={-1}
                    className="bg-[#081521F2] h-full w-md p-8 border-r border-white/10 flex flex-col justify-between"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col">
                                <h2 id="receive-funds-title" className="text-white text-[30px] font-bold uppercase">Receive funds</h2>
                                <p className="text-[#C2C7D0] text-[14px]">Accept assets via Stellar Network.</p>
                            </div>
                            <button
                                onClick={() => onClose()}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="w-full h-px mb-6" style={{ background: 'linear-gradient(to right, #55D6BE00, #55D6BE, #55D6BE00)' }} />

                        <div className="flex flex-col items-center justify-center p-8 border border-white/10 rounded-xl bg-white/5 text-center mt-10">
                            <p className="text-yellow-400 text-sm font-semibold mb-4">No wallet connected.</p>
                            <p className="text-[#C2C7D0] text-xs">Please connect your Stellar wallet to generate a receive QR code and view address details.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => onClose()}
                        className="w-full bg-[#55D6BE] uppercase text-black font-semibold px-4 py-3 rounded-xl hover:bg-[#38B99F] transition-colors mt-auto"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 bg-[black/60] backdrop-blur-sm z-40 flex items-center justify-end"
            onClick={() => onClose()}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="receive-funds-title"
                tabIndex={-1}
                className="bg-[#081521F2] h-full w-md p-8 border-r border-white/10 flex flex-col justify-between"
                onClick={(e) => e.stopPropagation()}
            >
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <h2 id="receive-funds-title" className="text-white text-[30px] font-bold uppercase">Receive funds</h2>
                            <p className="text-[#C2C7D0] text-[14px]">Accept assets via Stellar Network.</p>
                        </div>
                        <button
                            onClick={() => onClose()}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="w-full h-px mb-6" style={{ background: 'linear-gradient(to right, #55D6BE00, #55D6BE, #55D6BE00)' }} />

                    {/* QR Code Container */}
                    <div className="flex items-center justify-center bg-white w-full max-w-[220px] aspect-square rounded-2xl p-4 mx-auto mb-6 border border-white/10 shadow-lg">
                        {qrUrl ? (
                            <QRCodeSVG
                                value={qrUrl}
                                size={188}
                                level="M"
                                fgColor="#081521"
                                bgColor="#FFFFFF"
                            />
                        ) : (
                            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        )}
                    </div>

                    {/* Alias Field */}
                    <div className="flex flex-col mt-4">
                        <p className="text-[#C2C7D0] text-[12px] mb-2 uppercase">LocalSettle alias</p>
                        <div className="relative">
                            <input
                                type="text"
                                value={currentUser?.alias || "No alias set"}
                                readOnly
                                className="w-full h-13 rounded-xl border border-[#26394933] bg-[#0D1D2C] pl-4 pr-20 text-white text-sm"
                            />
                            {currentUser?.alias && (
                                <button
                                    onClick={() => handleCopy(currentUser.alias || "", "Alias")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#55D6BE] hover:text-white text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-white/5 transition-all"
                                >
                                    {copiedType === "Alias" ? "Copied!" : "Copy"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stellar Wallet ID Field */}
                    <div className="flex flex-col mt-4">
                        <p className="text-[#C2C7D0] text-[12px] mb-2 uppercase">stellar wallet id</p>
                        <div className="relative">
                            <input
                                type="text"
                                value={publicKey}
                                readOnly
                                className="w-full h-13 rounded-xl border border-[#26394933] bg-[#0D1D2C] pl-4 pr-20 text-white text-sm font-mono truncate"
                            />
                            <button
                                onClick={() => handleCopy(publicKey, "Wallet ID")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#55D6BE] hover:text-white text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-white/5 transition-all"
                            >
                                {copiedType === "Wallet ID" ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex w-full items-center justify-center gap-3 mt-10">
                    <button
                        onClick={handleShareDetails}
                        className="flex-1 bg-[#55D6BE] uppercase text-black font-semibold px-4 py-3 rounded-xl hover:bg-[#38B99F] transition-colors"
                    >
                        {copiedType === "Share Link" ? "COPIED SEND LINK!" : "share details"}
                    </button>
                </div>
            </div>
        </div>
    );
}
