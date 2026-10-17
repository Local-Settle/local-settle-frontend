export interface ExportTransactionRecord {
    orderId: string;
    date: string; // ISO date format (e.g. YYYY-MM-DD or YYYY-MM-DD HH:mm:ss)
    role: "Buyer" | "Seller";
    assetCode: string;
    assetAmount: string;
    fiatCurrency: string;
    fiatAmount: string;
    exchangeRate: string;
    paymentMethod: string;
    status: string;
    transactionHash: string;
    counterpartyAlias: string;
    sourceAddress?: string;
    counterpartyAddress?: string;
}

export interface ExportFilters {
    status?: string;
    operation?: string;
    dateRange?: {
        from?: string; // YYYY-MM-DD
        to?: string;   // YYYY-MM-DD
    };
    fields?: (keyof ExportTransactionRecord)[];
}
