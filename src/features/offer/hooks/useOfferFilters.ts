"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    OfferFilters,
    DEFAULT_FILTERS,
    FilterValidationErrors,
} from "../types/offer-filter.types";
import {
    parseFiltersFromURL,
    filtersToURLParams,
    validateFilters,
} from "../utils/build-offer-query";

interface UseOfferFiltersReturn {
    filters: OfferFilters;
    draftFilters: OfferFilters;        // for mobile drawer (uncommitted)
    errors: FilterValidationErrors;
    activeFilterCount: number;
    setFilter: <K extends keyof OfferFilters>(key: K, value: OfferFilters[K]) => void;
    setDraftFilter: <K extends keyof OfferFilters>(key: K, value: OfferFilters[K]) => void;
    applyDraftFilters: () => void;
    clearFilters: () => void;
    isFiltersDefault: boolean;
}

export function useOfferFilters(): UseOfferFiltersReturn {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Derive filters directly from the URL — no useState, no useEffect needed.
    // When the URL changes (router.replace or browser back/forward), searchParams
    // updates and this memo recomputes automatically, avoiding setState-in-effect.
    const filters = useMemo(() => parseFiltersFromURL(searchParams), [searchParams]);

    // Draft state for the mobile drawer (committed only when "Apply" is tapped).
    // Initialized from the current URL on mount; reset explicitly by user actions.
    const [draftFilters, setDraftFilters] = useState<OfferFilters>(() =>
        parseFiltersFromURL(searchParams)
    );

    // Validation errors (shared between desktop and mobile drawer)
    const [errors, setErrors] = useState<FilterValidationErrors>({});

    // Push a full filter object into the URL
    const pushToURL = useCallback(
        (next: OfferFilters) => {
            const qs = filtersToURLParams(next);
            router.replace(qs ? `?${qs}` : "?", { scroll: false });
        },
        [router]
    );

    // Set a single filter key on desktop — validates then pushes to URL.
    // Because `filters` is derived from the URL via useMemo, updating the URL
    // automatically updates `filters` on the next render with no extra setState.
    const setFilter = useCallback(
        <K extends keyof OfferFilters>(key: K, value: OfferFilters[K]) => {
            const next = { ...filters, [key]: value };
            const errs = validateFilters(next);
            setErrors(errs);
            if (Object.keys(errs).length === 0) {
                pushToURL(next);
            }
        },
        [filters, pushToURL]
    );

    // Update a single draft key in the mobile drawer (doesn't touch the URL)
    const setDraftFilter = useCallback(
        <K extends keyof OfferFilters>(key: K, value: OfferFilters[K]) => {
            setDraftFilters((prev) => {
                const next = { ...prev, [key]: value };
                const errs = validateFilters(next);
                setErrors(errs);
                return next;
            });
        },
        []
    );

    // Commit the mobile drawer draft → URL
    const applyDraftFilters = useCallback(() => {
        const errs = validateFilters(draftFilters);
        setErrors(errs);
        if (Object.keys(errs).length === 0) {
            pushToURL(draftFilters);
        }
    }, [draftFilters, pushToURL]);

    // Reset everything — clears draft, errors, and removes all URL params
    const clearFilters = useCallback(() => {
        setDraftFilters(DEFAULT_FILTERS);
        setErrors({});
        router.replace("?", { scroll: false });
    }, [router]);

    // Computed helpers
    const activeFilterCount = [
        filters.paymentMethod,
        filters.asset,
        filters.minAmount,
        filters.maxAmount,
        filters.minPrice,
        filters.maxPrice,
        filters.sort !== "best_match" ? filters.sort : "",
    ].filter(Boolean).length;

    const isFiltersDefault =
        filters.paymentMethod === DEFAULT_FILTERS.paymentMethod &&
        filters.asset === DEFAULT_FILTERS.asset &&
        filters.minAmount === DEFAULT_FILTERS.minAmount &&
        filters.maxAmount === DEFAULT_FILTERS.maxAmount &&
        filters.minPrice === DEFAULT_FILTERS.minPrice &&
        filters.maxPrice === DEFAULT_FILTERS.maxPrice &&
        filters.sort === DEFAULT_FILTERS.sort;

    return {
        filters,
        draftFilters,
        errors,
        activeFilterCount,
        setFilter,
        setDraftFilter,
        applyDraftFilters,
        clearFilters,
        isFiltersDefault,
    };
}
