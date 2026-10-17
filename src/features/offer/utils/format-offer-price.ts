const CURRENCY_CODE = /^[A-Z]{3}$/;

/** Format an offer's fiat price using the currency's standard minor-unit precision. */
export function formatOfferPrice(value: string | number, currency?: string): string {
    const amount = typeof value === "number" ? value : Number(value);
    const requested = (currency ?? "USD").toUpperCase();
    const code = CURRENCY_CODE.test(requested) ? requested : "USD";

    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: code,
            currencyDisplay: "code",
        }).format(Number.isFinite(amount) ? amount : 0);
    } catch {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            currencyDisplay: "code",
        }).format(Number.isFinite(amount) ? amount : 0);
    }
}
