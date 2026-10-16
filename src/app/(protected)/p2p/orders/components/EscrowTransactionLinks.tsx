"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { getStellarExplorerTxUrl } from "@/features/transactions/utils/get-stellar-explorer-tx-url";

interface EscrowTransactionLinksProps {
    txHashLock?: string | null;
    txHashRelease?: string | null;
}

const transactionLabels = [
    { key: "lock", label: "Escrow funding transaction" },
    { key: "release", label: "Escrow release transaction" },
] as const;

export function EscrowTransactionLinks({
    txHashLock,
    txHashRelease,
}: EscrowTransactionLinksProps) {
    const [copiedHash, setCopiedHash] = useState<string | null>(null);
    const hashes = { lock: txHashLock, release: txHashRelease };
    const transactions = transactionLabels.flatMap(({ key, label }) => {
        const hash = hashes[key]?.trim();
        const href = getStellarExplorerTxUrl(hash);
        return hash && href ? [{ hash, href, label }] : [];
    });

    if (transactions.length === 0) return null;

    const handleCopy = async (hash: string) => {
        try {
            await navigator.clipboard.writeText(hash);
            setCopiedHash(hash);
            setTimeout(() => setCopiedHash(null), 2000);
        } catch {
            // Ignore clipboard errors; the full hash remains selectable.
        }
    };

    return (
        <section
            aria-labelledby="escrow-transactions-heading"
            className="w-full bg-[#11212E] rounded-xl border border-white/[0.02] p-5 flex flex-col gap-4 shrink-0"
        >
            <h2 id="escrow-transactions-heading" className="text-white text-sm font-bold uppercase tracking-wide font-space">
                Escrow Transactions
            </h2>
            <div className="flex flex-col gap-3">
                {transactions.map(({ hash, href, label }) => (
                    <div key={label} className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[#C2C7D0] text-xs font-semibold uppercase tracking-wide">
                                {label}
                            </span>
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`View ${label.toLowerCase()} on Stellar Expert`}
                                className="flex items-center gap-1 text-[#55D6BE] text-xs font-semibold hover:underline"
                            >
                                View on Stellar Expert <ExternalLink aria-hidden="true" size={13} />
                            </a>
                        </div>
                        <div className="flex items-center gap-2 bg-[#081521] border border-white/[0.04] rounded-lg px-3 py-2">
                            <code className="text-[#D7E0E6] text-xs font-mono break-all select-all flex-1">
                                {hash}
                            </code>
                            <button
                                type="button"
                                onClick={() => handleCopy(hash)}
                                aria-label={`Copy ${label.toLowerCase()} hash`}
                                className="p-1.5 text-[#C2C7D0] hover:text-white rounded-lg hover:bg-white/5 transition-colors shrink-0"
                            >
                                {copiedHash === hash ? (
                                    <Check aria-hidden="true" size={14} className="text-[#55D6BE]" />
                                ) : (
                                    <Copy aria-hidden="true" size={14} />
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
