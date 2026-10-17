import { afterEach, describe, expect, it } from "vitest";
import { getConfiguredStellarNetwork, getConfiguredUsdcIssuer } from "../stellar-network";

describe("Stellar deployment configuration", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_STELLAR_NETWORK;
    delete process.env.NEXT_PUBLIC_USDC_ISSUER;
  });

  it("defaults to Testnet and recognizes public aliases", () => {
    delete process.env.NEXT_PUBLIC_STELLAR_NETWORK;
    expect(getConfiguredStellarNetwork()).toBe("testnet");
    process.env.NEXT_PUBLIC_STELLAR_NETWORK = "PUBLIC";
    expect(getConfiguredStellarNetwork()).toBe("mainnet");
  });

  it("returns a trimmed issuer or null when unset", () => {
    process.env.NEXT_PUBLIC_USDC_ISSUER = "  GISSUER  ";
    expect(getConfiguredUsdcIssuer()).toBe("GISSUER");
    process.env.NEXT_PUBLIC_USDC_ISSUER = " ";
    expect(getConfiguredUsdcIssuer()).toBeNull();
  });
});
