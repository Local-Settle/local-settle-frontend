const ACTIONS: Record<string, string> = {
  INVALID_RECIPIENT: "Check that the recipient is a valid Stellar public key beginning with G.",
  RECIPIENT_NOT_FOUND: "Confirm the Stellar account exists and check the recipient address.",
  ACCOUNT_NOT_FOUND: "Confirm the Stellar account exists and check the recipient address.",
  MISSING_ISSUER: "The asset issuer is not configured. Contact support before retrying.",
  ASSET_ISSUER_MISSING: "The asset issuer is not configured. Contact support before retrying.",
  INVALID_ISSUER: "The asset issuer is invalid. Check the selected asset or contact support.",
  INSUFFICIENT_BALANCE: "Lower the transfer amount or add funds to your wallet.",
  INSUFFICIENT_FEE_BALANCE: "Add XLM to your wallet to cover the network fee.",
};

export function walletApiErrorMessage(code?: string, message?: string): string {
  if (code && ACTIONS[code.toUpperCase()]) return ACTIONS[code.toUpperCase()];
  if (code) return `The request failed (${code}). Check the details and try again.`;
  return message?.trim().slice(0, 240) || "The request failed. Please try again.";
}
