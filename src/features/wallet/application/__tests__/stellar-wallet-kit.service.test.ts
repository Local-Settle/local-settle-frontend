import { describe, it, expect, vi, beforeEach } from "vitest";
import { walletCapabilityMatrix } from "../../config/wallet-capabilities";

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const PUBLIC_PASSPHRASE = "Public Global Stellar Network ; September 2015";

const kitMock = {
    init: vi.fn(),
    setWallet: vi.fn(),
    getAddress: vi.fn(),
    fetchAddress: vi.fn(),
    signTransaction: vi.fn(),
    signMessage: vi.fn(),
    getNetwork: vi.fn(),
    disconnect: vi.fn(),
    refreshSupportedWallets: vi.fn(),
};

vi.mock("@creit.tech/stellar-wallets-kit", () => ({
    StellarWalletsKit: kitMock,
    Networks: { TESTNET: TESTNET_PASSPHRASE, PUBLIC: PUBLIC_PASSPHRASE },
}));

vi.mock("@creit.tech/stellar-wallets-kit/modules/freighter", () => ({ FreighterModule: class {} }));
vi.mock("@creit.tech/stellar-wallets-kit/modules/lobstr", () => ({ LobstrModule: class {} }));
vi.mock("@creit.tech/stellar-wallets-kit/modules/albedo", () => ({ AlbedoModule: class {} }));
vi.mock("@creit.tech/stellar-wallets-kit/modules/xbull", () => ({ xBullModule: class {} }));
vi.mock("@creit.tech/stellar-wallets-kit/modules/rabet", () => ({ RabetModule: class {} }));
vi.mock("@creit.tech/stellar-wallets-kit/modules/hana", () => ({ HanaModule: class {} }));

async function loadService() {
    const mod = await import("../stellar-wallet-kit.service");
    return mod.stellarWalletKitService;
}

describe("stellarWalletKitService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        kitMock.getNetwork.mockResolvedValue({ network: "TESTNET", networkPassphrase: TESTNET_PASSPHRASE });
        kitMock.fetchAddress.mockResolvedValue({ address: "GADDRESS" });
        kitMock.signTransaction.mockResolvedValue({ signedTxXdr: "SIGNED_XDR" });
        kitMock.signMessage.mockResolvedValue({ signedMessage: "SIGNED_MESSAGE" });
    });

    it.each(Object.keys(walletCapabilityMatrix))(
        "routes connection, address, network and signing through the kit for %s",
        async (walletId) => {
            const service = await loadService();

            await expect(service.connect(walletId)).resolves.toBe("GADDRESS");
            await expect(service.signTransaction("XDR", "GADDRESS")).resolves.toBe("SIGNED_XDR");
            await expect(service.signMessage("challenge", "GADDRESS")).resolves.toBe("SIGNED_MESSAGE");

            expect(kitMock.setWallet).toHaveBeenCalledWith(walletId);
            expect(kitMock.fetchAddress).toHaveBeenCalled();
            expect(kitMock.getNetwork).toHaveBeenCalled();
            expect(kitMock.signTransaction).toHaveBeenCalled();
            expect(kitMock.signMessage).toHaveBeenCalled();
        },
    );

    it("initializes the kit with Networks.TESTNET exactly once, even across multiple connects", async () => {
        const service = await loadService();

        await service.connect("freighter-id");
        await service.connect("lobstr-id");

        expect(kitMock.init).toHaveBeenCalledTimes(1);
        expect(kitMock.init).toHaveBeenCalledWith(
            expect.objectContaining({ network: TESTNET_PASSPHRASE, selectedWalletId: "freighter-id" })
        );
    });

    it("never configures the kit with the Mainnet passphrase", async () => {
        const service = await loadService();
        await service.connect("freighter-id");

        const initArgs = kitMock.init.mock.calls[0][0];
        expect(initArgs.network).not.toBe(PUBLIC_PASSPHRASE);
        expect(initArgs.network).toBe(TESTNET_PASSPHRASE);
    });

    it("connect() selects the wallet and returns the address", async () => {
        const service = await loadService();

        const address = await service.connect("freighter-id");

        expect(kitMock.setWallet).toHaveBeenCalledWith("freighter-id");
        expect(address).toBe("GADDRESS");
    });

    it("connect() throws when the kit returns no address", async () => {
        kitMock.fetchAddress.mockResolvedValueOnce({ address: "" });
        const service = await loadService();

        await expect(service.connect("freighter-id")).rejects.toThrow(/no public key/i);
    });

    it("connect() fetches the address rather than reading the kit's cache", async () => {
        const service = await loadService();

        await service.connect("freighter-id");

        expect(kitMock.fetchAddress).toHaveBeenCalled();
        expect(kitMock.getAddress).not.toHaveBeenCalled();
    });

    it("connect() throws when the active network is Mainnet", async () => {
        kitMock.getNetwork.mockResolvedValueOnce({ network: "PUBLIC", networkPassphrase: PUBLIC_PASSPHRASE });
        const service = await loadService();

        await expect(service.connect("freighter-id")).rejects.toThrow(/mainnet/i);
    });

    it("signTransaction() always signs with the Testnet passphrase", async () => {
        kitMock.signTransaction.mockResolvedValueOnce({ signedTxXdr: "SIGNED_XDR" });
        const service = await loadService();

        const result = await service.signTransaction("RAW_XDR", "GADDRESS");

        expect(kitMock.signTransaction).toHaveBeenCalledWith("RAW_XDR", {
            networkPassphrase: TESTNET_PASSPHRASE,
            address: "GADDRESS",
        });
        expect(result).toBe("SIGNED_XDR");
    });

    it("signTransaction() refuses to sign when the wallet is on Mainnet", async () => {
        kitMock.getNetwork.mockResolvedValueOnce({ network: "PUBLIC", networkPassphrase: PUBLIC_PASSPHRASE });
        const service = await loadService();

        await expect(service.signTransaction("RAW_XDR")).rejects.toThrow(/mainnet/i);
        expect(kitMock.signTransaction).not.toHaveBeenCalled();
    });

    it("refreshSupportedWallets() returns the kit's list", async () => {
        const wallets = [{ id: "freighter-id", name: "Freighter", isAvailable: true, type: "", isPlatformWrapper: false, icon: "", url: "" }];
        kitMock.refreshSupportedWallets.mockResolvedValueOnce(wallets);
        const service = await loadService();

        await expect(service.refreshSupportedWallets()).resolves.toEqual(wallets);
    });

    it("refreshSupportedWallets() falls back to an empty list on failure", async () => {
        kitMock.refreshSupportedWallets.mockRejectedValueOnce(new Error("boom"));
        const service = await loadService();

        await expect(service.refreshSupportedWallets()).resolves.toEqual([]);
    });

    it("disconnect() is a no-op if the kit was never initialized", async () => {
        const service = await loadService();

        await service.disconnect();

        expect(kitMock.disconnect).not.toHaveBeenCalled();
    });

    it("disconnect() calls the kit's disconnect once initialized, and swallows errors", async () => {
        const service = await loadService();
        await service.connect("freighter-id");

        kitMock.disconnect.mockRejectedValueOnce(new Error("not supported by this module"));

        await expect(service.disconnect()).resolves.toBeUndefined();
        expect(kitMock.disconnect).toHaveBeenCalled();
    });
});
