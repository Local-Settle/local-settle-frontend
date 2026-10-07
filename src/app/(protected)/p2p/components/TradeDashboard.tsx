"use client";

import { useEffect, useMemo, useState } from "react";
import { Suspense } from "react";
import dynamic from "next/dynamic";
const CreateOfferModal = dynamic(() => import("./CreateOfferModal").then((mod) => mod.CreateOfferModal), { ssr: false });
const ConfirmOrderModal = dynamic(() => import("./ConfirmOrderModal").then((mod) => mod.ConfirmOrderModal), { ssr: false });
import { useOffers } from "@/features/offer/hooks/useOffers";
import { useOfferFilters } from "@/features/offer/hooks/useOfferFilters";
import { useUsers } from "@/features/user/hooks/useUsers";
import { useUser } from "@/features/user/presentation/context/UserContext";
import { KycBanner } from "@/app/components/KycBanner";
import { useWalletBalance } from "@/features/wallet/presentation/hooks/useWalletBalance";
import { Offer } from "@/features/offer/models/offer";
import { OfferFilters } from "@/features/offer/components/OfferFilters";
import { buildOfferQuery } from "@/features/offer/utils/build-offer-query";
import { PaymentMethodOption } from "@/features/paymentMethod/models/paymentMethod";
import { getRovingFocusIndex } from "@/utils/keyboardNavigation";

const tradeTabs = ["Buy", "Sell"] as const;

// ----------------------------------------------------------
// Helper: resolve a payment method option to a display name
// ----------------------------------------------------------
function resolvePaymentMethodName(pm: PaymentMethodOption): string {
    return (
        pm.payment_provider?.name ||
        pm.paymentProvider?.name ||
        pm.bankName ||
        pm.type ||
        ""
    );
}

