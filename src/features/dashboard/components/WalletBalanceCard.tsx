"use client";

import type { ReactNode } from "react";

interface WalletBalanceCardProps {
    totalBalance: string;
    currency: string;
    isLoading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    actions?: ReactNode;
}

export function WalletBalanceCard({
    totalBalance,
    currency,
    isLoading = false,
    error = null,
    onRetry,
    actions,
}: WalletBalanceCardProps) {
    return (
        <section
            aria-label="Total balance"
            className="w-full h-full flex flex-col justify-between gap-6"
        >
            <div
                className="relative rounded-3xl overflow-hidden p-6 md:p-7 min-h-[140px] md:min-h-[164px] flex flex-col justify-center"
                style={{
                    background: [
                        "radial-gradient(70% 115% at 84% 26%, #A8DC0F 0%, rgba(150,200,18,0.72) 26%, rgba(94,124,28,0.34) 48%, rgba(58,64,44,0.12) 66%, rgba(45,45,45,0) 80%)",
                        "linear-gradient(135deg, #263949 0%, #2E2E2E 60%, #272727 100%)",
                    ].join(", "),
                }}
            >
                <div className="relative">
                    <p className="text-[11px] md:text-[13px] tracking-[0.18em] text-[#B8B4B0] uppercase mb-2 md:mb-3">
                        Total Balance
                    </p>

                    {isLoading ? (
                        <div
                            data-testid="balance-skeleton"
                            role="status"
                            aria-label="Loading total balance"
                            className="h-[44px] md:h-[64px] w-[70%] max-w-[360px] rounded-lg bg-white/10 animate-pulse"
                        />
                    ) : error ? (
                        <div className="flex flex-col items-start gap-2">
                            <p
                                role="alert"
                                className="text-red-300 text-sm md:text-base font-medium"
                            >
                                {`Couldn't load your balance. ${error}`}
                            </p>
                            {onRetry && (
                                <button
                                    type="button"
                                    onClick={onRetry}
                                    className="text-black bg-[#55D6BE] hover:bg-[#55D6BE] text-xs font-bold px-4 py-2 rounded-lg tracking-wide transition-colors"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-baseline gap-2 md:gap-3 flex-wrap">
                            <span className="text-[36px] sm:text-[48px] md:text-[64px] font-bold text-white leading-none tracking-tight tabular-nums break-all">
                                {totalBalance}
                            </span>
                            <span className="text-[#D6D2CE] text-[16px] md:text-[22px] font-medium">
                                {currency}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {actions}
        </section>
    );
}
