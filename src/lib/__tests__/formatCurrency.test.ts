import { describe, expect, it } from "vitest";
import { addDecimalValues, formatAssetAmount, formatDecimal, formatFiatAmount } from "../formatCurrency";

describe("currency formatting", () => {
    it("keeps seven asset decimals without floating-point loss", () => {
        expect(formatAssetAmount("1234.1234567")).toBe("1,234.1234567");
        expect(formatAssetAmount("0.0000001")).toBe("0.0000001");
    });

    it("rounds values at the requested precision", () => {
        expect(formatDecimal("0.99999995", "en-US", 2, 7)).toBe("1.00");
        expect(formatDecimal("12.345", "en-US", 2, 2)).toBe("12.35");
    });

    it("uses locale-specific separators and currency minor units", () => {
        expect(formatAssetAmount("1234.1234567", "de-DE")).toBe("1.234,1234567");
        expect(formatFiatAmount("1234.5", "EUR", "de-DE")).toContain("1.234,50");
        expect(formatFiatAmount("1234", "JPY", "ja-JP")).toContain("1,234");
        expect(formatFiatAmount("-12.34", "USD", "en-US")).toBe("-$12.34");
    });

    it("adds asset amounts at ledger precision", () => {
        expect(formatAssetAmount(addDecimalValues("0.1", "0.2"))).toBe("0.30");
        expect(addDecimalValues("1.0000001", "0.0000002")).toBe("1.0000003");
    });
});
