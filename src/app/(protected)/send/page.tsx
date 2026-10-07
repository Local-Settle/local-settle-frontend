"use client";

import React, { useState, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Aside } from "@/app/components/Aside";
import { Header } from "@/app/components/Header";
import {
  useWallet,
  useWalletBalance,
  walletOptions,
  type AssetBalance,
} from "@/features/wallet";
import { useSend } from "@/features/wallet/presentation/hooks/useSend";
import { useNotifications } from "@/features/notifications";
import {
  SendAssetSelect,
  SendRecipientInput,
  SendAmountInput,
  SendConfirmView,
  SendStatusView,
  SendSuccessView,
  getAssetName,
  getFormattedBalance,
  isStellarAddress,
  isPotentialAlias,
} from "@/features/wallet/presentation/components/send";
import {
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Wallet,
  Info,
  Layers,
  CheckCircle2,
} from "lucide-react";

function SendContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, publicKey, connect, isLoading: isWalletLoading } = useWallet();
  const { balances, isLoading: isBalancesLoading } = useWalletBalance(publicKey);
  const { state, resolveAndPrepare, confirmSend, reset, backToConfirm } = useSend();
  const { notify } = useNotifications();

  // Read URL query params
  const initialRecipient =
    searchParams.get("wallet") ||
    searchParams.get("recipient") ||
    searchParams.get("to") ||
    "";
  const initialAsset = searchParams.get("asset") || "";
  const initialAmount = searchParams.get("amount") || "";

  const [selectedAssetCode, setSelectedAssetCode] = useState<string | null>(
    initialAsset ? initialAsset.toUpperCase() : "USDC"
  );
  const [recipientInput, setRecipientInput] = useState(initialRecipient);
  const [amount, setAmount] = useState(initialAmount);
  const [inputError, setInputError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Derive selected asset from balances and user selection
  const selectedAsset: AssetBalance = React.useMemo(() => {
    if (balances.length > 0) {
      if (selectedAssetCode) {
        const match = balances.find(
          (b) => getAssetName(b).toUpperCase() === selectedAssetCode.toUpperCase()
        );
        if (match) return match;
      }
      const usdc = balances.find((b) => b.asset_code === "USDC");
      return usdc || balances[0];
    }
    return {
      asset_type: "credit_alphanum4",
      asset_code: selectedAssetCode || "USDC",
      asset_issuer: null,
      balance: "0.00",
    };
  }, [balances, selectedAssetCode]);

  const assetName = getAssetName(selectedAsset);
  const isTransacting =
    state.step === "loading" ||
    state.step === "signing" ||
    state.step === "submitting";

  // Notify on success / error
  useEffect(() => {
    if (state.step === "success") {
      notify({
        type: "success",
        title: "Transfer Sent",
        message: `Successfully transferred ${amount} ${assetName}`,
      });
    } else if (state.step === "error" && state.errorMessage) {
      notify({
        type: "error",
        title: "Transfer Failed",
        message: state.errorMessage,
      });
    }
  }, [state.step, state.errorMessage, amount, assetName, notify]);

  const handleReviewSend = () => {
    const trimmed = recipientInput.trim();
    if (!trimmed) {
      setInputError("Please enter a recipient address or alias");
      return;
    }

    if (!isStellarAddress(trimmed) && !isPotentialAlias(trimmed)) {
      setInputError("Please enter a valid Stellar address (G...) or LocalSettle alias");
      return;
    }

    const numAmount = parseFloat(amount || "0");
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError("Please enter an amount greater than 0");
      return;
    }

    const availBalance = parseFloat(selectedAsset.balance) || 0;
    if (numAmount > availBalance) {
      setAmountError(
        `Amount exceeds available balance (${getFormattedBalance(selectedAsset)} ${assetName})`
      );
      return;
    }

    setInputError(null);
    setAmountError(null);
    resolveAndPrepare(trimmed, amount, assetName);
  };

  const handleResetForm = () => {
    reset();
    setAmount("");
    setRecipientInput("");
    setInputError(null);
    setAmountError(null);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#081521] text-white">
      <Aside />

      <div className="flex flex-col flex-1 min-w-0 pb-20 md:pb-0">
        <Header
          title="Send Funds"
          description="Instant cross-border crypto transfers"
          mobileLabel="Send"
        />

        <main className="flex-1 px-4 md:px-12 py-8 max-w-7xl w-full mx-auto">
          {!isConnected ? (
            /* Wallet Not Connected State */
            <div className="max-w-xl mx-auto mt-8 bg-[#0D1D2C] border border-[#263949] rounded-3xl p-8 text-center flex flex-col items-center gap-6 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-[#55D6BE]/10 border border-[#55D6BE]/30 flex items-center justify-center text-[#55D6BE]">
                <Wallet size={32} />
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                  Connect Your Wallet
                </h2>
                <p className="text-[#9BABB7] text-sm max-w-md leading-relaxed">
                  To send Stellar assets or LocalSettle transfers, please connect a supported Stellar wallet.
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full max-w-sm mt-2">
                {walletOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => connect(option.id)}
                    disabled={isWalletLoading}
                    className="w-full flex items-center justify-between px-5 py-4 bg-[#11212E] hover:bg-[#172B3A] border border-[#263949] hover:border-[#55D6BE]/50 rounded-2xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      {option.icon && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={option.icon}
                          alt={option.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      )}
                      <div className="text-left">
                        <p className="text-white font-bold text-sm group-hover:text-[#55D6BE] transition-colors">
                          {option.name}
                        </p>
                        <p className="text-[#9BABB7] text-xs">{option.description}</p>
                      </div>
                    </div>
                    <ArrowUpRight
                      size={18}
                      className="text-[#9BABB7] group-hover:text-[#55D6BE] transition-colors"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Connected Flow: 2-Column Responsive Layout */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Primary Send Card (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="bg-[#0D1D2C] border border-[#263949] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                  {/* Subtle top-right gradient glow */}
                  <div
                    className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
                    style={{
                      background: "radial-gradient(circle, #55D6BE 0%, transparent 70%)",
                      transform: "translate(30%, -30%)",
                    }}
                  />

                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#263949]">
                    <div className="flex flex-col">
                      <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                        <Zap size={22} className="text-[#55D6BE]" />
                        {state.step === "form" && "New Transfer"}
                        {state.step === "confirm" && "Review Transaction"}
                        {state.step === "success" && "Success"}
                        {(state.step === "loading" ||
                          state.step === "signing" ||
                          state.step === "submitting") &&
                          "Processing"}
                        {state.step === "error" && "Error"}
                        {state.step === "cancelled" && "Declined"}
                      </h2>
                      <p className="text-[#9BABB7] text-xs uppercase tracking-wider font-semibold mt-1">
                        {state.step === "form" && "Direct On-Chain Transfer"}
                        {state.step === "confirm" && "Check details & sign"}
                        {state.step === "success" && "Transfer finalized on ledger"}
                        {state.step === "cancelled" && "Signature aborted"}
                        {state.step === "error" && "Action needed"}
                      </p>
                    </div>

                    {state.step === "form" && (
                      <span className="px-3 py-1 bg-[#55D6BE]/10 border border-[#55D6BE]/20 rounded-full text-[10px] font-extrabold uppercase text-[#55D6BE] tracking-wider">
                        Step 1 of 2
                      </span>
                    )}
                    {state.step === "confirm" && (
                      <span className="px-3 py-1 bg-[#55D6BE]/10 border border-[#55D6BE]/20 rounded-full text-[10px] font-extrabold uppercase text-[#55D6BE] tracking-wider">
                        Step 2 of 2
                      </span>
                    )}
                  </div>

                  {/* Form Step */}
                  {state.step === "form" && (
                    <div className="flex flex-col gap-6">
                      <SendRecipientInput
                        value={recipientInput}
                        onChange={(val) => {
                          setRecipientInput(val);
                          setInputError(null);
                        }}
                        error={inputError}
                        disabled={isTransacting}
                      />

                      <SendAssetSelect
                        balances={balances}
                        selectedAsset={selectedAsset}
                        onSelectAsset={(asset) => {
                          setSelectedAssetCode(getAssetName(asset));
                          setAmountError(null);
                        }}
                        disabled={isTransacting}
                      />

                      <SendAmountInput
                        amount={amount}
                        onChangeAmount={(val) => {
                          setAmount(val);
                          setAmountError(null);
                        }}
                        selectedAsset={selectedAsset}
                        error={amountError}
                        disabled={isTransacting}
                      />

                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={handleReviewSend}
                          disabled={
                            !recipientInput.trim() ||
                            !amount ||
                            parseFloat(amount) <= 0 ||
                            isTransacting
                          }
                          className="w-full bg-[#55D6BE] hover:bg-[#55D6BE] text-black text-sm font-black uppercase tracking-wider px-6 py-4 rounded-2xl transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Zap size={18} className="stroke-[2.5]" />
                          Review & Send
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Loading / Status Steps */}
                  {(isTransacting ||
                    state.step === "error" ||
                    state.step === "cancelled") && (
                    <SendStatusView
                      step={state.step}
                      errorMessage={state.errorMessage}
                      onRetry={
                        state.step === "cancelled" ? backToConfirm : reset
                      }
                      onClose={reset}
                    />
                  )}

                  {/* Confirmation Step */}
                  {state.step === "confirm" && state.recipient && (
                    <SendConfirmView
                      recipient={state.recipient}
                      amount={amount}
                      assetName={assetName}
                      fee={state.fee}
                      onBack={reset}
                      onConfirm={confirmSend}
                      isLoading={isTransacting}
                    />
                  )}

                  {/* Success Step */}
                  {state.step === "success" && (
                    <SendSuccessView
                      amount={amount}
                      assetName={assetName}
                      recipientAddress={state.recipient?.address || recipientInput}
                      recipientAlias={state.recipient?.alias}
                      txHash={state.txHash}
                      onReset={handleResetForm}
                      onDone={() => startTransition(() => router.push("/dashboard"))}
                    />
                  )}
                </div>
              </div>

              {/* Sidebar Info & Balances (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* Available Assets Card */}
                <div className="bg-[#0D1D2C] border border-[#263949] rounded-3xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <Layers size={16} className="text-[#55D6BE]" />
                      Wallet Assets
                    </h3>
                    <span className="text-[11px] text-[#9BABB7]">
                      {balances.length} {balances.length === 1 ? "Asset" : "Assets"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {isBalancesLoading ? (
                      <p className="text-xs text-gray-500 py-4 text-center">
                        Loading balances...
                      </p>
                    ) : balances.length === 0 ? (
                      <div className="p-4 rounded-xl bg-[#081521] border border-[#11212E] text-center">
                        <p className="text-xs text-[#9BABB7]">
                          No funded balances found on this account.
                        </p>
                      </div>
                    ) : (
                      balances.map((asset, idx) => {
                        const code = getAssetName(asset);
                        const isCurrent = getAssetName(selectedAsset) === code;
                        return (
                          <div
                            key={`${code}-${idx}`}
                            onClick={() => setSelectedAssetCode(code)}
                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                              isCurrent
                                ? "bg-[#172B3A]/60 border-[#55D6BE]/40"
                                : "bg-[#081521] border-[#11212E] hover:border-[#172B3A] hover:bg-[#12161d]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#1a2a3a] border border-[#172B3A] flex items-center justify-center overflow-hidden">
                                <span className="text-[11px] font-bold text-white">
                                  {code.slice(0, 3)}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">
                                  {code}
                                </span>
                                <span className="text-[10px] text-[#9BABB7] uppercase">
                                  {asset.asset_type === "native"
                                    ? "Native Lumens"
                                    : "Stellar Asset"}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-bold text-white tabular-nums block">
                                {getFormattedBalance(asset)}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] text-[#55D6BE] font-bold uppercase tracking-wider">
                                  Selected
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Information Card */}
                <div className="bg-[#0D1D2C] border border-[#263949] rounded-3xl p-6 shadow-xl flex flex-col gap-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#55D6BE]" />
                    Transfer Guarantee
                  </h3>

                  <div className="space-y-3 text-xs text-[#9BABB7] leading-relaxed">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={15} className="text-[#55D6BE] shrink-0 mt-0.5" />
                      <p>
                        <strong className="text-white">Sub-second Finality:</strong> Transactions settle directly on the Stellar network in 3-5 seconds.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={15} className="text-[#55D6BE] shrink-0 mt-0.5" />
                      <p>
                        <strong className="text-white">Low Fixed Fee:</strong> Transparent 0.3% LocalSettle network fee per transaction.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={15} className="text-[#55D6BE] shrink-0 mt-0.5" />
                      <p>
                        <strong className="text-white">Alias Resolution:</strong> Send seamlessly using either raw public keys or human-readable names.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#081521] border border-[#11212E] rounded-xl flex items-center gap-2 mt-2">
                    <Info size={14} className="text-blue-400 shrink-0" />
                    <span className="text-[10px] text-gray-400">
                      Need help? Ensure the recipient address is active on Stellar.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SendPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#081521]">
          <div className="w-8 h-8 border-4 border-[#55D6BE] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SendContent />
    </Suspense>
  );
}
