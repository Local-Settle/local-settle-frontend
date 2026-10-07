"use client";

import { useState, useRef, useCallback } from "react";
import { OfferFilters as OfferFiltersType, DEFAULT_FILTERS } from "../types/offer-filter.types";
import { FilterValidationErrors } from "../types/offer-filter.types";
import { OfferSortSelect } from "./OfferSortSelect";

interface OfferFiltersProps {
    filters: OfferFiltersType;
    draftFilters: OfferFiltersType;
    errors: FilterValidationErrors;
    activeFilterCount: number;
    availablePaymentMethods: string[];
    availableAssets: string[];
    /** Called immediately on desktop for each individual filter change */
    onFilterChange: <K extends keyof OfferFiltersType>(key: K, value: OfferFiltersType[K]) => void;
    /** Called from the mobile drawer to update draft state */
    onDraftFilterChange: <K extends keyof OfferFiltersType>(key: K, value: OfferFiltersType[K]) => void;
    /** Commits the mobile draft to live state */
    onApplyDraft: () => void;
    onClearFilters: () => void;
}

// ----------------------------------------------------------
// Small reusable sub-components
// ----------------------------------------------------------

function FilterSelect({
    id,
    label,
    value,
    options,
    placeholder,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    options: string[];
    placeholder: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-[#9BABB7] text-[10px] font-bold tracking-widest uppercase">
                {label}
            </label>
            <div className="relative">
                <select
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="appearance-none w-full bg-[#1a1a1c] border border-[#263949] rounded-xl px-4 pr-8 py-2.5
                               text-white text-sm font-medium cursor-pointer
                               focus:outline-none focus:ring-2 focus:ring-[#55D6BE]/40 focus:border-[#55D6BE]/60
                               hover:border-[#55D6BE]/30 transition-colors duration-200"
                >
                    <option value="" className="bg-[#0D1D2C]">{placeholder}</option>
                    {options.map((opt) => (
                        <option key={opt} value={opt} className="bg-[#0D1D2C]">{opt}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

// Controlled variant — used by the mobile drawer where values are committed on Apply.
function AmountInput({
    id,
    label,
    value,
    placeholder,
    error,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    placeholder: string;
    error?: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-[#9BABB7] text-[10px] font-bold tracking-widest uppercase">
                {label}
            </label>
            <input
                id={id}
                type="number"
                value={value}
                placeholder={placeholder}
                min={0}
                step="0.01"
                onKeyDown={(e) => ["-", "e", "E"].includes(e.key) && e.preventDefault()}
                onChange={(e) => onChange(e.target.value)}
                className={`bg-[#1a1a1c] border rounded-xl px-4 py-2.5 text-white text-sm font-medium
                            placeholder:text-[#4a4a4a] focus:outline-none transition-colors duration-200
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                            [&::-webkit-inner-spin-button]:appearance-none
                            ${error
                                ? "border-red-500/60 focus:ring-2 focus:ring-red-500/30"
                                : "border-[#263949] hover:border-[#55D6BE]/30 focus:ring-2 focus:ring-[#55D6BE]/40 focus:border-[#55D6BE]/60"
                            }`}
            />
            {error && (
                <span className="text-red-400 text-[10px] font-medium leading-tight">{error}</span>
            )}
        </div>
    );
}

// Uncontrolled variant — used by the desktop bar so the input is not controlled
// by React state, eliminating the need for setState-in-effect sync.
// A `resetKey` that changes when the external value is cleared forces a remount,
// resetting the input to its `defaultValue` without any useEffect.
function UncontrolledAmountInput({
    id,
    label,
    defaultValue,
    resetKey,
    placeholder,
    error,
    onChange,
}: {
    id: string;
    label: string;
    defaultValue: string;
    resetKey: string;
    placeholder: string;
    error?: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-[#9BABB7] text-[10px] font-bold tracking-widest uppercase">
                {label}
            </label>
            <input
                key={resetKey}
                id={id}
                type="number"
                defaultValue={defaultValue}
                placeholder={placeholder}
                min={0}
                step="0.01"
                onKeyDown={(e) => ["-", "e", "E"].includes(e.key) && e.preventDefault()}
                onChange={(e) => { const v = e.target.value; onChange(v); }}
                className={`bg-[#1a1a1c] border rounded-xl px-4 py-2.5 text-white text-sm font-medium
                            placeholder:text-[#4a4a4a] focus:outline-none transition-colors duration-200
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                            [&::-webkit-inner-spin-button]:appearance-none
                            ${error
                                ? "border-red-500/60 focus:ring-2 focus:ring-red-500/30"
                                : "border-[#263949] hover:border-[#55D6BE]/30 focus:ring-2 focus:ring-[#55D6BE]/40 focus:border-[#55D6BE]/60"
                            }`}
            />
            {error && (
                <span className="text-red-400 text-[10px] font-medium leading-tight">{error}</span>
            )}
        </div>
    );
}

// ----------------------------------------------------------
// Desktop filter bar
// ----------------------------------------------------------
function DesktopFilterBar({
    filters,
    errors,
    availablePaymentMethods,
    availableAssets,
    onFilterChange,
}: Pick<OfferFiltersProps, "filters" | "errors" | "availablePaymentMethods" | "availableAssets" | "onFilterChange">) {
    // Debounce refs — no local state required.
    const minDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
    const maxDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    // These keys change when the filter is externally cleared (e.g. "Clear filters").
    // Changing a key forces React to remount the input, resetting it to defaultValue
    // without needing useState or useEffect.
    const minResetKey = `min-${filters.minAmount === "" ? "empty" : "set"}`;
    const maxResetKey = `max-${filters.maxAmount === "" ? "empty" : "set"}`;

    const handleMinChange = useCallback((v: string) => {
        if (minDebounce.current) clearTimeout(minDebounce.current);
        minDebounce.current = setTimeout(() => onFilterChange("minAmount", v), 600);
    }, [onFilterChange]);

    const handleMaxChange = useCallback((v: string) => {
        if (maxDebounce.current) clearTimeout(maxDebounce.current);
        maxDebounce.current = setTimeout(() => onFilterChange("maxAmount", v), 600);
    }, [onFilterChange]);

    return (
        <div className="hidden md:flex flex-wrap items-end gap-3 w-full">
            <FilterSelect
                id="desktop-payment-method"
                label="Payment Method"
                value={filters.paymentMethod}
                options={availablePaymentMethods}
                placeholder="All Methods"
                onChange={(v) => onFilterChange("paymentMethod", v)}
            />
            <FilterSelect
                id="desktop-asset"
                label="Asset"
                value={filters.asset}
                options={availableAssets}
                placeholder="All Assets"
                onChange={(v) => onFilterChange("asset", v)}
            />
            <UncontrolledAmountInput
                id="desktop-min-amount"
                label="Min Amount"
                defaultValue={filters.minAmount}
                resetKey={minResetKey}
                placeholder="0.00"
                error={errors.minAmount}
                onChange={handleMinChange}
            />
            <UncontrolledAmountInput
                id="desktop-max-amount"
                label="Max Amount"
                defaultValue={filters.maxAmount}
                resetKey={maxResetKey}
                placeholder="No limit"
                error={errors.maxAmount}
                onChange={handleMaxChange}
            />
            <div className="flex flex-col gap-1.5">
                <label className="text-[#9BABB7] text-[10px] font-bold tracking-widest uppercase">Sort By</label>
                <OfferSortSelect
                    value={filters.sort}
                    onChange={(v) => onFilterChange("sort", v)}
                />
            </div>
        </div>
    );
}

// ----------------------------------------------------------
// Mobile filter drawer
// ----------------------------------------------------------
function MobileFilterDrawer({
    isOpen,
    draftFilters,
    errors,
    availablePaymentMethods,
    availableAssets,
    onDraftFilterChange,
    onApplyDraft,
    onClearFilters,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
} & Pick<OfferFiltersProps, "draftFilters" | "errors" | "availablePaymentMethods" | "availableAssets" | "onDraftFilterChange" | "onApplyDraft" | "onClearFilters">) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end md:hidden"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Sheet */}
            <div
                className="relative z-10 w-full bg-[#081521] border-t border-[#263949] rounded-t-3xl p-6 pb-8 flex flex-col gap-5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-bold text-base">Filters &amp; Sorting</h3>
                    <button onClick={onClose} className="text-[#6b7280] hover:text-white transition-colors p-1">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Drag handle */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-[#263949]" />

                <FilterSelect
                    id="mobile-payment-method"
                    label="Payment Method"
                    value={draftFilters.paymentMethod}
                    options={availablePaymentMethods}
                    placeholder="All Methods"
                    onChange={(v) => onDraftFilterChange("paymentMethod", v)}
                />
                <FilterSelect
                    id="mobile-asset"
                    label="Asset"
                    value={draftFilters.asset}
                    options={availableAssets}
                    placeholder="All Assets"
                    onChange={(v) => onDraftFilterChange("asset", v)}
                />
                <div className="grid grid-cols-2 gap-3">
                    <AmountInput
                        id="mobile-min-amount"
                        label="Min Amount"
                        value={draftFilters.minAmount}
                        placeholder="0.00"
                        error={errors.minAmount}
                        onChange={(v) => onDraftFilterChange("minAmount", v)}
                    />
                    <AmountInput
                        id="mobile-max-amount"
                        label="Max Amount"
                        value={draftFilters.maxAmount}
                        placeholder="No limit"
                        error={errors.maxAmount}
                        onChange={(v) => onDraftFilterChange("maxAmount", v)}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-[#9BABB7] text-[10px] font-bold tracking-widest uppercase">Sort By</span>
                    <OfferSortSelect
                        value={draftFilters.sort}
                        onChange={(v) => onDraftFilterChange("sort", v)}
                    />
                </div>

                <div className="flex gap-3 mt-2">
                    <button
                        onClick={() => { onClearFilters(); onClose(); }}
                        className="flex-1 py-3 rounded-xl border border-[#263949] text-[#9BABB7] text-sm font-bold
                                   hover:border-[#55D6BE]/30 hover:text-white transition-colors duration-200"
                    >
                        Clear All
                    </button>
                    <button
                        onClick={() => { onApplyDraft(); onClose(); }}
                        className="flex-[2] py-3 rounded-xl bg-[#55D6BE] text-black text-sm font-bold
                                   hover:bg-[#55D6BE] transition-colors duration-200
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={Object.keys(errors).length > 0}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------
// Public component
// ----------------------------------------------------------
export function OfferFilters({
    filters,
    draftFilters,
    errors,
    activeFilterCount,
    availablePaymentMethods,
    availableAssets,
    onFilterChange,
    onDraftFilterChange,
    onApplyDraft,
    onClearFilters,
}: OfferFiltersProps) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const isDefault =
        filters.paymentMethod === DEFAULT_FILTERS.paymentMethod &&
        filters.asset === DEFAULT_FILTERS.asset &&
        filters.minAmount === DEFAULT_FILTERS.minAmount &&
        filters.maxAmount === DEFAULT_FILTERS.maxAmount &&
        filters.sort === DEFAULT_FILTERS.sort;

    return (
        <>
            <div className="w-full flex items-center justify-between gap-4 flex-wrap">
                {/* Desktop bar */}
                <DesktopFilterBar
                    filters={filters}
                    errors={errors}
                    availablePaymentMethods={availablePaymentMethods}
                    availableAssets={availableAssets}
                    onFilterChange={onFilterChange}
                />

                {/* Mobile trigger */}
                <button
                    id="mobile-filter-trigger"
                    onClick={() => setIsDrawerOpen(true)}
                    className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl
                               bg-[#1a1a1c] border border-[#263949] text-white text-sm font-bold
                               hover:border-[#55D6BE]/40 transition-colors duration-200 relative"
                    aria-label={`Open filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ""}`}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#55D6BE] text-black text-[10px] font-bold flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                </button>

                {/* Clear filters (desktop — visible when any filter is active) */}
                {!isDefault && (
                    <button
                        id="clear-filters-btn"
                        onClick={onClearFilters}
                        className="hidden md:flex items-center gap-1.5 text-[#9BABB7] hover:text-[#55D6BE]
                                   text-xs font-bold tracking-wide transition-colors duration-200"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                        Clear filters
                    </button>
                )}
            </div>

            {/* Mobile drawer */}
            <MobileFilterDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                draftFilters={draftFilters}
                errors={errors}
                availablePaymentMethods={availablePaymentMethods}
                availableAssets={availableAssets}
                onDraftFilterChange={onDraftFilterChange}
                onApplyDraft={onApplyDraft}
                onClearFilters={onClearFilters}
            />
        </>
    );
}
