"use client";

import React from "react";
import type { SendStep } from "./send-types";
import { AlertOctagon, XCircle, RotateCcw, X, Loader2 } from "lucide-react";

const LOADING_MESSAGES: Record<string, { title: string; subtitle: string }> = {
  loading: {
    title: "Preparing Transaction",
    subtitle: "Resolving recipient and calculating optimal network fees...",
  },
  signing: {
    title: "Waiting for Signature",
    subtitle: "Please check and approve the transaction prompt in your wallet.",
  },
  submitting: {
    title: "Broadcasting Transfer",
    subtitle: "Submitting signed transaction to the Stellar ledger...",
  },
};

interface SendStatusViewProps {
  step: SendStep;
  errorMessage?: string | null;
  onRetry: () => void;
  onClose?: () => void;
}

export function SendStatusView({
  step,
  errorMessage,
  onRetry,
  onClose,
}: SendStatusViewProps) {
  const isTransacting = step === "loading" || step === "signing" || step === "submitting";

  if (isTransacting) {
    const info = LOADING_MESSAGES[step] ?? {
      title: "Processing",
      subtitle: "Please wait while we process your request...",
    };

    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 gap-6 text-center">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-[#55D6BE]/20 border-t-[#55D6BE] animate-spin" />
          <Loader2 className="w-8 h-8 text-[#55D6BE] absolute animate-pulse" />
        </div>
        <div className="flex flex-col gap-1.5 max-w-sm">
          <h3 className="text-white text-lg font-bold uppercase tracking-wide">
            {info.title}
          </h3>
          <p className="text-[#9BABB7] text-xs leading-relaxed">
            {info.subtitle}
          </p>
        </div>
      </div>
    );
  }

  if (step === "cancelled") {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <AlertOctagon size={32} />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <h3 className="text-white text-lg font-bold uppercase tracking-wide">
            Transaction Declined
          </h3>
          <p className="text-[#9BABB7] text-xs leading-relaxed">
            You rejected or cancelled the transaction prompt in your wallet.
          </p>
        </div>

        <div className="flex gap-3 w-full max-w-xs mt-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#11212E] hover:bg-[#172B3A] text-white text-xs font-bold uppercase px-4 py-3 rounded-xl transition-all border border-[#172B3A] cursor-pointer"
            >
              <X size={14} /> Cancel
            </button>
          )}
          <button
            type="button"
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#55D6BE] hover:bg-[#55D6BE] text-black text-xs font-black uppercase tracking-wider px-4 py-3 rounded-xl transition-all cursor-pointer shadow-md"
          >
            <RotateCcw size={14} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
          <XCircle size={32} />
        </div>
        <div className="flex flex-col gap-2 max-w-sm">
          <h3 className="text-white text-lg font-bold uppercase tracking-wide">
            Transfer Failed
          </h3>
          <p className="text-rose-300 text-xs bg-rose-950/40 border border-rose-800/40 rounded-xl p-3 leading-relaxed break-words">
            {errorMessage || "An unexpected error occurred while executing the transaction."}
          </p>
        </div>

        <div className="flex gap-3 w-full max-w-xs mt-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#11212E] hover:bg-[#172B3A] text-white text-xs font-bold uppercase px-4 py-3 rounded-xl transition-all border border-[#172B3A] cursor-pointer"
            >
              <X size={14} /> Close
            </button>
          )}
          <button
            type="button"
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#55D6BE] hover:bg-[#55D6BE] text-black text-xs font-black uppercase tracking-wider px-4 py-3 rounded-xl transition-all cursor-pointer shadow-md"
          >
            <RotateCcw size={14} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
