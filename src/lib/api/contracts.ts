import type { AssetBalance, EscrowSigningResponse } from "./generated/contracts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseAssetBalances(value: unknown): AssetBalance[] {
  if (!Array.isArray(value) || !value.every((balance) =>
    isRecord(balance) &&
    typeof balance.asset_type === "string" &&
    (balance.asset_code === undefined || typeof balance.asset_code === "string" || balance.asset_code === null) &&
    (balance.asset_issuer === undefined || typeof balance.asset_issuer === "string" || balance.asset_issuer === null) &&
    typeof balance.balance === "string" &&
    (balance.limit === undefined || typeof balance.limit === "string" || balance.limit === null)
  )) {
    throw new Error("The API returned an invalid Stellar balance response.");
  }
  return value.map((balance) => ({
    ...balance,
    asset_code: balance.asset_code ?? null,
    asset_issuer: balance.asset_issuer ?? null,
  })) as AssetBalance[];
}

export function parseEscrowSigningResponse(value: unknown): EscrowSigningResponse {
  if (!isRecord(value) ||
    (value.unsignedFundTransaction !== undefined && typeof value.unsignedFundTransaction !== "string") ||
    (value.unsignedTransaction !== undefined && typeof value.unsignedTransaction !== "string") ||
    (!value.unsignedFundTransaction && !value.unsignedTransaction)
  ) {
    throw new Error("The API returned an invalid escrow signing response.");
  }
  return value as EscrowSigningResponse;
}
