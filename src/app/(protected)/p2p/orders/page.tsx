"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Aside } from "@/app/components/Aside";
import { Header } from "@/app/components/Header";
import { OrderNavbar } from "../components/OrderNavbar";
import { useUser } from "@/features/user/presentation/context/UserContext";
import type { Order } from "@/features/order/models/order";
import { useOrders } from "@/features/order/hooks/useOrders";
import { ChevronRight, Calendar, ShoppingCart, TrendingUp } from "lucide-react";

function belongsToUser(order: Order, userId?: string) {
  if (!userId) return false;
  return order.buyerId === userId || order.sellerId === userId;
}

function formatOrderRow(order: Order, userId?: string) {
  const isBuy = order.buyerId === userId;
  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()
    : "N/A";

  const priceNum = parseFloat(order.offer?.price || "0") || 1;
  const assetAmountNum = parseFloat(order.assetAmount) || 0;
  const totalFiat = parseFloat(order.fiatAmount) || (assetAmountNum * priceNum);

  return {
    orderId: order.orderId,
    isBuy,
    assetAmount: assetAmountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
    assetCode: order.offer?.assetCode || order.assetCode || "USDC",
    counterparty: {
      alias: isBuy ? (order.seller?.alias || "Merchant") : (order.buyer?.alias || "Buyer"),
      kycStatus: isBuy ? order.seller?.kycStatus : order.buyer?.kycStatus,
      profileImageUrl: isBuy ? order.seller?.profileImageUrl : order.buyer?.profileImageUrl,
    },
    dateStr: formattedDate,
    valueUsd: totalFiat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    gasFee: isBuy ? "0.01" : "0.00",
    status: order.orderStatus === "completed" || order.escrow?.escrowStatus === "released"
      ? "completed"
      : order.orderStatus === "cancelled"
        ? "cancelled"
        : "pending",
  };
}

