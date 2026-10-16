const AMOUNT_REGEX = /^\d+(\.\d{1,7})?$/;
const STROOPS_PER_UNIT = 10_000_000n;

/** Parse a Stellar amount without floating-point rounding (7 decimal places). */
export function toStroops(amount: string): bigint | null {
    if (!AMOUNT_REGEX.test(amount)) return null;
    const [integerPart, decimalPart = ""] = amount.split(".");
    return BigInt(integerPart) * STROOPS_PER_UNIT + BigInt(decimalPart.padEnd(7, "0"));
}

export function isValidSendAmount(amount: string): boolean {
    const stroops = toStroops(amount);
    return stroops !== null && stroops > 0n;
}
