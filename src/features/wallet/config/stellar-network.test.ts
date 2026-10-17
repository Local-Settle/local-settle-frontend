import { describe, expect, it } from "vitest";
import { Networks } from "@creit.tech/stellar-wallets-kit";
import { getStellarNetworkConfig } from "./stellar-network";

describe("getStellarNetworkConfig", () => {
    it("uses the testnet passphrase by default", () => {
        expect(getStellarNetworkConfig(undefined)).toEqual({ network: "testnet", passphrase: Networks.TESTNET });
    });

    it.each(["mainnet", "public", " PUBLIC "])("normalizes %s to the public passphrase", (value) => {
        expect(getStellarNetworkConfig(value)).toEqual({ network: "mainnet", passphrase: Networks.PUBLIC });
    });

    it("fails closed for unsupported networks", () => {
        expect(() => getStellarNetworkConfig("preview")).toThrow("Unsupported Stellar network");
    });
});
