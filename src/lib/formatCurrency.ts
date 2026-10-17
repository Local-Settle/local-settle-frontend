const NUMERIC_PARTS = new Set(["integer", "group", "decimal", "fraction"]);

function expandDecimal(value: string | number): { negative: boolean; integer: string; fraction: string } {
    const input = String(value).trim();
    const match = input.match(/^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
    if (!match) return { negative: false, integer: "0", fraction: "" };

    const negative = match[1] === "-";
    const digits = `${match[2]}${match[3] ?? ""}`;
    const decimalPosition = match[2].length + Number(match[4] ?? 0);
    const integer = decimalPosition <= 0
        ? "0"
        : decimalPosition >= digits.length
            ? `${digits}${"0".repeat(decimalPosition - digits.length)}`
            : digits.slice(0, decimalPosition);
    const fraction = decimalPosition <= 0
        ? `${"0".repeat(-decimalPosition)}${digits}`
        : decimalPosition >= digits.length
            ? ""
            : digits.slice(decimalPosition);

    return {
        negative,
        integer: integer.replace(/^0+(?=\d)/, ""),
        fraction,
    };
}

/** Format a decimal quantity without binary floating-point rounding. */
export function formatDecimal(
    value: string | number,
    locale = "en-US",
    minimumFractionDigits = 2,
    maximumFractionDigits = 7,
): string {
    const parsed = expandDecimal(value);
    const scale = 10n ** BigInt(maximumFractionDigits);
    const keptFraction = parsed.fraction.slice(0, maximumFractionDigits).padEnd(maximumFractionDigits, "0");
    let scaled = BigInt(parsed.integer) * scale + BigInt(keptFraction || "0");
    if ((parsed.fraction[maximumFractionDigits] ?? "0") >= "5") scaled += 1n;

    const whole = scaled / scale;
    const fraction = (scaled % scale).toString().padStart(maximumFractionDigits, "0");
    const trimmedFraction = fraction.replace(/0+$/, "");
    const visibleFraction = trimmedFraction.padEnd(minimumFractionDigits, "0");
    const groupedWhole = new Intl.NumberFormat(locale, {
        useGrouping: true,
        maximumFractionDigits: 0,
    }).format(whole);
    const decimalSeparator = new Intl.NumberFormat(locale)
        .formatToParts(1.1)
        .find((part) => part.type === "decimal")?.value ?? ".";
    const sign = parsed.negative && scaled !== 0n ? "-" : "";

    return `${sign}${groupedWhole}${visibleFraction ? `${decimalSeparator}${visibleFraction}` : ""}`;
}

export function formatAssetAmount(value: string | number, locale = "en-US"): string {
    return formatDecimal(value, locale, 2, 7);
}

export function addDecimalValues(left: string | number, right: string | number, precision = 7): string {
    const toScaled = (value: string | number) => {
        const parsed = expandDecimal(value);
        const scale = 10n ** BigInt(precision);
        const keptFraction = parsed.fraction.slice(0, precision).padEnd(precision, "0");
        let scaled = BigInt(parsed.integer) * scale + BigInt(keptFraction || "0");
        if ((parsed.fraction[precision] ?? "0") >= "5") scaled += 1n;
        return parsed.negative ? -scaled : scaled;
    };
    const scale = 10n ** BigInt(precision);
    const sum = toScaled(left) + toScaled(right);
    const negative = sum < 0n;
    const absolute = negative ? -sum : sum;
    const whole = absolute / scale;
    const fraction = (absolute % scale).toString().padStart(precision, "0").replace(/0+$/, "");
    return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

export function formatFiatNumber(value: string | number, currency: string, locale = "en-US"): string {
    const formatter = new Intl.NumberFormat(locale, { style: "currency", currency });
    const { minimumFractionDigits, maximumFractionDigits } = formatter.resolvedOptions();
    return formatDecimal(value, locale, minimumFractionDigits, maximumFractionDigits);
}

/** Format fiat using the currency's locale-specific minor-unit precision. */
export function formatFiatAmount(value: string | number, currency: string, locale = "en-US"): string {
    const formatter = new Intl.NumberFormat(locale, { style: "currency", currency });
    const negative = expandDecimal(value).negative;
    const absoluteValue = negative ? String(value).trim().replace(/^-/, "") : value;
    const formattedNumber = formatFiatNumber(absoluteValue, currency, locale);
    const parts = formatter.formatToParts(negative ? -1 : 1);
    let insertedNumber = false;

    return parts.reduce((output, part) => {
        if (NUMERIC_PARTS.has(part.type)) {
            if (insertedNumber) return output;
            insertedNumber = true;
            return output + formattedNumber;
        }
        return output + part.value;
    }, "");
}
