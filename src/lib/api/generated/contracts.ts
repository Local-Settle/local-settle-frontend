/* Generated from contracts/openapi.json. Do not edit by hand. */

export interface AssetBalance {
  asset_code?: string | null;
  asset_issuer?: string | null;
  asset_type: string;
  balance: string;
  limit?: string | null;
}

export interface EscrowSigningResponse {
  unsignedFundTransaction?: string;
  unsignedTransaction?: string;
}
