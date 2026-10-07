"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { AssetBalance } from "@/features/wallet";
import { getAssetName, getFormattedBalance } from "./send-types";
import { ChevronDown, Check } from "lucide-react";

export function AssetIcon({ name, size = 32 }: { name: string; size?: number }) {
  if (name === "XLM") {
    return <Image src="/xlm.png" alt="XLM" width={size} height={size} className="w-full h-full object-cover" />;
  }
  if (name === "USDC") {
    return <Image src="/usdc.png" alt="USDC" width={size} height={size} className="w-full h-full object-cover" />;
  }
  return <span className="text-[10px] font-bold text-white uppercase">{name.slice(0, 3)}</span>;
}

interface SendAssetSelectProps {
  balances: AssetBalance[];
  selectedAsset: AssetBalance;
  onSelectAsset: (asset: AssetBalance) => void;
  disabled?: boolean;
}

export function SendAssetSelect({
  balances,
  selectedAsset,
  onSelectAsset,
  disabled = false,
}: SendAssetSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Ensure options include available balances or at least default USDC/XLM
  const availableOptions: AssetBalance[] = balances.length > 0
    ? balances
    : [{ asset_type: "credit_alphanum4", asset_code: "USDC", asset_issuer: null, balance: "0.00" }];

  const currentAssetName = getAssetName(selectedAsset);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="text-[#C2C7D0] text-[12px] mb-2 uppercase block font-semibold">
        Asset
      </label>

      <button
        type="button"
        disabled={disabled || availableOptions.length <= 1}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#081521] border border-[#11212E] hover:border-[#2a3a1a] rounded-xl px-4 py-3.5 flex items-center justify-between text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#55D6BE] disabled:opacity-80 disabled:cursor-default cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-[#1a2a3a] flex items-center justify-center border border-[#172B3A]">
            <AssetIcon name={currentAssetName} size={32} />
          </div>
          <div className="flex flex-col">
            <span className="text-[#FFFFFF] text-[14px] font-bold">{currentAssetName}</span>
            <span className="text-[10px] text-[#C2C7D0] uppercase">
              Balance: {getFormattedBalance(selectedAsset)} {currentAssetName}
            </span>
          </div>
        </div>

        {availableOptions.length > 1 ? (
          <ChevronDown
            size={18}
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#55D6BE]" : ""}`}
          />
        ) : (
          <span className="text-[10px] text-[#C2C7D099] uppercase tracking-wide">
            Default
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-[#0D1D2C] border border-[#263949] rounded-xl shadow-2xl overflow-hidden py-1">
          <div className="px-3 py-2 text-[10px] font-bold text-[#9BABB7] uppercase tracking-wider border-b border-[#263949]/50">
            Select Asset
          </div>
          <div className="max-h-60 overflow-y-auto">
            {availableOptions.map((opt, idx) => {
              const optName = getAssetName(opt);
              const isSelected = getAssetName(selectedAsset) === optName;
              return (
                <button
                  key={`${optName}-${idx}`}
                  type="button"
                  onClick={() => {
                    onSelectAsset(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[#172B3A] transition-colors cursor-pointer text-left ${
                    isSelected ? "bg-[#172B3A]/70" : ""
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-[#1a2a3a] flex items-center justify-center border border-[#172B3A]">
                      <AssetIcon name={optName} size={28} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white text-sm font-bold">{optName}</span>
                      <span className="text-[10px] text-gray-400">
                        {getFormattedBalance(opt)} {optName}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-[#55D6BE]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
