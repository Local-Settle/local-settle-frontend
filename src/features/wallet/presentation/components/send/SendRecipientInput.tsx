"use client";

import React, { forwardRef } from "react";
import { isStellarAddress, isPotentialAlias } from "./send-types";
import { UserCheck, KeyRound } from "lucide-react";

interface SendRecipientInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string | null;
  disabled?: boolean;
}

export const SendRecipientInput = forwardRef<HTMLInputElement, SendRecipientInputProps>(
  function SendRecipientInput({ value, onChange, error, disabled = false }, ref) {
    const trimmed = value.trim();
    const isGAddress = isStellarAddress(trimmed);
    const isAlias = !isGAddress && isPotentialAlias(trimmed);

    return (
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[#C2C7D0] text-[12px] uppercase font-semibold">
            Recipient Address or Alias
          </label>
          {isGAddress && (
            <span className="flex items-center gap-1 text-[10px] text-[#55D6BE] font-medium uppercase tracking-wider bg-[#55D6BE]/10 px-2 py-0.5 rounded-full border border-[#55D6BE]/20">
              <KeyRound size={11} /> Stellar Address
            </span>
          )}
          {isAlias && (
            <span className="flex items-center gap-1 text-[10px] text-[#38bdf8] font-medium uppercase tracking-wider bg-[#38bdf8]/10 px-2 py-0.5 rounded-full border border-[#38bdf8]/20">
              <UserCheck size={11} /> LocalSettle Alias
            </span>
          )}
        </div>

        <div className="relative">
          <input
            ref={ref}
            type="text"
            placeholder="alex.localsettle or GXXXXXX..."
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-[#26394933] bg-[#0D1D2C] px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#55D6BE] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-mono md:font-sans"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>

        {error ? (
          <span className="text-red-400 text-[11px] mt-1.5 font-medium">{error}</span>
        ) : (
          <span className="text-[#C2C7D099] text-[10px] mt-1.5">
            Enter a Stellar public key (starting with G) or a registered LocalSettle alias.
          </span>
        )}
      </div>
    );
  }
);
