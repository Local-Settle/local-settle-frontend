import { describe, it, expect, vi, beforeAll } from "vitest";
import { transactionExportService } from "../services/transaction-export.service";
import { exportTransactionsCsv } from "../utils/export-transactions-csv";
import { exportTransactionsPdf } from "../utils/export-transactions-pdf";
import { Order } from "@/features/order/models/order";

vi.mock("jspdf", () => {
    const mockSave = vi.fn();
    const mockLink = vi.fn();
    const mockText = vi.fn();
    const mockRect = vi.fn();
    const mockLine = vi.fn();
    const mockSetPage = vi.fn();
    const mockAddPage = vi.fn();
    const mockSetDrawColor = vi.fn();
    const mockSetFillColor = vi.fn();
    const mockSetTextColor = vi.fn();
    const mockSetFont = vi.fn();
    const mockSetFontSize = vi.fn();
    const mockSetLineWidth = vi.fn();

    // Attach to globalThis so tests can assert calls
    (globalThis as unknown as { _mockSave: typeof mockSave })._mockSave = mockSave;
    (globalThis as unknown as { _mockLink: typeof mockLink })._mockLink = mockLink;

    class MockJsPDF {
        save = mockSave;
        link = mockLink;
        text = mockText;
        rect = mockRect;
        line = mockLine;
        setPage = mockSetPage;
        addPage = mockAddPage;
        setDrawColor = mockSetDrawColor;
        setFillColor = mockSetFillColor;
        setTextColor = mockSetTextColor;
        setFont = mockSetFont;
        setFontSize = mockSetFontSize;
        setLineWidth = mockSetLineWidth;
        internal = {
            pageSize: {
                getWidth: () => 210,
                getHeight: () => 297,
            },
            pages: [null, {}, {}] // represents 2 pages
        };
    }

    return {
        jsPDF: MockJsPDF
    };
});

const MOCK_CURRENT_USER_ID = "user-123";

const MOCK_ORDERS: Order[] = [
    {
        orderId: "order-completed-1",
        offerId: "offer-1",
        buyerId: "user-123", // Current user is buyer -> Role: Buyer
        sellerId: "merchant-456",
        assetAmount: "0.5",
        fiatAmount: "3250.00",
        orderStatus: "completed",
        createdAt: "2026-10-24T12:00:00.000Z",
        expiresAt: "2026-10-24T13:00:00.000Z",
        buyer: {
            userId: "user-123",
            alias: "AliceBuyer",
            publicKey: "G_BUYER_KEY_MOCK",
            kycStatus: "approved",
            notificationsEnabled: false,
            pendingAccountInfo: false,
            totalVolume: "0",
            createdAt: "2026-01-01T00:00:00.000Z",
            preferredCurrency: "USD - US Dollar"
        },
        seller: {
            userId: "merchant-456",
            alias: "BobSeller",
            publicKey: "G_SELLER_KEY_MOCK",
            kycStatus: "approved",
            notificationsEnabled: false,
            pendingAccountInfo: false,
            totalVolume: "15000",
            createdAt: "2026-01-01T00:00:00.000Z"
        },
        offer: {
            offerId: "offer-1",
            creatorId: "merchant-456",
            price: "6500",
            assetCode: "USDC",
            type: "sell",
            minAmount: "10",
            maxAmount: "10000",
            status: "active",
            payment_methods: [
                {
                    payment_id: "pm-1",
                    bankName: "Bank Transfer SEPA",
                    account_identifier: "ES12 3456 7890 1234 5678",
                    beneficiary_name: "QuantVortex_LP",
                    payment_provider: {
                        name: "Bank Transfer SEPA",
                        type: "bank"
                    }
                }
            ]
        },
        escrow: {
            escrowId: "escrow-1",
            orderId: "order-completed-1",
            escrowStatus: "released",
            buyerAddress: "G_BUYER_KEY_MOCK",
            sellerAddress: "G_SELLER_KEY_MOCK",
            amount: "0.5",
            txHashRelease: "released-tx-hash-12345",
            txHashLock: "lock-tx-hash-54321",
            evidenceUrl: "https://example.com/receipt.jpg"
        }
    },
    {
        orderId: "order-pending-2",
        offerId: "offer-2",
        buyerId: "buyer-789",
        sellerId: "user-123", // Current user is seller -> Role: Seller
        assetAmount: "100",
        fiatAmount: "12000.00",
        orderStatus: "pending",
        createdAt: "2026-10-25T14:30:00.000Z",
        expiresAt: "2026-10-25T15:30:00.000Z",
        buyer: {
            userId: "buyer-789",
            alias: "Charlie, comma user", // contains comma
            publicKey: "G_BUYER_2",
            kycStatus: "approved",
            notificationsEnabled: false,
            pendingAccountInfo: false,
            totalVolume: "0",
            createdAt: "2026-01-01T00:00:00.000Z",
            preferredCurrency: "CRC - Costarrican Colon"
        },
        seller: {
            userId: "user-123",
            alias: "AliceSeller",
            publicKey: "G_SELLER_KEY_MOCK",
            kycStatus: "approved",
            notificationsEnabled: false,
            pendingAccountInfo: false,
            totalVolume: "15000",
            createdAt: "2026-01-01T00:00:00.000Z"
        },
        offer: {
            offerId: "offer-2",
            creatorId: "user-123",
            price: "120",
            assetCode: "XLM",
            type: "buy",
            minAmount: "10",
            maxAmount: "10000",
            status: "active",
            paymentMethods: [
                {
                    paymentId: "pm-2",
                    bankName: 'SINPE Movil "Fast"', // contains quotes
                    accountDetails: "88888888",
                    beneficiaryName: "Alice Seller",
                    type: "mobile"
                }
            ]
        },
        escrow: {
            escrowId: "escrow-2",
            orderId: "order-pending-2",
            escrowStatus: "funded",
            buyerAddress: "G_BUYER_2",
            sellerAddress: "G_SELLER_KEY_MOCK",
            amount: "100",
            txHashLock: "lock-tx-hash-only",
            evidenceUrl: null
        }
    }
];

