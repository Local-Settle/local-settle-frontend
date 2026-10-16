const APP_ORIGIN = "https://localsettle.invalid";

export function getSafeReturnPath(value: string | null): string | null {
    if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
        return null;
    }

    try {
        const url = new URL(value, APP_ORIGIN);
        if (url.origin !== APP_ORIGIN || url.pathname === "/welcome" || url.pathname.startsWith("/setupAccount")) {
            return null;
        }
        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return null;
    }
}