function OrdersSkeleton() {
  return (
    <div data-testid="orders-skeleton" aria-busy="true" aria-label="Loading orders" className="flex flex-col">
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          className="grid grid-cols-1 md:grid-cols-[1.5fr_1.2fr_1fr_1.2fr_1fr_40px] gap-4 p-6 border-b border-[rgba(22,22,24,0.05)] items-center animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#172B3A]" />
            <div className="h-4 w-32 bg-[#172B3A] rounded" />
          </div>
          <div className="h-4 w-24 bg-[#172B3A] rounded" />
          <div className="h-4 w-20 bg-[#172B3A] rounded" />
          <div className="h-4 w-16 bg-[#172B3A] rounded ml-auto" />
          <div className="h-6 w-20 bg-[#172B3A] rounded-full mx-auto" />
          <div className="h-4 w-4 bg-[#172B3A] rounded ml-auto" />
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const { orders: realOrders, fetchUserOrders, isLoading, hasFetched, error, refetch } = useOrders();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [operationFilter, setOperationFilter] = useState("All");

  useEffect(() => {
    if (currentUser?.userId) {
      fetchUserOrders(currentUser.userId);
    }
  }, [currentUser?.userId, fetchUserOrders]);

  const formattedOrders = useMemo(() => {
    return (realOrders || [])
      .filter((order) => belongsToUser(order, currentUser?.userId))
      .map((order) => formatOrderRow(order, currentUser?.userId));
  }, [realOrders, currentUser?.userId]);

  const filteredOrders = useMemo(() => {
    return formattedOrders.filter((o) => {
      if (statusFilter !== "ALL" && o.status.toUpperCase() !== statusFilter) {
        return false;
      }
      if (operationFilter !== "All") {
        if (operationFilter === "Buy" && !o.isBuy) return false;
        if (operationFilter === "Sell" && o.isBuy) return false;
      }
      return true;
    });
  }, [formattedOrders, statusFilter, operationFilter]);

  const handleRowClick = (orderId: string) => {
    // All rows navigate to the real order flow. Mock ids (when present) fall
    // through to the backend lookup and surface a not-found state instead of
    // fabricated data — see IKSH-46 and IKSH-19.
    router.push(`/p2p/orders/${orderId}`);
  };

  const handleRetry = () => {
    void refetch();
  };

  return (
    <div className="flex min-h-screen w-full bg-[#081521] text-white font-space">
      <Aside />
      <div className="flex flex-col flex-1 min-w-0 pb-20 md:pb-0">
        <Header description="trading floor" title="p2p marketplace" />
        <OrderNavbar />

        <main className="flex-1 px-4 md:px-16 pb-12 pt-0 w-full flex flex-col lg:flex-row gap-8 items-start">
          
          {/* SECCIÓN FILTROS (Columna Izquierda) */}
          <div className="w-full lg:w-[378.88px] flex flex-col gap-6 shrink-0 pt-4 lg:pt-12">
            <h2 className="text-[20px] font-black tracking-[-0.6px] uppercase text-white pl-1">
              Filters
            </h2>

            {/* Caja de Filtros Principal */}
            <div className="bg-[#0D1D2C] border border-[#263949] rounded-3xl p-6 flex flex-col gap-6">
              
              {/* Campo Operations */}
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

              {/* Status Chips Row */}
              <div className="flex flex-col gap-3">
                <label id="order-status-filter-label" className="text-[10px] text-[#64748B] font-bold tracking-[1px] uppercase">
                  Filter By Status
                </label>
                <div role="group" aria-labelledby="order-status-filter-label" className="flex flex-wrap gap-2">
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

            </div>

            {/* Caja de Date Range */}
            <div className="bg-[#0D1D2C] border border-[#263949] rounded-3xl p-6 flex flex-col gap-3">
              <label className="text-[10px] text-[#64748B] font-bold tracking-[1px] uppercase">
                Date Range
              </label>
              <div className="flex items-center gap-3 text-white text-xs font-bold uppercase tracking-[-0.3px]">
                <Calendar className="w-4 h-4 text-[#64748B]" />
                <span>Oct 01, 2026 — Oct 31, 2026</span>
              </div>
            </div>

          </div>

          {/* SECCIÓN TABLA DE ORDENES (Columna Derecha) */}
          <div className="w-full flex-1 bg-[#0D1D2C] border border-[#263949] rounded-[24px] overflow-hidden mt-4 lg:mt-12">
            
            {/* Headers de la Tabla */}
            <div className="hidden md:grid grid-cols-[1.5fr_1.2fr_1fr_1.2fr_1fr_40px] bg-[#081521] p-4 border-b border-[rgba(69,73,50,0.1)] text-[10px] text-[#64748B] font-bold tracking-[1px] uppercase select-none">
              <div>Asset & Type</div>
              <div>Counterparty</div>
              <div>Date</div>
              <div className="text-right">Value (USD)</div>
              <div className="text-center">Status</div>
              <div />
            </div>

            {/* Body de la Tabla */}
            <div className="flex flex-col">
              {isLoading || (!hasFetched && !error) ? (
                <OrdersSkeleton />
              ) : error ? (
                <div
                  data-testid="orders-error"
                  role="alert"
                  className="flex flex-col items-center justify-center p-20 text-gray-500"
                >
                  <ShoppingCart className="w-12 h-12 mb-4 stroke-1" />
                  <p className="font-bold text-center">Could not load your orders.</p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-4 bg-[#55D6BE] text-black text-sm font-bold px-5 py-2 rounded-lg cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div
                  data-testid="orders-empty"
                  className="flex flex-col items-center justify-center p-20 text-gray-500"
                >
                  <ShoppingCart className="w-12 h-12 mb-4 stroke-1" />
                  <p className="font-bold text-center">
                    {formattedOrders.length === 0
                      ? "You do not have any orders yet."
                      : "No orders match selected filters."}
                  </p>
                </div>
              ) : (
                filteredOrders.map((o) => (
                  <div
                    key={o.orderId}
                    data-order-id={o.orderId}
                    onClick={() => handleRowClick(o.orderId)}
                    className="grid grid-cols-1 md:grid-cols-[1.5fr_1.2fr_1fr_1.2fr_1fr_40px] gap-4 p-6 border-b border-[rgba(22,22,24,0.05)] items-center hover:bg-[#1C1C1F] transition-colors cursor-pointer select-none"
                  >
                    {/* ASSET & TYPE */}
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                          o.isBuy
                            ? "bg-[rgba(249,115,22,0.1)] border-[rgba(249,115,22,0.2)] text-[#F97316]"
                            : "bg-[rgba(218,255,0,0.1)] border-[rgba(218,255,0,0.2)] text-[#55D6BE]"
                        }`}
                      >
                        {o.isBuy ? (
                          <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-extrabold uppercase tracking-tight">
                          <span className={o.isBuy ? "text-[#55D6BE]" : "text-[#55D6BE]"}>
                            {o.isBuy ? "Buying" : "Selling"}{" "}
                          </span>
                          {o.assetAmount} {o.assetCode}
                        </span>
                      </div>
                    </div>

                    {/* COUNTERPARTY */}
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#35343A] overflow-hidden flex items-center justify-center text-[10px] font-black text-[#CBD5E1]">
                        {o.counterparty.profileImageUrl ? (
                          <img src={o.counterparty.profileImageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          o.counterparty.alias[0]?.toUpperCase()
                        )}
                      </div>
                      <span className="text-xs font-semibold text-[#CBD5E1]">
                        {o.counterparty.alias}
                      </span>
                    </div>

                    {/* DATE */}
                    <div className="text-xs text-[#94A3B8] font-bold uppercase">
                      {o.dateStr}
                    </div>

                    {/* VALUE (USD) */}
                    <div className="flex flex-col items-end gap-0.5 pr-2">
                      <span className="text-sm font-black text-white">${o.valueUsd}</span>
                      <span className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider">
                        GAS: ${o.gasFee}
                      </span>
                    </div>

                    {/* STATUS PILL */}
                    <div className="flex justify-center">
                      {o.status === "pending" && (
                        <span className="text-[9px] font-bold uppercase tracking-wider border border-[#55D6BE] text-[#55D6BE] p-[4px_12px] rounded-full">
                          Pending
                        </span>
                      )}
                      {o.status === "completed" && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-[#55D6BE] text-[#081521] p-[4px_12px] rounded-full">
                          Completed
                        </span>
                      )}
                      {o.status === "cancelled" && (
                        <span className="text-[9px] font-bold uppercase tracking-wider border border-[rgba(194,199,208,0.8)] text-[#C2C7D0] p-[4px_12px] rounded-full">
                          Cancelled
                        </span>
                      )}
                    </div>

                    {/* CHEVRON */}
                    <div className="flex justify-end text-gray-500 md:flex">
                      <ChevronRight className="w-4 h-4" />
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