describe("Transaction Export Service", () => {
    it("maps Order models to ExportTransactionRecord format correctly", () => {
        const records = transactionExportService.mapOrdersToExportRecords(MOCK_ORDERS, MOCK_CURRENT_USER_ID);
        
        expect(records).toHaveLength(2);

        // Record 1 (Completed, User as Buyer)
        const rec1 = records[0];
        expect(rec1.orderId).toBe("order-completed-1");
        expect(rec1.role).toBe("Buyer");
        expect(rec1.assetCode).toBe("USDC");
        expect(rec1.assetAmount).toBe("0.5");
        expect(rec1.fiatCurrency).toBe("USD");
        expect(rec1.fiatAmount).toBe("3250.00");
        expect(rec1.exchangeRate).toBe("6500");
        expect(rec1.paymentMethod).toBe("Bank Transfer SEPA");
        expect(rec1.status).toBe("completed");
        expect(rec1.transactionHash).toBe("released-tx-hash-12345"); // should use txHashRelease if present
        expect(rec1.counterpartyAlias).toBe("BobSeller");
        expect(rec1.date).toContain("2026-10-24");
        expect(rec1.date).toContain("UTC");

        // Record 2 (Pending, User as Seller)
        const rec2 = records[1];
        expect(rec2.orderId).toBe("order-pending-2");
        expect(rec2.role).toBe("Seller");
        expect(rec2.assetCode).toBe("XLM");
        expect(rec2.assetAmount).toBe("100");
        expect(rec2.fiatCurrency).toBe("CRC");
        expect(rec2.fiatAmount).toBe("12000.00");
        expect(rec2.exchangeRate).toBe("120");
        expect(rec2.paymentMethod).toBe('SINPE Movil "Fast"');
        expect(rec2.status).toBe("pending");
        expect(rec2.transactionHash).toBe("lock-tx-hash-only"); // fallback to txHashLock
        expect(rec2.counterpartyAlias).toBe("Charlie, comma user");
        expect(rec2.date).toContain("2026-10-25");
        expect(rec2.date).toContain("UTC");
    });
});

