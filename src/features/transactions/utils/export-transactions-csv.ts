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
        "Counterparty Alias"
    ];

    const escapeCsvValue = (val: string | number | undefined | null): string => {
        if (val === null || val === undefined) return "";
        let str = String(val);
        // Prevent spreadsheet formula execution for untrusted text while leaving
        // ordinary negative numeric values intact.
        if (/^[\t\r ]*[=+@]/.test(str) || /^[\t\r ]*-(?=\D)/.test(str)) {
            str = `'${str}`;
        }
        // Quote every cell (RFC 4180) so commas, quotes, CR/LF, and Unicode
        // remain unambiguous when rows are parsed by spreadsheet software.
        return `"${str.replace(/"/g, '""')}"`;
    };

    const csvRows = [headers.map(escapeCsvValue).join(",")];
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
            record.counterpartyAlias
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
