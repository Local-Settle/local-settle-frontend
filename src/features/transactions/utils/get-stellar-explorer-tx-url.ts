export function getStellarExplorerTxUrl(
    hash: string | null | undefined,
    network = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "TESTNET",
): string | null {
    const normalizedHash = hash?.trim();
    if (!normalizedHash) return null;

    const normalizedNetwork = network.trim().toUpperCase();
    const explorerNetwork = normalizedNetwork === "PUBLIC" || normalizedNetwork === "MAINNET"
        ? "public"
        : "testnet";

    return `https://stellar.expert/explorer/${explorerNetwork}/tx/${encodeURIComponent(normalizedHash)}`;
}
