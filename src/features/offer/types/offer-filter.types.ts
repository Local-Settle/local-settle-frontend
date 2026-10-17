export type SortOption =
    | "best_match"
    | "price_asc"
    | "price_desc"
    | "completion_rate_desc"
    | "newest";

export interface OfferFilters {
    paymentMethod: string;   // "" means "All"
    asset: string;           // "" means "All"
    minAmount: string;       // raw string, validated before use
    maxAmount: string;
    minPrice: string;
    maxPrice: string;
    sort: SortOption;
}

export const DEFAULT_FILTERS: OfferFilters = {
    paymentMethod: "",
    asset: "",
    minAmount: "",
    maxAmount: "",
    minPrice: "",
    maxPrice: "",
    sort: "best_match",
};

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "best_match",          label: "Best Match" },
    { value: "price_asc",           label: "Price: Lowest to Highest" },
    { value: "price_desc",          label: "Price: Highest to Lowest" },
    { value: "completion_rate_desc",label: "Highest Completion Rate" },
    { value: "newest",              label: "Newest Offers" },
];

export interface FilterValidationErrors {
    minAmount?: string;
    maxAmount?: string;
    minPrice?: string;
    maxPrice?: string;
}
