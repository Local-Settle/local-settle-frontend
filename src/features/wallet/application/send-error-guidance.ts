export function getSendErrorGuidance(message: string, assetCode = "USDC"): string {
  const normalized = message.toLowerCase();

  if (/op_low_reserve|tx_insufficient_balance|tx_insufficient_fee|insufficient (?:native|xlm)|xlm (?:balance|reserve|fee)/i.test(normalized)) {
    return "Your Stellar account needs more XLM to cover its reserve or network fee. Add XLM and try again.";
  }

  if (/op_underfunded|insufficient (?:asset|token|usdc)|usdc.*balance/i.test(normalized)) {
    return `Your account does not have enough ${assetCode} for this transfer.`;
  }

  return message.trim() || "The transfer could not be submitted. Please try again.";
}
