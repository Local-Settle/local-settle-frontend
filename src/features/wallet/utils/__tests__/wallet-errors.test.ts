import { describe, expect, it } from "vitest";
import { mapWalletError } from "../wallet-errors";

describe("mapWalletError", () => {
    it("keeps cancellation distinct and recoverable", () => {
        expect(mapWalletError({ code: -4, message: "User rejected" })).toMatch(/cancelled/i);
    });

    it("guides users to switch an incompatible network", () => {
        expect(mapWalletError(new Error("Wrong Stellar network detected"))).toMatch(/switch networks/i);
    });

    it("explains low funds and required approval", () => {
        expect(mapWalletError("insufficient funds for fee")).toMatch(/balance is too low/i);
        expect(mapWalletError("insufficient allowance")).toMatch(/approve the requested wallet action/i);
    });

    it("uses safe actionable copy for unavailable and unknown provider failures", () => {
        expect(mapWalletError(new Error("extension not found"))).toMatch(/isn't installed or available/i);
        expect(mapWalletError(new Error("provider internals: private stack details"))).not.toContain("private stack details");
    });
});
