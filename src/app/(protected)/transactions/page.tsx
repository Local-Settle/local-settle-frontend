"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useUser } from "@/features/user/presentation/context/UserContext";
import { useOrders } from "@/features/order/hooks/useOrders";
import { useRouter } from "next/navigation";
import { Aside } from "@/app/components/Aside";
import { Header } from "@/app/components/Header";
import { TransactionExportMenu } from "@/features/transactions/components/TransactionExportMenu";
import { transactionExportService } from "@/features/transactions/services/transaction-export.service";
import { ShoppingCart, TrendingUp, ChevronRight, Loader2 } from "lucide-react";

export default function TransactionsPage() {
    const { currentUser } = useUser();
    const { orders, fetchUserOrders } = useOrders();
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Filters states
    // Default to completed transactions
    const [statusFilter, setStatusFilter] = useState("COMPLETED");
    const [operationFilter, setOperationFilter] = useState("All");
    const [startDateFilter, setStartDateFilter] = useState("");
    const [endDateFilter, setEndDateFilter] = useState("");
    useEffect(() => {
        // Stop loading if no user is logged in after a short wait (allowing context initialization)
        const timer = setTimeout(() => {
            if (!currentUser?.userId) {
                setLoading(false);
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser?.userId) return;

        let active = true;
        const timer = setTimeout(() => {
            if (active) setLoading(true);
        }, 0);

        fetchUserOrders(currentUser.userId).finally(() => {
            clearTimeout(timer);
            if (active) setLoading(false);
        });

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [currentUser?.userId, fetchUserOrders]);

    // Apply client-side filters
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const isBuy = o.buyerId === currentUser?.userId;

            // 1. Operation Filter
            if (operationFilter !== "All") {
                if (operationFilter === "Buy" && !isBuy) return false;
                if (operationFilter === "Sell" && isBuy) return false;
            }

            // 2. Status Filter
            const cleanStatus = o.orderStatus === "completed" || o.escrow?.escrowStatus === "released"
                ? "completed"
                : o.orderStatus === "cancelled"
                ? "cancelled"
                : "pending";

            if (statusFilter !== "ALL" && cleanStatus.toUpperCase() !== statusFilter) {
                return false;
            }

            // 3. Date Range Filter
            if (o.createdAt) {
                const orderTime = new Date(o.createdAt).getTime();
                if (startDateFilter) {
                    const startTime = new Date(startDateFilter + "T00:00:00Z").getTime();
                    if (orderTime < startTime) return false;
                }
                if (endDateFilter) {
                    const endTime = new Date(endDateFilter + "T23:59:59Z").getTime();
                    if (orderTime > endTime) return false;
                }
            }

            return true;
        });
    }, [orders, currentUser, operationFilter, statusFilter, startDateFilter, endDateFilter]);

    // Export handler
    const handleExport = (format: "csv" | "pdf") => {
        if (!currentUser?.userId) return;
        transactionExportService.export(filteredOrders, currentUser.userId, format, {
            status: statusFilter,
            operation: operationFilter,
            dateRange: {
                from: startDateFilter || undefined,
                to: endDateFilter || undefined
            }
        });
    };

    return (
        <div className="flex min-h-screen w-full bg-[#081521] text-white font-space">
            <Aside />
            <div className="flex flex-col flex-1 min-w-0 pb-20 md:pb-0">
                <Header description="history & exports" title="Transactions" />

                <main className="flex-1 px-4 md:px-16 pb-12 pt-0 w-full flex flex-col lg:flex-row gap-8 items-start">
                    
                    {/* FILTERS PANEL */}
                    <div className="w-full lg:w-[320px] flex flex-col gap-6 shrink-0 pt-4 lg:pt-12">
                        <h2 className="text-[20px] font-black tracking-[-0.6px] uppercase text-white pl-1">
                            Filters
                        </h2>

                        <div className="bg-[#0D1D2C] border border-[#263949] rounded-3xl p-6 flex flex-col gap-6">
                            
                            {/* Operations / Role Filter */}
                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] text-[#64748B] font-bold tracking-[1px] uppercase">
                                    Operations
                                </label>
                                <div className="relative">
                                    <select
                                        value={operationFilter}
                                        onChange={(e) => setOperationFilter(e.target.value)}
                                        className="w-full bg-[#11212E] text-white border-none rounded-lg p-3 text-sm font-bold uppercase cursor-pointer appearance-none focus:outline-none"
                                    >
                                        <option value="All">All Ops</option>
                                        <option value="Buy">Buy Only</option>
                                        <option value="Sell">Sell Only</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                                </div>
                            </div>

                            <div className="h-[1px] bg-[rgba(69,73,50,0.2)]" />

                            {/* Status Filter */}
                            <div className="flex flex-col gap-3">
                                <label id="transaction-status-filter-label" className="text-[10px] text-[#64748B] font-bold tracking-[1px] uppercase">
                                    Filter By Status
                                </label>
                                <div role="group" aria-labelledby="transaction-status-filter-label" className="flex flex-wrap gap-2">
                                    {["ALL", "PENDING", "COMPLETED", "CANCELLED"].map((status) => {
                                        const isActive = statusFilter === status;
                                        return (
                                            <button
                                                key={status}
                                                type="button"
                                                aria-pressed={isActive}
                                                onClick={() => setStatusFilter(status)}
                                                className={`text-[10px] font-bold p-[6px_16px] rounded-lg transition-colors cursor-pointer uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55D6BE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1D2C] ${
                                                    isActive
                                                        ? "bg-[#55D6BE] text-black"
                                                        : "bg-[#11212E] text-[#D7E0E6] hover:bg-gray-800"
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="h-[1px] bg-[rgba(69,73,50,0.2)]" />

                            {/* Date Picker Range */}
                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] text-[#64748B] font-bold tracking-[1px] uppercase">
                                    Date Range
                                </label>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-[#64748B] font-bold w-10 uppercase">From</span>
                                        <input
                                            type="date"
                                            value={startDateFilter}
                                            onChange={(e) => setStartDateFilter(e.target.value)}
                                            className="flex-1 bg-[#11212E] text-white border-none rounded-lg p-2.5 text-xs font-bold focus:outline-none [color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-[#64748B] font-bold w-10 uppercase">To</span>
                                        <input
                                            type="date"
                                            value={endDateFilter}
                                            onChange={(e) => setEndDateFilter(e.target.value)}
                                            className="flex-1 bg-[#11212E] text-white border-none rounded-lg p-2.5 text-xs font-bold focus:outline-none [color-scheme:dark]"
                                        />
                                    </div>
                                    {(startDateFilter || endDateFilter) && (
                                        <button
                                            onClick={() => { setStartDateFilter(""); setEndDateFilter(""); }}
                                            className="text-[9px] font-bold text-rose-400 hover:text-rose-300 transition-colors uppercase self-end mt-1 cursor-pointer"
                                        >
                                            Clear Dates
                                        </button>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* TRANSACTIONS TABLE PANEL */}
                    <div className="w-full flex-1 flex flex-col gap-4 mt-4 lg:pt-12">
                        
                        {/* Table Subheader with Action */}
                        <div className="flex items-center justify-between pl-1">
                            <h2 className="text-[20px] font-black tracking-[-0.6px] uppercase text-white">
                                History
                            </h2>
                            <TransactionExportMenu
                                disabled={filteredOrders.length === 0}
                                onExport={handleExport}
                            />
                        </div>

                        {/* List / Table container */}
                        <div className="bg-[#0D1D2C] border border-[#263949] rounded-[24px] overflow-hidden">
                            {/* Column Headers */}
                            <div className="hidden md:grid grid-cols-[1.5fr_1fr_1.2fr_1fr_1.2fr_40px] bg-[#081521] p-4 border-b border-[rgba(69,73,50,0.1)] text-[10px] text-[#64748B] font-bold tracking-[1px] uppercase select-none">
                                <div>Asset & Type</div>
                                <div>Role</div>
                                <div>Date</div>
                                <div className="text-right">Fiat Amount</div>
                                <div className="text-center">Status</div>
                                <div />
                            </div>

                            {/* Table Body / Loader */}
                            <div className="flex flex-col">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center p-20 text-gray-500">
                                        <Loader2 className="w-10 h-10 animate-spin text-[#55D6BE] mb-4" />
                                        <p className="font-bold">Loading transactions...</p>
                                    </div>
                                ) : filteredOrders.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-20 text-gray-500">
                                        <ShoppingCart className="w-12 h-12 mb-4 stroke-1" />
                                        <p className="font-bold text-center">There are no transactions available to export.</p>
                                    </div>
                                ) : (
                                    filteredOrders.map((o) => {
                                        const isBuy = o.buyerId === currentUser?.userId;
                                        
                                        // Format Date display
                                        const dateStr = o.createdAt
                                            ? new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()
                                            : "N/A";
                                            
                                        // Asset amount format
                                        const assetAmountNum = parseFloat(o.assetAmount) || 0;
                                        const formattedAsset = assetAmountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
                                        const assetCode = o.offer?.assetCode || o.assetCode || "USDC";

                                        // Fiat amount format
                                        const priceNum = parseFloat(o.offer?.price || "0") || 1;
                                        const totalFiat = parseFloat(o.fiatAmount) || (assetAmountNum * priceNum);
                                        const parseCurrency = (pref?: string) => pref ? pref.split(" ")[0] : null;
                                        const fiatCurrency = parseCurrency(o.buyer?.preferredCurrency) || parseCurrency(o.seller?.preferredCurrency) || "EUR";
                                        const fiatSymbol = fiatCurrency === "EUR" ? "€" : fiatCurrency === "CRC" ? "₡" : "$";
                                        const formattedFiat = totalFiat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                                        const cleanStatus = o.orderStatus === "completed" || o.escrow?.escrowStatus === "released"
                                            ? "completed"
                                            : o.orderStatus === "cancelled"
                                            ? "cancelled"
                                            : "pending";

                                        return (
                                            <div
                                                key={o.orderId}
                                                onClick={() => router.push("/p2p/orders/" + o.orderId)}
                                                className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1.2fr_1fr_1.2fr_40px] gap-4 p-6 border-b border-[rgba(22,22,24,0.05)] items-center hover:bg-[#1C1C1F] transition-colors cursor-pointer select-none"
                                            >
                                                {/* Asset & Type */}
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                                                            isBuy
                                                                ? "bg-[rgba(249,115,22,0.1)] border-[rgba(249,115,22,0.2)] text-[#F97316]"
                                                                : "bg-[rgba(218,255,0,0.1)] border-[rgba(218,255,0,0.2)] text-[#55D6BE]"
                                                        }`}
                                                    >
                                                        {isBuy ? (
                                                            <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                                                        ) : (
                                                            <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-extrabold uppercase tracking-tight">
                                                        <span className="text-[#55D6BE]">{isBuy ? "Buy" : "Sell"}{" "}</span>
                                                        {formattedAsset} {assetCode}
                                                    </span>
                                                </div>

                                                {/* Role */}
                                                <div className="text-xs font-semibold text-[#CBD5E1] md:block uppercase">
                                                    {isBuy ? "Buyer" : "Seller"}
                                                </div>

                                                {/* Date */}
                                                <div className="text-xs text-[#94A3B8] font-bold uppercase">
                                                    {dateStr}
                                                </div>

                                                {/* Fiat Amount */}
                                                <div className="text-sm font-black text-white text-right pr-2">
                                                    {fiatSymbol}{formattedFiat} <span className="text-[10px] text-[#64748B] font-bold">{fiatCurrency}</span>
                                                </div>

                                                {/* Status */}
                                                <div className="flex justify-center">
                                                    {cleanStatus === "pending" && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider border border-[#55D6BE] text-[#55D6BE] p-[4px_12px] rounded-full">
                                                            Pending
                                                        </span>
                                                    )}
                                                    {cleanStatus === "completed" && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider bg-[#55D6BE] text-[#081521] p-[4px_12px] rounded-full">
                                                            Completed
                                                        </span>
                                                    )}
                                                    {cleanStatus === "cancelled" && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider border border-[rgba(194,199,208,0.8)] text-[#C2C7D0] p-[4px_12px] rounded-full">
                                                            Cancelled
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Chevron */}
                                                <div className="flex justify-end text-gray-500">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
