"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Landmark } from "lucide-react";
import type { Order } from "../models/order";

function getRelativeTime(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
}

interface ActiveOrderCardProps {
    order: Order;
    currentUserId?: string;
}

// Status pill: border colored, text white (per reviewer feedback)
const STATUS_BORDER: Record<string, string> = {
    FUNDING: "border-[#55D6BE]",
    PENDING: "border-yellow-400",
    INITIALIZED: "border-blue-400",
    FUNDED: "border-blue-400",
    "IN PROGRESS": "border-blue-400",
    "FIAT SENT": "border-[#55D6BE]",
    DISPUTED: "border-red-400",
    RELEASED: "border-[#55D6BE]",
    RESOLVED: "border-[#55D6BE]",
    // COMPLETED intentionally omitted — completed orders do not appear in the active section
};

function statusLabel(order: Order): string {
    // Prefer the on-chain escrow state when it is past "pending"; it reflects
    // the live lifecycle of an active order better than the coarse orderStatus.
    const escrowStatus = order.escrow?.escrowStatus;
    if (escrowStatus && escrowStatus !== "pending") {
        return escrowStatus.replace(/_/g, " ").toUpperCase();
    }
    return (order.orderStatus || "pending").toUpperCase();
}

export function ActiveOrderCard({ order, currentUserId }: ActiveOrderCardProps) {
    const router = useRouter();

    const isBuying = currentUserId !== undefined && order.buyerId === currentUserId;
    const role = isBuying ? "BUYING" : "SELLING";
    const counterparty = isBuying ? order.seller : order.buyer;

    const displayStatus = statusLabel(order);
    const statusBorder = STATUS_BORDER[displayStatus] ?? "border-[#9BABB7]";
    const assetCode = order.offer?.assetCode || order.assetCode || "USDC";
    const paymentMethod =
        order.offer?.payment_methods?.[0]?.bankName ||
        order.offer?.paymentMethods?.[0]?.bankName ||
        "Bank transfer";
    const unitPrice = order.offer?.price;
    const fiatCurrency =
        (isBuying ? order.seller?.preferredCurrency : order.buyer?.preferredCurrency) || "USD";
    const displayTime = order.createdAt ? getRelativeTime(new Date(order.createdAt)) : "—";

    const openOrder = () => router.push(`/p2p/orders/${order.orderId}`);

    return (
        <div
            className="flex flex-col rounded-2xl bg-[#121214] border border-[#1f1f1f] overflow-hidden
                       min-w-[260px] w-full transition-all duration-200 hover:border-[#172B3A] hover:bg-[#151517]"
            data-testid="active-order-card"
        >
            {/* Top section — 24px gap and padding per Figma */}
            <div className="flex flex-col gap-6 p-6">
                {/* Role + Status row */}
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-[0.15em] text-[#9BABB7] uppercase">
                        {role}
                    </span>
                    {/* Border colored, text white */}
                    <span
                        role="status"
                        className={`text-[11px] font-bold tracking-[0.12em] uppercase px-3 py-1 rounded-full border text-white ${statusBorder}`}
                    >
                        {displayStatus}
                    </span>
                </div>

                {/* Amount + Asset row — asset icon aligned to the right */}
                <div className="flex items-center justify-between">
                    <span className="text-[32px] font-bold text-white tracking-tight leading-none">
                        {order.assetAmount}
                    </span>
                    <div className="flex items-center gap-2">
                        {/* USDC icon loaded from public assets */}
                        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                            <Image
                                src="/usdc.png"
                                alt="USDC"
                                width={28}
                                height={28}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="text-[13px] font-semibold text-[#c0c0c0] tracking-wider">
                            {assetCode}
                        </span>
                    </div>
                </div>

                {/* Payment method — Landmark icon from lucide-react */}
                <div className="flex items-center gap-2">
                    <Landmark size={16} className="text-[#9BABB7] shrink-0" />
                    <span className="text-[13px] text-[#9BABB7]">{paymentMethod}</span>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#1f1f1f] mx-6" />

            {/* Bottom section — 24px gap and padding per Figma */}
            <div className="flex flex-col gap-6 p-6">
                {/* Counterparty — profile image pattern from P2P panel */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#172B3A] border border-[#3a3a3a] shrink-0 overflow-hidden">
                        {counterparty?.profileImageUrl ? (
                            <Image
                                src={counterparty.profileImageUrl}
                                alt={counterparty.alias || "Counterparty profile image"}
                                width={36}
                                height={36}
                                className="w-full h-full object-cover"
                            />
                        ) : null}
                    </div>
                    <div>
                        <p className="text-[13px] font-semibold text-white leading-tight">
                            {counterparty?.alias || (isBuying ? "Seller" : "Buyer")}
                        </p>
                        <p className="text-[11px] text-[#9BABB7] leading-tight">
                            Unit price&nbsp;
                            <span className="font-bold text-[#c0c0c0]">
                                {unitPrice ?? "—"} {fiatCurrency}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Time + Open button — items aligned at bottom */}
                <div className="flex items-end justify-between">
                    <span className="text-[12px] text-[#9BABB7]">{displayTime}</span>
                    <button
                        onClick={openOrder}
                        className="px-5 py-2 rounded-full bg-[#55D6BE] text-black text-[13px] font-bold
                                   tracking-wide cursor-pointer transition-all duration-150
                                   hover:opacity-90"
                    >
                        Open
                    </button>
                </div>
            </div>
        </div>
    );
}
