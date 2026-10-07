import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EscrowTransactionLinks } from "../EscrowTransactionLinks";

const lockHash = "lock-hash-123";
const releaseHash = "release-hash-456";

describe("EscrowTransactionLinks", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("renders present funding and release hashes with public-network links", () => {
        vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "PUBLIC");

        render(<EscrowTransactionLinks txHashLock={lockHash} txHashRelease={releaseHash} />);

        const fundingLink = screen.getByRole("link", {
            name: "View escrow funding transaction on Stellar Expert",
        });
        const releaseLink = screen.getByRole("link", {
            name: "View escrow release transaction on Stellar Expert",
        });

        expect(fundingLink.getAttribute("href")).toBe(
            `https://stellar.expert/explorer/public/tx/${lockHash}`,
        );
        expect(releaseLink.getAttribute("href")).toBe(
            `https://stellar.expert/explorer/public/tx/${releaseHash}`,
        );
        expect(fundingLink.getAttribute("target")).toBe("_blank");
        expect(fundingLink.getAttribute("rel")).toBe("noopener noreferrer");
        expect(screen.getByText(lockHash)).toBeTruthy();
        expect(screen.getByText(releaseHash)).toBeTruthy();
        expect(screen.getByRole("button", { name: "Copy escrow funding transaction hash" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Copy escrow release transaction hash" })).toBeTruthy();
    });

    it("uses the testnet explorer and omits missing hashes", () => {
        vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "TESTNET");

        render(<EscrowTransactionLinks txHashLock="  " txHashRelease={releaseHash} />);

        expect(screen.queryByRole("link", { name: /funding transaction/i })).toBeNull();
        expect(screen.getByRole("link", {
            name: "View escrow release transaction on Stellar Expert",
        }).getAttribute("href")).toBe(
            `https://stellar.expert/explorer/testnet/tx/${releaseHash}`,
        );
    });

    it("renders no explorer section when both hashes are absent", () => {
        render(<EscrowTransactionLinks txHashLock={null} txHashRelease={undefined} />);

        expect(screen.queryByRole("region", { name: "Escrow Transactions" })).toBeNull();
        expect(screen.queryByRole("link")).toBeNull();
    });
});
