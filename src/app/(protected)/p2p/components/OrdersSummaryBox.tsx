"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrders } from "@/features/order/hooks/useOrders";
import { useUser } from "@/features/user/presentation/context/UserContext";
import type { Order } from "@/features/order/models/order";
import { ShoppingCart, Check, ExternalLink, X } from "lucide-react";

export function OrdersSummaryBox() {
  const router = useRouter();
  const { currentUser } = useUser();
  const { orders: realOrders, fetchUserOrders } = useOrders();

  useEffect(() => {
    if (currentUser?.userId) {
      fetchUserOrders(currentUser.userId);
    }
  }, [currentUser?.userId, fetchUserOrders]);

  const formattedReal = (realOrders || []).map((o: Order) => {
    const isBuy = o.buyerId === currentUser?.userId;
    const dateStr = o.createdAt 
      ? new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()
      : "OCT 22, 2026";
    
    const status = o.orderStatus === "completed" || o.escrow?.escrowStatus === "released" 
      ? "completed" 
      : o.orderStatus === "cancelled" 
      ? "cancelled" 
      : "pending";

    return {
      orderId: o.orderId,
      isBuy,
      assetAmount: parseFloat(o.assetAmount).toLocaleString(undefined, { maximumFractionDigits: 4 }),
      assetCode: o.offer?.assetCode || o.assetCode || "USDC",
      subtext: status === "pending" ? "WAITING FOR PAYMENT" : dateStr,
      status,
    };
  });

  // Only real orders are shown (no mock fallback) — see IKSH-46.
  const finalOrders = formattedReal.slice(0, 3);

  const handleItemClick = (orderId: string) => {
    router.push(`/p2p/orders/${orderId}`);
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black text-[20px] tracking-[-0.6px] uppercase">My Orders</h3>
        <button 
          onClick={() => router.push("/p2p/orders")}
          className="text-[#9BABB7] hover:text-white transition-colors cursor-pointer"
        >
          <ExternalLink className="w-5 h-5" />
        </button>
      </div>

      {/* Orders List */}
      <div className="flex flex-col gap-4">
        {finalOrders.map((order) => {
          const isPending = order.status === "pending";
          const isCompleted = order.status === "completed";

          return (
            <div
              key={order.orderId}
              onClick={() => handleItemClick(order.orderId)}
              className="group flex items-center justify-between bg-[#0D1D2C] border border-[#263949] hover:border-[#55D6BE]/40 hover:shadow-[0_0_15px_rgba(85,214,190,0.15)] rounded-3xl p-5 cursor-pointer transition-all duration-300 select-none"
            >
              <div className="flex items-center gap-4">
                {/* Icon Container */}
                <div 
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    isPending
                      ? "bg-[#1C1F10] border border-[#55D6BE]/20"
                      : isCompleted
                      ? "bg-[#0B1E13] border border-[#10B981]/10"
                      : "bg-[#11212E]"
                  }`}
                >
                  {isPending ? (
                    <ShoppingCart className="w-5 h-5 text-[#55D6BE]" />
                  ) : isCompleted ? (
                    <Check className="w-5 h-5 text-[#10B981]" />
                  ) : (
                    <X className="w-5 h-5 text-[#6B7280]" />
                  )}
                </div>

                {/* Text Group */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-white font-extrabold text-sm tracking-tight">
                    {isCompleted ? (order.isBuy ? "Bought" : "Sold") : (order.isBuy ? "Buying" : "Selling")}{" "}
                    <span className="font-extrabold">{order.assetAmount}</span> {order.assetCode}
                  </span>
                  <span className="text-[10px] text-[#64748B] font-bold tracking-wider uppercase">
                    {order.subtext}
                  </span>
                </div>
              </div>

              {/* Status Display */}
              <div className="text-right">
                <span 
                  className={`text-xs font-bold ${
                    isPending
                      ? "text-[#EAB308]"
                      : isCompleted
                      ? "text-[#10B981]"
                      : "text-[#6B7280]"
                  }`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Full History Button */}
      <button
        onClick={() => router.push("/p2p/orders")}
        className="w-full bg-[#263949]/40 hover:bg-[#263949]/80 text-white font-bold text-sm py-4 rounded-3xl transition-colors cursor-pointer text-center"
      >
        View Full History
      </button>
    </div>
  );
}
