"use client";

import React, { forwardRef } from "react";
import { isStellarAddress, isPotentialAlias } from "./send-types";
import { UserCheck, KeyRound, ClipboardPaste } from "lucide-react";

interface SendRecipientInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string | null;
  disabled?: boolean;
  onError?: (message: string) => void;
}

export const SendRecipientInput = forwardRef<HTMLInputElement, SendRecipientInputProps>(
  function SendRecipientInput({ value, onChange, error, disabled = false, onError }, ref) {
    const trimmed = value.trim();
    const isGAddress = isStellarAddress(trimmed);
    const isAlias = !isGAddress && isPotentialAlias(trimmed);

    return (
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="send-recipient" className="text-[#C2C7D0] text-[12px] uppercase font-semibold">
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
            id="send-recipient"
            type="text"
            placeholder="alex.localsettle or GXXXXXX..."
            value={value}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "send-recipient-error" : "send-recipient-help"}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-[#26394933] bg-[#0D1D2C] px-4 pr-20 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#55D6BE] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-mono md:font-sans"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <button type="button" disabled={disabled} onClick={async () => {
            try {
              if (!navigator.clipboard?.readText) throw new Error("Clipboard access is unavailable. Paste the address into the field instead.");
              const text = await navigator.clipboard.readText();
              if (!text.trim()) throw new Error("The clipboard is empty.");
              onChange(text.trim());
            } catch (err) {
              onError?.(err instanceof Error ? err.message : "Could not read the clipboard. Paste the address into the field instead.");
            }
          }} className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-lg bg-[#11212E] px-2 py-1.5 text-[10px] font-semibold text-[#55D6BE] disabled:opacity-50" aria-label="Paste recipient from clipboard">
            <ClipboardPaste size={13} /> Paste
          </button>
        </div>

        {error ? (
          <span id="send-recipient-error" role="alert" className="text-red-400 text-[11px] mt-1.5 font-medium">{error}</span>
        ) : (
          <span id="send-recipient-help" className="text-[#C2C7D099] text-[10px] mt-1.5">
            Enter a Stellar public key (starting with G) or a registered LocalSettle alias.
          </span>
        )}
      </div>
    );
  }
);