describe("CSV Export Utility", () => {
    beforeAll(() => {
        if (typeof window !== "undefined") {
            window.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
            window.URL.revokeObjectURL = vi.fn();
        }
    });

    it("escapes quotes, commas, and formatting correctly in CSV", () => {
        const records = transactionExportService.mapOrdersToExportRecords(MOCK_ORDERS, MOCK_CURRENT_USER_ID);
        
        const createObjectURLSpy = vi.spyOn(URL, "createObjectURL");
        const clickSpy = vi.fn();
        
        const mockLink = {
            setAttribute: vi.fn(),
            style: { visibility: "" },
            click: clickSpy,
        };
        
        const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(mockLink as unknown as HTMLAnchorElement);
        const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((el) => el);
        const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((el) => el);

        exportTransactionsCsv(records, "test-filename.csv");

        expect(createObjectURLSpy).toHaveBeenCalled();
        expect(createElementSpy).toHaveBeenCalledWith("a");
        expect(mockLink.setAttribute).toHaveBeenCalledWith("download", "test-filename.csv");
        expect(mockLink.setAttribute).toHaveBeenCalledWith("href", "blob:mock-url");
        expect(clickSpy).toHaveBeenCalled();
        expect(appendChildSpy).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalled();

        // Extract blob data passed to Blob constructor
        const blobConstructorSpy = vi.spyOn(globalThis, "Blob");
        exportTransactionsCsv(records, "test-filename.csv");
        
        const blobCall = blobConstructorSpy.mock.calls[0];
        const contentStr = blobCall[0][0] as string;
        
        // Assert CSV formatting
        // UTF-8 BOM should be at the start
        expect(contentStr.startsWith("\uFEFF")).toBe(true);
        
        // Header verification
        expect(contentStr).toContain('"Order ID","Date","Role","Asset Code","Asset Amount","Fiat Currency","Fiat Amount","Exchange Rate","Payment Method","Status","Transaction Hash","Counterparty Alias"');
        
        // Escaped comma verification (Charlie, comma user -> "Charlie, comma user")
        expect(contentStr).toContain('"Charlie, comma user"');
        
        // Escaped quotes verification (SINPE Movil "Fast" -> "SINPE Movil ""Fast""")
        expect(contentStr).toContain('"SINPE Movil ""Fast"""');
    });

    it("neutralizes formula-like text and preserves Unicode characters", () => {
        const records = transactionExportService.mapOrdersToExportRecords(MOCK_ORDERS, MOCK_CURRENT_USER_ID);
        records[0].counterpartyAlias = '=HYPERLINK("https://example.test")';
        records[1].counterpartyAlias = "José 🧑🏽‍💻, 東京";

        const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue({
            setAttribute: vi.fn(), style: { visibility: "" }, click: vi.fn(),
        } as unknown as HTMLAnchorElement);
        vi.spyOn(document.body, "appendChild").mockImplementation((el) => el);
        vi.spyOn(document.body, "removeChild").mockImplementation((el) => el);
        const blobConstructorSpy = vi.spyOn(globalThis, "Blob");

        exportTransactionsCsv(records, "test-filename.csv");

        const contentStr = blobConstructorSpy.mock.calls.at(-1)?.[0][0] as string;
        expect(contentStr).toContain("'=HYPERLINK(\"\"https://example.test\"\")");
        expect(contentStr).toContain('"José 🧑🏽‍💻, 東京"');
        createElementSpy.mockRestore();
    });
});

describe("PDF Export Utility", () => {
    it("generates a PDF file and triggers save", async () => {
        const records = transactionExportService.mapOrdersToExportRecords(MOCK_ORDERS, MOCK_CURRENT_USER_ID);

        await exportTransactionsPdf(records, "test-filename.pdf", {
            status: "ALL",
            operation: "All",
            dateRange: { from: "2026-10-01", to: "2026-10-31" }
        });

        expect((globalThis as unknown as { _mockSave: typeof mockSave })._mockSave).toHaveBeenCalledWith("test-filename.pdf");
    });
});

describe("Integration Tests - Filtered Data Export", () => {
    it("exports only completed transactions when filtering for completed", () => {
        // Filter orders by completed status first (simulating client-side filtering)
        const completedOrders = MOCK_ORDERS.filter(
            (o) => o.orderStatus === "completed" || o.escrow?.escrowStatus === "released"
        );
        expect(completedOrders).toHaveLength(1);
        expect(completedOrders[0].orderId).toBe("order-completed-1");

        const mapSpy = vi.spyOn(transactionExportService, "mapOrdersToExportRecords");

        transactionExportService.export(completedOrders, MOCK_CURRENT_USER_ID, "pdf", {
            status: "COMPLETED"
        });

        // Verify only the filtered completed order was mapped and exported
        expect(mapSpy).toHaveBeenCalledWith(completedOrders, MOCK_CURRENT_USER_ID);
        expect((globalThis as unknown as { _mockSave: typeof mockSave })._mockSave).toHaveBeenCalled();
        
        mapSpy.mockRestore();
    });

    it("exports only pending transactions when filtering for pending", () => {
        // Filter orders by pending status first
        const pendingOrders = MOCK_ORDERS.filter(
            (o) => o.orderStatus === "pending" && o.escrow?.escrowStatus !== "released"
        );
        expect(pendingOrders).toHaveLength(1);
        expect(pendingOrders[0].orderId).toBe("order-pending-2");

        const mapSpy = vi.spyOn(transactionExportService, "mapOrdersToExportRecords");

        transactionExportService.export(pendingOrders, MOCK_CURRENT_USER_ID, "csv", {
            status: "PENDING"
        });

        // Verify only the filtered pending order was mapped and exported
        expect(mapSpy).toHaveBeenCalledWith(pendingOrders, MOCK_CURRENT_USER_ID);
        
        mapSpy.mockRestore();
    });
});
