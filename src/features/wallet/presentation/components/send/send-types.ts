import type { AssetBalance } from "@/features/wallet";
import { formatAssetAmount } from "@/lib/formatCurrency";

export type SendStep =
  | "form"
  | "loading"
  | "confirm"
  | "signing"
  | "submitting"
  | "success"
  | "error"
  | "cancelled";

export interface RecipientInfo {
  address: string;
  alias: string | null;
  exists: boolean;
  hasUsdcTrustline: boolean;
}

export interface SendState {
  step: SendStep;
  recipient: RecipientInfo | null;
  fee: string | null;
  txHash: string | null;
  errorMessage: string | null;
}

export interface SendFormValues {
  recipient: string;
  amount: string;
  assetCode: string;
}

export function truncateAddress(addr: string): string {
  if (!addr) return "";
  return addr.length > 16 ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : addr;
}

export function getAssetName(asset: AssetBalance): string {
  return asset.asset_type === "native" ? "XLM" : (asset.asset_code || "UNKNOWN");
}

export function getFormattedBalance(asset: AssetBalance): string {
  return formatAssetAmount(asset.balance);
}

export function isStellarAddress(value: string): boolean {
  return /^G[A-Z0-9]{55}$/.test(value.trim());
}

export function isPotentialAlias(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 2 && !trimmed.includes(" ") && !trimmed.startsWith("G");
}
