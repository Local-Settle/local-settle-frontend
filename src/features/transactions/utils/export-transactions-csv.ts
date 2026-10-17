import { ExportTransactionRecord } from "../types/transaction-export.types";

/**
 * Formats transaction records into a CSV string and triggers a browser download.
 * Ensures UTF-8 encoding with BOM for compatibility with Excel and Google Sheets.
 */
export function exportTransactionsCsv(records: ExportTransactionRecord[], filename: string): void {
    const headers = [
        "Order ID",
        "Date",
        "Role",
        "Asset Code",
        "Asset Amount",
        "Fiat Currency",
        "Fiat Amount",
        "Exchange Rate",
        "Payment Method",
        "Status",
        "Transaction Hash",
        "Counterparty Alias",
        "Your Address",
        "Counterparty Address"
    ];

    const escapeCsvValue = (val: string | number | undefined | null): string => {
        if (val === null || val === undefined) return "";
        const str = String(val);
        // Escape quotes, commas, and newlines
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const exportedAt = new Date().toISOString();
    const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET";
    const csvRows = [
        `Network,${escapeCsvValue(network)}`,
        `Exported At (UTC),${escapeCsvValue(exportedAt)}`,
        headers.map(escapeCsvValue).join(",")
    ];
    for (const record of records) {
        const row = [
            record.orderId,
            record.date,
            record.role,
            record.assetCode,
            record.assetAmount,
            record.fiatCurrency,
            record.fiatAmount,
            record.exchangeRate,
            record.paymentMethod,
            record.status,
            record.transactionHash,
            record.counterpartyAlias,
            record.sourceAddress,
            record.counterpartyAddress
        ];
        csvRows.push(row.map(escapeCsvValue).join(","));
    }

    const csvString = csvRows.join("\r\n");
    
    // Check if window and document are defined (client-side execution check)
    if (typeof window !== "undefined" && typeof document !== "undefined") {
        // UTF-8 Byte Order Mark (BOM) to force Excel to open in UTF-8
        const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
