"use client";

interface SignatureCancelledModalProps {
    onRetry: () => void;
    onCancel: () => void;
}

export function SignatureCancelledModal({ onRetry, onCancel }: SignatureCancelledModalProps) {
    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <style>
                {`
                @keyframes slideUpCenter {
                    0% { transform: translateY(50px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .animate-slideUpCenter {
                    animation: slideUpCenter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                `}
            </style>

            <div
                className="bg-[#081521] border border-[#263949]/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] rounded-lg w-full max-w-[480px] flex flex-col overflow-hidden animate-slideUpCenter"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col items-center p-8 gap-6">
                    <div className="w-16 h-16 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#FFD700]" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    <div className="text-center space-y-2">
                        <h3 className="text-[#D7E0E6] font-bold text-2xl font-space">
                            Signature Cancelled
                        </h3>
                        <p className="text-[#9BABB7] text-sm font-space leading-relaxed max-w-[360px]">
                            You cancelled the wallet signature request. The transaction has not been signed yet. You can retry signing or cancel the operation entirely.
                        </p>
                    </div>

                    <div className="w-full flex flex-col gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onRetry}
                            className="w-full bg-[#55D6BE] hover:bg-[#55D6BE] text-[#181E00] font-bold text-lg py-4 rounded-lg shadow-[0_0_30px_rgba(218,255,0,0.15)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 font-space"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Retry Signing
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-full bg-[#2A292F] hover:bg-[#35343b] text-[#D7E0E6] font-bold text-base py-3.5 rounded-lg transition-colors cursor-pointer font-space"
                        >
                            Cancel Operation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