// ----------------------------------------------------------
// MerchantBalance sub-component
// ----------------------------------------------------------
function MerchantBalance({ publicKey, assetCode }: { publicKey?: string; assetCode?: string }) {
    const { balance, balances, isLoading } = useWalletBalance(publicKey || null);

    if (isLoading) return <span className="animate-pulse">...</span>;
    if (!publicKey) return <span>0.00</span>;

    const normalizedAssetCode = assetCode === "XLM" || assetCode === "native" ? "native" : assetCode;

    if (normalizedAssetCode === "native") {
        return <span>{balance || "0.00"}</span>;
    }

    const asset = balances.find(b => b.asset_code === normalizedAssetCode);
    if (!asset) return <span>0.00</span>;

    return <span>{parseFloat(asset.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
}

// ----------------------------------------------------------
// Sort helper (client-side, does not mutate original array)
// ----------------------------------------------------------
function sortOffers(offers: Offer[], sort: string): Offer[] {
    const arr = [...offers];
    switch (sort) {
        case "price_asc":
            return arr.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        case "price_desc":
            return arr.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        case "newest":
            // If offers had a createdAt, we'd sort by it; fall through to default for now
            return arr;
        case "completion_rate_desc":
        case "best_match":
        default:
            return arr;
    }
}

// ----------------------------------------------------------
// Empty state component
// ----------------------------------------------------------
function EmptyState({ onClear, isFiltered }: { onClear: () => void; isFiltered: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1a1a1c] border border-[#263949] flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4a4a4a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                    <path d="M11 8v6M8 11h6" />
                </svg>
            </div>
            <div className="flex flex-col gap-1.5">
                <p className="text-white font-bold text-base">
                    {isFiltered ? "No offers match your current filters." : "No offers available."}
                </p>
                <p className="text-[#6b7280] text-sm">
                    {isFiltered
                        ? "Try adjusting or clearing your filters to see more results."
                        : "Check back later or create your own offer."}
                </p>
            </div>
            {isFiltered && (
                <button
                    id="empty-state-clear-filters"
                    onClick={onClear}
                    className="px-5 py-2.5 rounded-xl border border-[#55D6BE]/40 text-[#55D6BE] text-sm font-bold
                               hover:bg-[#55D6BE]/10 transition-colors duration-200"
                >
                    Clear all filters
                </button>
            )}
        </div>
    );
}

// ----------------------------------------------------------
// Loading skeleton
// ----------------------------------------------------------
function OfferSkeleton() {
    return (
        <div className="flex flex-col xl:flex-row bg-[#0D1D2C] border border-[#263949] rounded-2xl p-6 gap-6 xl:gap-0 animate-pulse">
            <div className="flex flex-col gap-6 xl:w-[40%]">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#172B3A]" />
                    <div className="flex flex-col gap-2">
                        <div className="h-4 w-28 bg-[#172B3A] rounded" />
                        <div className="h-3 w-20 bg-[#172B3A] rounded" />
                    </div>
                </div>
                <div className="flex gap-12">
                    <div className="h-4 w-20 bg-[#172B3A] rounded" />
                    <div className="h-4 w-24 bg-[#172B3A] rounded" />
                </div>
            </div>
            <div className="flex flex-col gap-3 xl:w-[30%] xl:pl-8 justify-center">
                <div className="h-3 w-24 bg-[#172B3A] rounded" />
                <div className="h-4 w-20 bg-[#172B3A] rounded" />
            </div>
            <div className="flex flex-col items-end gap-5 xl:w-[30%] xl:pr-4 justify-center">
                <div className="h-8 w-32 bg-[#172B3A] rounded" />
                <div className="h-12 w-36 bg-[#172B3A] rounded-xl" />
            </div>
        </div>
    );
}

// ----------------------------------------------------------
// Inner dashboard (needs Suspense for useSearchParams)
// ----------------------------------------------------------
function TradeDashboardInner() {
    const [tab, setTab] = useState("Buy");
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

    const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        const nextIndex = getRovingFocusIndex(event.key, index, tradeTabs.length, "horizontal");
        if (nextIndex === null) return;

        event.preventDefault();
        const nextTab = tradeTabs[nextIndex];
        setTab(nextTab);
        document.getElementById(`tab-${nextTab.toLowerCase()}`)?.focus();
    };

    // Filter state
    const {
        filters,
        draftFilters,
        errors,
        activeFilterCount,
        setFilter,
        setDraftFilter,
        applyDraftFilters,
        clearFilters,
        isFiltersDefault,
    } = useOfferFilters();

    // Build query: type comes from the tab; the rest from active filters
    const apiFilters = useMemo(
        () => buildOfferQuery(tab === "Buy" ? "sell" : "buy", filters),
        [tab, filters]
    );

    const { offers, isLoading } = useOffers(apiFilters);

    // Start with non-executed offers (type + assetCode already filtered by backend).
    // paymentMethod, minAmount, maxAmount, and sort are applied here client-side
    // because the backend does not yet support those query params.
    const visibleOffers = useMemo(() => {
        let result = offers.filter(o => !o.executed);

        // --- paymentMethod filter ---
        if (filters.paymentMethod) {
            result = result.filter(offer => {
                const pms = [
                    ...(offer.payment_methods || []),
                    ...(offer.paymentMethods || []),
                ];
                return pms.some(pm => {
                    const name = resolvePaymentMethodName(pm);
                    return name.toLowerCase() === filters.paymentMethod.toLowerCase();
                });
            });
        }

        // --- minAmount filter ---
        // "min amount" from the user's perspective means:
        // the offer's maxAmount must be >= the user's desired minimum
        // (i.e. the offer can accommodate at least that much)
        if (filters.minAmount && parseFloat(filters.minAmount) > 0) {
            const min = parseFloat(filters.minAmount);
            result = result.filter(o => parseFloat(o.maxAmount) >= min);
        }

        // --- maxAmount filter ---
        // the offer's minAmount must be <= the user's desired maximum
        // (i.e. the offer starts at or below the user's cap)
        if (filters.maxAmount && parseFloat(filters.maxAmount) > 0) {
            const max = parseFloat(filters.maxAmount);
            result = result.filter(o => parseFloat(o.minAmount) <= max);
        }

        return sortOffers(result, filters.sort);
    }, [offers, filters.paymentMethod, filters.minAmount, filters.maxAmount, filters.sort]);

    // Derive available payment methods and assets from current offer set
    const availablePaymentMethods = useMemo(() => {
        const methods = new Set<string>();
        offers.forEach(offer => {
            const pms = [...(offer.payment_methods || []), ...(offer.paymentMethods || [])];
            pms.forEach(pm => {
                const name = resolvePaymentMethodName(pm);
                if (name) methods.add(name);
            });
        });
        return Array.from(methods).sort();
    }, [offers]);

    const availableAssets = useMemo(() => {
        const assets = new Set<string>();
        offers.forEach(offer => {
            if (offer.assetCode) assets.add(offer.assetCode);
        });
        return Array.from(assets).sort();
    }, [offers]);

    const { getUser, userFound } = useUsers();
    const { currentUser } = useUser();
    const isVerified = currentUser?.kycStatus === "approved";

    useEffect(() => {
        offers.forEach((offer) => {
            if (offer?.creatorId) {
                getUser(offer.creatorId);
            }
        });
    }, [offers, getUser]);

    const isFiltered = !isFiltersDefault;

    return (
        <div className="w-full flex flex-col pt-8 pb-12 px-1">
            <KycBanner />

            {/* Top toolbar: Tab switcher + Create button */}
            <div className="w-full mb-6 px-2">
                <div className="flex flex-col md:flex-row items-center justify-between mb-5 gap-4">
                    <div
                        role="tablist"
                        aria-label="Trade type"
                        className="flex bg-[#1a1a1a] rounded-xl p-1 w-full md:w-auto"
                    >
                        {tradeTabs.map((t, index) => (
                            <button
                                key={t}
                                id={`tab-${t.toLowerCase()}`}
                                type="button"
                                role="tab"
                                aria-selected={tab === t}
                                aria-controls={`offers-${t.toLowerCase()}-panel`}
                                tabIndex={tab === t ? 0 : -1}
                                onClick={() => setTab(t)}
                                onKeyDown={(event) => handleTabKeyDown(event, index)}
                                className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-base font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55D6BE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]
                                ${tab === t
                                        ? "bg-[#263949] text-[#55D6BE]"
                                        : "text-[#6b7280] hover:text-white"
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <button
                        id="create-offer-btn"
                        onClick={() => {
                            if (!isVerified) {
                                alert("KYC verification required to create offers.");
                                return;
                            }
                            setIsOpen(true);
                        }}
                        disabled={!isVerified}
                        title={!isVerified ? "KYC verification required" : ""}
                        className={`flex items-center justify-center gap-2 text-base font-bold px-6 py-3 rounded-2xl transition-all duration-200 w-full md:w-auto ${isVerified
                            ? "bg-[#55D6BE] text-black hover:bg-[#55D6BE]"
                            : "bg-gray-700 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        <span className="text-lg leading-none">+</span>
                        Create Offer
                    </button>
                </div>

                {/* Filter bar */}
                <div className="bg-[#0f0f11] border border-[#263949] rounded-2xl p-4">
                    <OfferFilters
                        filters={filters}
                        draftFilters={draftFilters}
                        errors={errors}
                        activeFilterCount={activeFilterCount}
                        availablePaymentMethods={availablePaymentMethods}
                        availableAssets={availableAssets}
                        onFilterChange={setFilter}
                        onDraftFilterChange={setDraftFilter}
                        onApplyDraft={applyDraftFilters}
                        onClearFilters={clearFilters}
                    />
                </div>
            </div>

            {/* Offer list */}
            <div
                id={`offers-${tab.toLowerCase()}-panel`}
                role="tabpanel"
                aria-labelledby={`tab-${tab.toLowerCase()}`}
                tabIndex={0}
                className="flex flex-col w-full px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55D6BE]"
            >
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <OfferSkeleton key={i} />)}
                    </div>
                ) : visibleOffers.length > 0 ? (
                    <div className="space-y-4">
                        {visibleOffers.map((offer) => {
                            const paymentMethods = [
                                ...(offer.payment_methods || []),
                                ...(offer.paymentMethods || [])
                            ];

                            return (
                                <div
                                    key={offer.offerId}
                                    className="flex flex-col xl:flex-row bg-[#0D1D2C] border border-[#263949] rounded-2xl p-6 hover:border-[#55D6BE] hover:bg-[#1A1A1C] transition-all duration-300 group gap-6 xl:gap-0"
                                >
                                    {/* Left: Identity and Capacity */}
                                    <div className="flex flex-col gap-6 xl:w-[40%]">
                                        {/* Identity */}
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full bg-[#263949] overflow-hidden flex items-center justify-center text-[#6b7280] text-xl">
                                                    {userFound[offer.creatorId]?.profileImageUrl ? (
                                                        <img src={userFound[offer.creatorId].profileImageUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        "👤"
                                                    )}
                                                </div>
                                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#55D6BE] border-2 border-[#0D1D2C] rounded-full"></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-base">{userFound[offer.creatorId]?.alias || "Unknown"}</span>
                                                <span className="text-[#55D6BE] text-xs font-semibold mt-0.5 tracking-wide">1,420 ORDERS • 98.5%</span>
                                            </div>
                                        </div>

                                        {/* Capacity */}
                                        <div className="flex gap-12">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[#9BABB7] text-[10px] font-bold tracking-widest uppercase">Available</span>
                                                <span className="text-white font-bold text-sm"><MerchantBalance publicKey={userFound[offer.creatorId]?.publicKey} assetCode={offer.assetCode} /> {offer.assetCode || "BTC"}</span>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[#9BABB7] text-[10px] font-bold tracking-widest uppercase">Limits</span>
                                                <span className="text-white font-bold text-sm">${offer.minAmount} - ${offer.maxAmount}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Center: Payment Methods */}
                                    <div className="flex flex-col gap-4 xl:w-[30%] xl:border-l border-[#263949] xl:pl-8 justify-center">
                                        <span className="text-[#A1969C] text-[10px] font-bold tracking-widest uppercase">Payment Methods</span>
                                        <div className="flex flex-col gap-2.5">
                                            {paymentMethods.length > 0 ? (
                                                paymentMethods.slice(0, 3).map((pm, i) => (
                                                    <span key={i} className="text-white font-bold text-sm uppercase tracking-wide">
                                                        {typeof pm === 'string' ? pm : resolvePaymentMethodName(pm)}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-white font-bold text-sm uppercase tracking-wide">WIRE</span>
                                            )}
                                            {paymentMethods.length > 3 && (
                                                <span className="text-[#9BABB7] font-bold text-xs uppercase tracking-wide">+{paymentMethods.length - 3} MORE</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Price + CTA */}
                                    <div className="flex flex-col items-start xl:items-end gap-5 xl:w-[30%] xl:border-l border-[#263949] xl:pr-4 justify-center">
                                        <div className="flex flex-col items-start xl:items-end gap-1.5">
                                            <span className="text-[#A1969C] text-[10px] font-bold tracking-widest uppercase">Unit Price</span>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-[#55D6BE] font-bold text-[32px] tabular-nums tracking-tight leading-none">
                                                    {parseFloat(offer.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[#9BABB7] font-bold text-sm">USD</span>
                                            </div>
                                        </div>
                                        <button
                                            disabled={!isVerified}
                                            onClick={() => {
                                                if (!isVerified) {
                                                    alert("KYC verification required to trade.");
                                                    return;
                                                }
                                                setSelectedOffer(offer);
                                            }}
                                            className={`w-full max-w-[220px] py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 ${isVerified
                                                ? "bg-[#55D6BE] text-black hover:shadow-[0_0_20px_rgba(85,214,190,0.25)] hover:scale-[1.02] active:scale-[0.98]"
                                                : "bg-gray-700 text-gray-400 cursor-not-allowed"
                                                }`}
                                        >
                                            {tab === "Buy" ? "BUY" : "SELL"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState onClear={clearFilters} isFiltered={isFiltered} />
                )}
            </div>

            {isOpen && (
                <CreateOfferModal onClose={() => setIsOpen(false)} />
            )}

            {selectedOffer && userFound[selectedOffer.creatorId] && (
                <ConfirmOrderModal
                    offer={selectedOffer}
                    creator={userFound[selectedOffer.creatorId]}
                    onClose={() => setSelectedOffer(null)}
                />
            )}
        </div>
    );
}

// ----------------------------------------------------------
// Exported wrapper — Suspense required because useSearchParams
// can only be called inside a Suspense boundary in Next.js App Router.
// ----------------------------------------------------------
export function TradeDashboard() {
    return (
        <Suspense fallback={
            <div className="w-full flex flex-col pt-8 pb-12 px-1 space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-36 bg-[#0D1D2C] border border-[#263949] rounded-2xl animate-pulse" />
                ))}
            </div>
        }>
            <TradeDashboardInner />
        </Suspense>
    );
}
