import { Order } from "@/features/order/models/order";
import { ExportTransactionRecord, ExportFilters } from "../types/transaction-export.types";
import { exportTransactionsCsv } from "../utils/export-transactions-csv";
import { exportTransactionsPdf } from "../utils/export-transactions-pdf";

/**
 * Service to orchestrate the mapping and exporting of transactions to CSV/PDF.
 */
export const transactionExportService = {
    /**
     * Maps API Order models to ExportTransactionRecord format.
     * Ensures sensitive fields are stripped and fields are consistently formatted.
     */
    mapOrdersToExportRecords(orders: Order[], currentUserId: string): ExportTransactionRecord[] {
        return orders.map(o => {
            const isBuyer = o.buyerId === currentUserId;
            
            // Format date consistently in UTC
            const dateObj = o.createdAt ? new Date(o.createdAt) : new Date();
            const dateStr = dateObj.toISOString().replace("T", " ").substring(0, 19) + " UTC";

            // Determine role
            const role: "Buyer" | "Seller" = isBuyer ? "Buyer" : "Seller";

            // Asset code
            const assetCode = o.offer?.assetCode || o.assetCode || "USDC";

            // Determine fiat currency from preferred currencies, defaulting to EUR
            const parseCurrency = (pref?: string) => pref ? pref.split(" ")[0] : null;
            const fiatCurrency = parseCurrency(o.buyer?.preferredCurrency) || parseCurrency(o.seller?.preferredCurrency) || "EUR";

            // Calculate precise exchange rate
            const fiatVal = parseFloat(o.fiatAmount) || 0;
            const assetVal = parseFloat(o.assetAmount) || 0;
            let rateVal = 0;
            if (o.offer?.price) {
                rateVal = parseFloat(o.offer.price);
            } else if (assetVal > 0) {
                rateVal = fiatVal / assetVal;
            }
            const exchangeRate = isNaN(rateVal) || rateVal === 0 ? "0.00" : rateVal.toString();

            // Extract non-sensitive payment method label
            const pm = o.offer?.payment_methods?.[0] || o.offer?.paymentMethods?.[0];
            const paymentMethod = pm?.payment_provider?.name || pm?.bankName || "Bank Transfer SEPA";

            // Clean status
            const status = o.orderStatus === "completed" || o.escrow?.escrowStatus === "released"
                ? "completed"
                : o.orderStatus === "cancelled"
                ? "cancelled"
                : "pending";

            // Transaction Hash
            const transactionHash = o.escrow?.txHashRelease || o.escrow?.txHashLock || "";

            // Counterparty
            const counterparty = isBuyer ? o.seller : o.buyer;
            const counterpartyAlias = counterparty?.alias || counterparty?.username || (isBuyer ? "Merchant" : "Client");

            return {
                orderId: o.orderId,
                date: dateStr,
                role,
                assetCode,
                assetAmount: o.assetAmount,
                fiatCurrency,
                fiatAmount: o.fiatAmount,
                exchangeRate,
                paymentMethod,
                status,
                transactionHash,
                counterpartyAlias
            };
        });
    },

    /**
     * Executes the download process for CSV or PDF export.
     */
    async export(
        orders: Order[],
        currentUserId: string,
        format: "csv" | "pdf",
        filters?: ExportFilters
    ): Promise<void> {
        const records = this.mapOrdersToExportRecords(orders, currentUserId);
        
        // Generate filename prefix with current date: e.g. localsettle-transactions-2026-07-14
        const todayStr = new Date().toISOString().split("T")[0];
        const filename = `localsettle-transactions-${todayStr}.${format}`;

        if (format === "csv") {
            exportTransactionsCsv(records, filename);
        } else {
            await exportTransactionsPdf(records, filename, filters);
        }
    }
};
