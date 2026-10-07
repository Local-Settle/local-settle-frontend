"use client";

import React from "react";
import type { RecipientInfo } from "./send-types";
import { truncateAddress } from "./send-types";
import { AlertTriangle, ArrowLeft, Send } from "lucide-react";

interface SendConfirmViewProps {
  recipient: RecipientInfo;
  amount: string;
  assetName: string;
  fee: string | null;
  onBack: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function SendConfirmView({
  recipient,
  amount,
  assetName,
  fee,
  onBack,
  onConfirm,
  isLoading = false,
}: SendConfirmViewProps) {
  const feeNum = fee ? parseFloat(fee) : (parseFloat(amount || "0") * 0.003);
  const amountNum = parseFloat(amount || "0");
  const totalNum = amountNum + feeNum;

  const feeDisplay = feeNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
  const totalDisplay = totalNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Recipient Details Card */}
      <div className="bg-[#081521] border border-[#11212E] rounded-2xl p-5">
        <p className="text-[#9BABB7] text-[11px] font-bold uppercase tracking-wider mb-3">
          Sending to
        </p>
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#1a2a3a] border border-[#2a3a1a] flex items-center justify-center text-[#55D6BE] font-bold text-sm shrink-0 shadow-inner">
            {recipient.alias ? recipient.alias.slice(0, 2).toUpperCase() : "G"}
          </div>
          <div className="flex flex-col min-w-0">
            {recipient.alias && (
              <span className="text-white font-bold text-base tracking-tight truncate">
                {recipient.alias}
              </span>
            )}
            <span className="text-[#C2C7D0] text-xs font-mono break-all">
              {truncateAddress(recipient.address)}
            </span>
            {!recipient.exists && (
              <span className="text-amber-400 text-[10px] mt-1 font-medium">
                No LocalSettle profile — sending directly to Stellar address
              </span>
            )}
          </div>
        </div>

        {/* Warning if USDC and no trustline */}
        {assetName === "USDC" && !recipient.hasUsdcTrustline && (
          <div className="mt-4 p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300 text-xs leading-relaxed">
              Recipient account might not have established a USDC trustline yet. The transfer could fail if not funded.
            </p>
          </div>
        )}
      </div>

      {/* Transaction Details Card */}
      <div className="bg-[#081521] border border-[#11212E] rounded-2xl p-5">
        <p className="text-[#9BABB7] text-[11px] font-bold uppercase tracking-wider mb-3">
          Transfer Summary
        </p>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#9BABB7]">Transfer Amount</span>
            <span className="text-white font-bold tabular-nums">
              {amount} {assetName}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#9BABB7]">Network / Protocol Fee (0.3%)</span>
            <span className="text-white font-bold tabular-nums">
              {feeDisplay} {assetName}
            </span>
          </div>
          <div className="w-full h-px bg-[#11212E] my-2" />
          <div className="flex justify-between items-center text-base">
            <span className="text-[#C2C7D0] font-semibold">Total Deducted</span>
            <span className="text-[#55D6BE] font-black tabular-nums text-lg">
              {totalDisplay} {assetName}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-[#11212E] hover:bg-[#172B3A] text-white text-xs font-bold uppercase px-4 py-3.5 rounded-xl transition-all border border-[#172B3A] disabled:opacity-50 cursor-pointer"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-[#55D6BE] hover:bg-[#55D6BE] text-black text-xs font-black uppercase tracking-wider px-5 py-3.5 rounded-xl transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          <Send size={15} className="stroke-[2.5]" /> Sign & Send
        </button>
      </div>
    </div>
  );
}
