import { describe, expect, it } from "vitest";
import { parseAssetBalances, parseEscrowSigningResponse } from "../contracts";

describe("API response contracts", () => {
  it("accepts valid Stellar balances and rejects malformed amounts", () => {
    expect(parseAssetBalances([{ asset_type: "native", balance: "12.5" }])).toEqual([{ asset_type: "native", asset_code: null, asset_issuer: null, balance: "12.5" }]);
    expect(() => parseAssetBalances([{ asset_type: "native", asset_code: null, asset_issuer: null, balance: 12.5 }])).toThrow(/invalid Stellar balance/);
  });

  it("requires an unsigned transaction before wallet signing", () => {
    expect(parseEscrowSigningResponse({ unsignedTransaction: "xdr" }).unsignedTransaction).toBe("xdr");
    expect(() => parseEscrowSigningResponse({})).toThrow(/invalid escrow signing/);
  });
});
