"use client";

import React, { useState } from "react";
import { Check, Copy, ExternalLink, ArrowRight, RotateCcw } from "lucide-react";
import { truncateAddress } from "./send-types";

interface SendSuccessViewProps {
  amount: string;
  assetName: string;
  recipientAddress: string;
  recipientAlias?: string | null;
  txHash: string | null;
  onReset: () => void;
  onDone?: () => void;
}

export function SendSuccessView({
  amount,
  assetName,
  recipientAddress,
  recipientAlias,
  txHash,
  onReset,
  onDone,
}: SendSuccessViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!txHash) return;
    try {
      await navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  const network = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet").toLowerCase();
  const explorerUrl = txHash
    ? `https://stellar.expert/explorer/${network}/tx/${txHash}`
    : null;

  return (
    <div className="flex flex-col items-center justify-center py-6 px-2 gap-6 w-full text-center">
      {/* Checkmark Icon with Glow */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-20 h-20 bg-[#55D6BE]/20 rounded-full blur-xl animate-pulse" />
        <div className="w-16 h-16 rounded-full bg-[#55D6BE]/10 border-2 border-[#55D6BE] flex items-center justify-center text-[#55D6BE] relative shadow-lg">
          <Check size={32} strokeWidth={3} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-white text-2xl font-black uppercase tracking-tight">
          Transfer Complete
        </h3>
        <p className="text-[#9BABB7] text-sm">
          Successfully sent <span className="text-white font-bold">{amount} {assetName}</span> to{" "}
          <span className="text-[#55D6BE] font-semibold">
            {recipientAlias || truncateAddress(recipientAddress)}
          </span>
        </p>
      </div>

      {/* Transaction Details Box */}
      {txHash && (
        <div className="w-full bg-[#081521] border border-[#11212E] rounded-2xl p-4 flex flex-col gap-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[#9BABB7] text-[11px] font-bold uppercase tracking-wider">
              Transaction Hash
            </span>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-[#55D6BE] hover:underline font-semibold"
              >
                Explorer <ExternalLink size={12} />
              </a>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 bg-[#0D1D2C] border border-[#263949] rounded-xl px-3 py-2">
            <span className="text-xs text-gray-300 font-mono break-all truncate">
              {txHash}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
              title="Copy Hash"
              aria-label="Copy transaction hash"
            >
              {copied ? <Check size={14} className="text-[#55D6BE]" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 w-full pt-2">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-2 bg-[#11212E] hover:bg-[#172B3A] text-white text-xs font-bold uppercase px-4 py-3.5 rounded-xl transition-all border border-[#172B3A] cursor-pointer"
        >
          <RotateCcw size={15} /> Send Another
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="flex-1 flex items-center justify-center gap-2 bg-[#55D6BE] hover:bg-[#55D6BE] text-black text-xs font-black uppercase tracking-wider px-5 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            Dashboard <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
