'use client';

import { CloseModalProps } from "@/app/utils/closeModalProps";
import { useRef, useState, useEffect } from "react";
import { useWallet, useWalletBalance, type AssetBalance } from "@/features/wallet";
import { useSend } from "@/features/wallet/presentation/hooks/useSend";
import { useSearchParams } from "next/navigation";
import { useFocusTrap } from "@/app/hooks/useFocusTrap";
import { useNotifications } from "@/features/notifications";
import {
  SendAssetSelect,
  SendRecipientInput,
  SendAmountInput,
  SendConfirmView,
  SendStatusView,
  SendSuccessView,
  getAssetName,
  isStellarAddress,
  isPotentialAlias,
} from "@/features/wallet/presentation/components/send";

export function SendFundsModal({ onClose }: CloseModalProps) {
  const { publicKey } = useWallet();
  const { balances } = useWalletBalance(publicKey);
  const { state, resolveAndPrepare, confirmSend, reset, backToConfirm } = useSend();
  const { notify } = useNotifications();
  const searchParams = useSearchParams();
  const walletQuery = searchParams.get('wallet') || searchParams.get('recipient') || "";

  const [selectedAssetCode, setSelectedAssetCode] = useState<string | null>("USDC");
  const [recipientInput, setRecipientInput] = useState(walletQuery);
  const [amount, setAmount] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const recipientInputRef = useRef<HTMLInputElement>(null);

  // Derive selected asset from balances and selection
  const selectedAsset: AssetBalance = balances.length > 0
    ? (selectedAssetCode ? balances.find(b => getAssetName(b).toUpperCase() === selectedAssetCode.toUpperCase()) || balances.find(b => b.asset_code === "USDC") || balances[0] : balances.find(b => b.asset_code === "USDC") || balances[0])
    : { asset_type: "credit_alphanum4", asset_code: selectedAssetCode || "USDC", asset_issuer: null, balance: "0.00" };

  const assetName = getAssetName(selectedAsset);
  const isTransacting = state.step === "loading" || state.step === "signing" || state.step === "submitting";

  // Notify on success or error transitions
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

  const handleClose = () => {
    reset();
    onClose();
  };

  const panelRef = useFocusTrap<HTMLDivElement>({
    onClose: !isTransacting ? handleClose : undefined,
    initialFocusRef: recipientInputRef,
  });

  const handleReviewSend = () => {
    const trimmed = recipientInput.trim();
    if (!trimmed) {
      setInputError("Please enter a recipient address or alias");
      return;
    }

    if (!isStellarAddress(trimmed) && !isPotentialAlias(trimmed)) {
      setInputError("Please enter a valid Stellar public key (G...) or LocalSettle alias");
      return;
    }

    const numAmount = parseFloat(amount || "0");
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError("Please enter an amount greater than 0");
      return;
    }

    const availBalance = parseFloat(selectedAsset.balance) || 0;
    if (numAmount > availBalance) {
      setAmountError(`Amount exceeds available balance (${selectedAsset.balance} ${assetName})`);
      return;
    }

    setInputError(null);
    setAmountError(null);
    resolveAndPrepare(trimmed, amount, assetName);
  };

  const headerTitle =
    state.step === "success" ? "Transfer Complete" :
    state.step === "error" ? "Transaction Failed" :
    state.step === "cancelled" ? "Cancelled" :
    state.step === "confirm" ? "Confirm Send" :
    "Send Funds";

  const headerSubtitle =
    state.step === "form" ? "Instant cross-border crypto transfers." :
    state.step === "confirm" ? "Review the details before signing." :
    state.step === "success" ? "Your transfer was successful." :
    state.step === "error" ? "Something went wrong." :
    state.step === "cancelled" ? "You declined the transaction." : "";

  return (
    <div
      className="fixed inset-0 bg-[black/60] backdrop-blur-sm z-40 flex items-center justify-end"
      onClick={!isTransacting ? handleClose : undefined}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-funds-title"
        tabIndex={-1}
        className="bg-[#081521F2] h-full w-full max-w-md p-8 border-l md:border-r border-white/10 flex flex-col overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <h2 id="send-funds-title" className="text-white text-[28px] md:text-[30px] font-bold uppercase tracking-tight">
              {headerTitle}
            </h2>
            {headerSubtitle && <p className="text-[#C2C7D0] text-[13px]">{headerSubtitle}</p>}
          </div>
          {!isTransacting && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
              aria-label="Close send modal"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="w-full h-px mb-6" style={{ background: 'linear-gradient(to right, #55D6BE00, #55D6BE, #55D6BE00)' }} />

        {/* Form */}
        {state.step === "form" && (
          <div className="flex flex-col gap-5 flex-1">
            <SendRecipientInput
              ref={recipientInputRef}
              value={recipientInput}
              onChange={(val) => {
                setRecipientInput(val);
                setInputError(null);
              }}
              error={inputError}
            />

            <SendAssetSelect
              balances={balances}
              selectedAsset={selectedAsset}
              onSelectAsset={(asset) => {
                setSelectedAssetCode(getAssetName(asset));
                setAmountError(null);
              }}
            />

            <SendAmountInput
              amount={amount}
              onChangeAmount={(val) => {
                setAmount(val);
                setAmountError(null);
              }}
              selectedAsset={selectedAsset}
              error={amountError}
            />

            <div className="flex w-full items-center justify-center mt-auto pt-6">
              <button
                type="button"
                onClick={handleReviewSend}
                disabled={!recipientInput.trim() || !amount || parseFloat(amount) <= 0}
                className="w-full bg-[#55D6BE] hover:bg-[#55D6BE] text-black font-bold uppercase tracking-wider px-4 py-3.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg hover:scale-[1.01] active:scale-[0.99]"
              >
                Review & Send
              </button>
            </div>
          </div>
        )}

        {/* Loading / Signing / Submitting / Error / Cancelled */}
        {(isTransacting || state.step === "error" || state.step === "cancelled") && (
          <div className="flex-1 flex flex-col justify-center">
            <SendStatusView
              step={state.step}
              errorMessage={state.errorMessage}
              onRetry={state.step === "cancelled" ? backToConfirm : reset}
              onClose={handleClose}
            />
          </div>
        )}

        {/* Confirm */}
        {state.step === "confirm" && state.recipient && (
          <div className="flex-1 flex flex-col justify-between">
            <SendConfirmView
              recipient={state.recipient}
              amount={amount}
              assetName={assetName}
              fee={state.fee}
              onBack={reset}
              onConfirm={confirmSend}
            />
          </div>
        )}

        {/* Success */}
        {state.step === "success" && (
          <div className="flex-1 flex flex-col justify-center">
            <SendSuccessView
              amount={amount}
              assetName={assetName}
              recipientAddress={state.recipient?.address || recipientInput}
              recipientAlias={state.recipient?.alias}
              txHash={state.txHash}
              onReset={() => {
                reset();
                setAmount("");
                setRecipientInput("");
              }}
              onDone={handleClose}
            />
          </div>
        )}
      </div>
    </div>
  );
}
