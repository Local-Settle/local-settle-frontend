"use client"

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Landmark, Plus, RefreshCw, ShoppingCart, Tag } from "lucide-react";
import { useWallet } from "@/features/wallet";
import { useWalletBalanceViewModel } from "@/features/dashboard/hooks/useWalletBalanceViewModel";
import { WalletBalanceCard } from "@/features/dashboard/components/WalletBalanceCard";
import { WalletAssetList } from "@/features/dashboard/components/WalletAssetList";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const SendFundsModal = dynamic(() => import("./SendFundsModal").then(mod => mod.SendFundsModal), { ssr: false });
const ReceiveFundsModal = dynamic(() => import("./ReceiveFundsModal").then(mod => mod.ReceiveFundsModal), { ssr: false });
const CreateOfferModal = dynamic(() => import("../../p2p/components/CreateOfferModal").then(mod => mod.CreateOfferModal), { ssr: false });
import { useSearchParams } from "next/navigation";

const SECONDARY_ACTIONS = [
    { Icon: Tag, label: "Offers", href: "/p2p" },
    { Icon: ShoppingCart, label: "Buy", href: "/p2p" },
    { Icon: Landmark, label: "Withdraw", href: "/transactions" },
];

export function WalletDashboard() {
    const { publicKey } = useWallet();
    const { viewModel, isLoading, isFetching, lastUpdatedAt, error, retry } = useWalletBalanceViewModel(publicKey);
    const [cooldownUntil, setCooldownUntil] = useState(0);
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        if (cooldownUntil <= now) return;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [cooldownUntil, now]);
    const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
    const refreshBalance = () => {
        if (isFetching || cooldownSeconds > 0) return;
        setCooldownUntil(Date.now() + 30_000);
        void retry();
    };

    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = useState(false);

    const searchParams = useSearchParams();
    const sendParam = searchParams.get("send");
    const walletParam = searchParams.get("wallet");
    const [isSendModalOpen, setIsSendModalOpen] = useState(sendParam === "true" || !!walletParam);

    const circleButton =
        "inline-flex items-center justify-center w-11 h-11 rounded-full shrink-0 border border-[#263949] text-[#9BABB7] " +
        "hover:text-[#55D6BE] hover:border-[#55D6BE] hover:bg-[#55D6BE]/10 focus-visible:outline-none " +
        "focus-visible:ring-2 focus-visible:ring-[#55D6BE]/60 transition-colors";

    const actions = (
        <div className="flex items-center justify-between gap-4 flex-wrap">
            <button
                type="button"
                onClick={() => setIsCreateOfferModalOpen(true)}
                className="flex items-center gap-3 bg-[#55D6BE] hover:bg-[#55D6BE] text-black text-sm font-bold pl-6 pr-5 py-3.5 rounded-full transition-colors shrink-0"
            >
                Create Offer
                <Plus className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
            </button>

            <div className="flex items-center gap-3 flex-wrap">
                <button
                    type="button"
                    aria-label="Send funds"
                    title="Send"
                    className={circleButton}
                    onClick={() => setIsSendModalOpen(true)}
                >
                    <ArrowUpRight className="w-5 h-5" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    aria-label="Receive funds"
                    title="Receive"
                    className={circleButton}
                    onClick={() => setIsReceiveModalOpen(true)}
                >
                    <ArrowDownLeft className="w-5 h-5" aria-hidden="true" />
                </button>

                {SECONDARY_ACTIONS.map(({ Icon, label, href }) => (
                    <Link
                        key={label}
                        href={href}
                        aria-label={label}
                        title={label}
                        className={circleButton}
                    >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                    </Link>
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full min-w-0 flex flex-col pt-6 px-4 pb-8 md:pt-10 md:px-12 md:pb-10">
            <div className="flex items-center justify-end gap-3 mb-3 text-xs text-[#9BABB7]">
                {lastUpdatedAt && <span>{now - lastUpdatedAt > 60_000 ? "Balance may be stale" : `Updated ${new Date(lastUpdatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}</span>}
                {isFetching && !isLoading && <span role="status">Refreshing…</span>}
                <button type="button" onClick={refreshBalance} disabled={isFetching || cooldownSeconds > 0} className="inline-flex items-center gap-2 rounded-full border border-[#263949] px-3 py-2 text-white disabled:opacity-50" aria-label="Refresh wallet balance">
                    <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
                    {cooldownSeconds > 0 ? `Refresh in ${cooldownSeconds}s` : "Refresh balance"}
                </button>
            </div>
            <div className="w-full rounded-3xl border border-[#1A1A1E] bg-[#0A0A0C] p-4 md:p-6">
                <div className="w-full grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-8">
                    <WalletBalanceCard
                        totalBalance={viewModel.totalBalance}
                        currency={viewModel.currency}
                        isLoading={isLoading}
                        error={error}
                        onRetry={retry}
                        actions={actions}
                    />

                    <WalletAssetList
                        assets={viewModel.assets}
                        isLoading={isLoading}
                        error={error}
                        onRetry={retry}
                    />
                </div>
            </div>

            {isSendModalOpen && <SendFundsModal onClose={() => setIsSendModalOpen(false)} />}
            {isReceiveModalOpen && <ReceiveFundsModal onClose={() => setIsReceiveModalOpen(false)} />}
            {isCreateOfferModalOpen && <CreateOfferModal onClose={() => setIsCreateOfferModalOpen(false)} />}
        </div>
    );
}
