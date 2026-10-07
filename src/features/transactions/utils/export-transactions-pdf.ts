import { ExportTransactionRecord, ExportFilters } from "../types/transaction-export.types";

const stellarNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET";

function shortenHash(hash: string): string {
    if (!hash) return "";
    if (hash.length <= 10) return hash;
    return `${hash.slice(0, 5)}...${hash.slice(-5)}`;
}

function getExplorerUrl(hash: string, network: string): string {
    const net = (network || "TESTNET").toUpperCase();
    if (net === "PUBLIC") {
        return `https://stellar.expert/explorer/public/tx/${hash}`;
    }
    return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

/**
 * Generates a PDF containing transaction history details and triggers browser download.
 */
export async function exportTransactionsPdf(
    records: ExportTransactionRecord[],
    filename: string,
    filters?: ExportFilters
): Promise<void> {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const printableWidth = pageWidth - (margin * 2); // 210 - 30 = 180mm

    // Draw header / brand
    // Accent color bar: #55D6BE
    doc.setFillColor(206, 241, 0); // LocalSettle primary color
    doc.rect(margin, margin, printableWidth, 4, "F");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(17, 24, 39); // Slate-900
    doc.text("LocalSettle", margin, margin + 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text("P2P Escrow Transaction History", margin, margin + 19);

    // Metadata
    const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short"
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.text("Export Date:", margin, margin + 28);
    doc.setFont("helvetica", "normal");
    doc.text(today, margin + 20, margin + 28);

    // Filters summary
    doc.setFont("helvetica", "bold");
    doc.text("Network:", margin, margin + 33);
    doc.setFont("helvetica", "normal");
    doc.text(stellarNetwork, margin + 20, margin + 33);

    // Add filter detail strings
    let filterString = "Status: " + (filters?.status || "All") + " | Role: " + (filters?.operation || "All");
    if (filters?.dateRange?.from || filters?.dateRange?.to) {
        const from = filters.dateRange.from || "Any";
        const to = filters.dateRange.to || "Any";
        filterString += ` | Date Range: ${from} to ${to}`;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Filters:", margin, margin + 38);
    doc.setFont("helvetica", "normal");
    doc.text(filterString, margin + 20, margin + 38);

    // Decorative line above table
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 44, margin + printableWidth, margin + 44);

    let y = margin + 50; // Starting Y coordinate for table header
    const rowHeight = 8;
    const headerHeight = 10;

    // Define table columns
    const columns = [
        { name: "Date", width: 38 },
        { name: "Order ID", width: 18 },
        { name: "Role", width: 14 },
        { name: "Asset", width: 28 },
        { name: "Fiat", width: 28 },
        { name: "Status", width: 20 },
        { name: "Tx Hash", width: 34 }
    ];

    const drawTableHeader = (startY: number) => {
        doc.setFillColor(14, 14, 19); // Dark background #081521
        doc.rect(margin, startY, printableWidth, headerHeight, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255); // White text

        let currentX = margin;
        columns.forEach(col => {
            doc.text(col.name, currentX + 2, startY + 6.5);
            currentX += col.width;
        });
    };

    drawTableHeader(y);
    y += headerHeight;

    let alternate = false;

    for (let i = 0; i < records.length; i++) {
        const record = records[i];

        // Check page overflow (leave space for footer)
        if (y + rowHeight > pageHeight - margin - 12) {
            doc.addPage();
            y = margin + 10; // restart Y on new page
            drawTableHeader(y);
            y += headerHeight;
            alternate = false;
        }

        // Draw alternating background
        doc.setFillColor(alternate ? 248 : 255, alternate ? 250 : 255, alternate ? 252 : 255); // light grey or white
        doc.rect(margin, y, printableWidth, rowHeight, "F");

        // Bottom cell border
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.1);
        doc.line(margin, y + rowHeight, margin + printableWidth, y + rowHeight);

        // Print row text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59); // Slate-800

        let currentX = margin;

        // 1. Date
        doc.text(record.date, currentX + 2, y + 5);
        currentX += columns[0].width;

        // 2. Order ID (Shortened if UUID)
        const orderIdDisplay = record.orderId.length > 8 ? record.orderId.split("-")[0] || record.orderId.substring(0, 8) : record.orderId;
        doc.text(orderIdDisplay, currentX + 2, y + 5);
        currentX += columns[1].width;

        // 3. Role
        doc.text(record.role, currentX + 2, y + 5);
        currentX += columns[2].width;

        // 4. Asset
        doc.text(`${record.assetAmount} ${record.assetCode}`, currentX + 2, y + 5);
        currentX += columns[3].width;

        // 5. Fiat
        const fiatSymbol = record.fiatCurrency === "EUR" ? "€" : record.fiatCurrency === "CRC" ? "₡" : "$";
        doc.text(`${fiatSymbol}${record.fiatAmount} ${record.fiatCurrency}`, currentX + 2, y + 5);
        currentX += columns[4].width;

        // 6. Status
        const capStatus = record.status.charAt(0).toUpperCase() + record.status.slice(1);
        if (record.status.toLowerCase() === "completed") {
            doc.setTextColor(21, 128, 61); // Green-700
            doc.setFont("helvetica", "bold");
        } else if (record.status.toLowerCase() === "cancelled") {
            doc.setTextColor(100, 116, 139); // Slate-500
        } else {
            doc.setTextColor(194, 120, 3); // Amber-700
        }
        doc.text(capStatus, currentX + 2, y + 5);
        
        // Restore styles
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        currentX += columns[5].width;

        // 7. Clickable Transaction Hash
        if (record.transactionHash) {
            const shortHash = shortenHash(record.transactionHash);
            const url = getExplorerUrl(record.transactionHash, stellarNetwork);
            doc.setTextColor(2, 132, 199); // Blue-600
            doc.text(shortHash, currentX + 2, y + 5);
            // Clickable link
            doc.link(currentX + 2, y + 1.5, 20, 5, { url });
        } else {
            doc.text("-", currentX + 2, y + 5);
        }

        y += rowHeight;
        alternate = !alternate;
    }

    // Footers across all pages
    const totalPages = doc.internal.pages.length - 1;
    for (let j = 1; j <= totalPages; j++) {
        doc.setPage(j);
        
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, pageHeight - 15, margin + printableWidth, pageHeight - 15);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate-400

        doc.text(`Page ${j} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" });
        doc.text("LocalSettle P2P Escrow Platform", margin, pageHeight - 10);
    }

    doc.save(filename);
}
