"use client";

import { useUsdcPrice } from "@/features/market-data/hooks/useUsdcPrice";
import { formatUsdcPrice } from "@/features/market-data/utils/format-price";
import { useOfferCounts } from "@/features/offer/hooks/useOfferCounts";

// ─── Small sub-components ────────────────────────────────────────────────────

/** Animated skeleton bar used during loading states. */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded bg-[#172B3A] animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

/**
 * MarketSnapshot
 *
 * Displays a live summary of the LocalSettle P2P market:
 *  - Number of active buy offers
 *  - Number of active sell offers
 *  - Current USDC/USD price (refreshed every 60 s)
 *
 * Design reference: Figma node 547-2372
 *
 * The component is purely presentational — all data fetching lives in
 * useOfferCounts() and useUsdcPrice().
 */
export function MarketSnapshot() {
  const { buyCount, sellCount, isLoading: countsLoading } = useOfferCounts();
  const { price, status: priceStatus } = useUsdcPrice();

  // ── USDC price display ─────────────────────────────────────────────────────
  const renderPrice = () => {
    if (priceStatus === "loading") {
      return <Skeleton className="h-7 w-28 mt-0.5" />;
    }
    if (priceStatus === "error") {
      return (
        <span className="text-[#9BABB7] text-sm font-medium">
          Price unavailable
        </span>
      );
    }
    // "stale" or "success" — both have a valid price value
    return (
      <div className="flex items-baseline gap-1.5">
        <span className="text-white font-bold text-lg tabular-nums">
          {price !== null ? formatUsdcPrice(price) : "—"}
        </span>
        <span className="text-[#9BABB7] text-sm font-semibold">USD</span>
        {priceStatus === "stale" && (
          <span
            title="Price may be outdated"
            className="ml-1 text-[10px] text-yellow-500 font-bold uppercase tracking-wide"
          >
            ⚠ Stale
          </span>
        )}
      </div>
    );
  };

  // ── Offer count display ────────────────────────────────────────────────────
  const renderCount = (count: number | null) => {
    if (countsLoading) return <Skeleton className="h-5 w-7 inline-block" />;
    if (count === null) return <span className="text-[#9BABB7]">—</span>;
    return (
      <span className="text-[#55D6BE] font-bold tabular-nums">{count}</span>
    );
  };

  return (
    <div
      className="w-full rounded-2xl bg-[#0D1D2C] border border-[#263949] px-5 py-4 md:px-6 md:py-5"
      role="region"
      aria-label="Market Snapshot"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4">
        {/* ⓘ icon — matches the circled-i in the Figma design */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <circle
            cx="9"
            cy="9"
            r="8"
            stroke="#55D6BE"
            strokeWidth="1.5"
          />
          <path
            d="M9 8v5M9 6.5v.5"
            stroke="#55D6BE"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-white font-bold text-base tracking-wide">
          Market Snapshot
        </span>
      </div>

      {/* ── Two-column body ─────────────────────────────────────────────────── */}
      <div className="flex items-stretch gap-0">

        {/* Left column — Offers ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 flex-1 pr-4 md:pr-6">
          <span className="text-[#A1969C] text-[11px] font-bold tracking-[0.12em] uppercase">
            Offers
          </span>
          <div className="flex items-center gap-6">
            <span className="text-white text-sm font-semibold">
              Buy:{" "}
              {renderCount(buyCount)}
            </span>
            <span className="text-white text-sm font-semibold">
              Sell:{" "}
              {renderCount(sellCount)}
            </span>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="w-px bg-[#263949] self-stretch mx-2 md:mx-4 shrink-0" />

        {/* Right column — USDC Price ──────────────────────────────────────── */}
        <div className="flex flex-col gap-2 flex-1 pl-4 md:pl-6">
          <span className="text-[#A1969C] text-[11px] font-bold tracking-[0.12em] uppercase">
            USDC Price
          </span>
          {renderPrice()}
        </div>
      </div>
    </div>
  );
}
