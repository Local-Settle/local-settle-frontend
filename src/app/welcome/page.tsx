"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Globe,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Navbar } from "./components/Navbar";
import { useWalletContext } from "../../features/wallet/presentation/context/WalletContext";
import { useWalletAvailability } from "../../features/wallet/presentation/hooks/useWalletAvailability";
import { walletOptions } from "../../features/wallet/config/wallet-options";
import { useRouter } from "next/navigation";
import { useFocusTrap } from "../hooks/useFocusTrap";

// --- CONNECT WALLET MODAL COMPONENT (WITH TESTNET & ENVIRONMENT VALIDATION) ---
export function ConnectWalletModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { connect, disconnect, isConnected, walletId } = useWalletContext();
  const { availability } = useWalletAvailability();
  const router = useRouter();
  const [modalState, setModalState] = useState<
    "select" | "connecting" | "failed"
  >("select");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  // Reset modal state whenever it transitions from closed to open. Adjusting
  // state during render (rather than in an Effect) avoids the extra
  // commit-then-effect render pass for a prop-driven reset like this one.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setModalState("select");
      setErrorMsg("");
      setSelectedWallet(null);
    }
  }

  const handleClose = () => {
    if (isConnected) {
      disconnect();
    }
    onClose();
  };

  const panelRef = useFocusTrap<HTMLDivElement>({
    active: isOpen,
    onClose: handleClose,
  });

  if (!isOpen) return null;

  const handleWalletConnect = async (selectedWalletId: string) => {
    if (isConnected && walletId && walletId !== selectedWalletId) {
      disconnect();
    }
    setSelectedWallet(selectedWalletId);
    setModalState("connecting");

    try {
      // Connection, Testnet enforcement, Horizon funded-account check, auth
      // and onboarding all happen inside the wallet context/service via
      // Stellar Wallets Kit — nothing wallet-specific left to do here.
      await connect(selectedWalletId);

      // Success - context handled redirection, close modal
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Connection failed. Please try again.");
      setModalState("failed");
    }
  };

  const selectedWalletName = walletOptions.find((w) => w.id === selectedWallet)?.name ?? "your wallet";

  const dialogTitleId =
    modalState === "connecting"
      ? "connect-wallet-connecting-title"
      : modalState === "failed"
        ? "connect-wallet-failed-title"
        : "connect-wallet-select-title";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal Box */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabIndex={-1}
        className="relative w-full max-w-[500px] bg-[#0C1B27] border border-[#ffffff10] rounded-[32px] p-8 md:p-10 shadow-2xl z-10 text-white animate-[fadeInUp_0.3s_ease-out_forwards]"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors cursor-pointer"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {modalState === "select" && (
          <div>
            <h3 id="connect-wallet-select-title" className="text-3xl font-black tracking-tight mb-2 text-white leading-tight">
              Connect Your Wallet
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Choose your preferred Stellar provider to access the LocalSettle ecosystem.
            </p>

            {/* Development Disclaimer Banner */}
            <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3 text-sm text-blue-200">
              <svg className="w-6 h-6 flex-shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>
                <strong>Early Access:</strong> This application is currently in development. Connections are only available via browser extensions and exclusively for <strong>Testnet</strong> accounts.
              </p>
            </div>

            <div className="space-y-4">
              {/* Join Waitlist Option (Top Priority) */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/register");
                }}
                className="group flex w-full items-center justify-between p-5 bg-[#55D6BE]/10 border border-[#55D6BE]/30 rounded-2xl hover:bg-[#55D6BE]/20 hover:border-[#55D6BE] hover:scale-[1.01] transition-all duration-300 cursor-pointer text-left shadow-[0_0_15px_rgba(85,214,190,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55D6BE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C1B27]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#55D6BE] shadow-md">
                    <svg
                      className="w-6 h-6 text-[#081521]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[#55D6BE] font-bold text-lg leading-tight group-hover:text-white transition-colors">
                      Join the Waitlist
                    </h4>
                    <p className="text-gray-400 text-xs mt-0.5 font-light">
                      Get notified for our Mainnet launch
                    </p>
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-[#55D6BE] group-hover:text-white transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#0C1B27] px-2 text-gray-500 uppercase tracking-wider">Or connect to Testnet</span>
                </div>
              </div>

              {/* Wallet Options — driven by the shared Stellar Wallets Kit config,
                  so adding a wallet only means editing config/wallet-options.ts.
                  Laid out as a 2-column grid so all 6 options render within the
                  modal without pushing it into a long scroll. */}
              <div className="grid grid-cols-2 gap-3">
                {walletOptions.filter((wallet) => wallet.enabled).map((wallet) => {
                  const isUnavailable = availability[wallet.id] === false;

                  return (
                    <button
                      key={wallet.id}
                      type="button"
                      aria-label={isUnavailable ? `Install ${wallet.name}` : `Connect ${wallet.name}`}
                      onClick={() => {
                        if (isUnavailable) {
                          window.open(wallet.url, "_blank", "noopener,noreferrer");
                          return;
                        }
                        handleWalletConnect(wallet.id);
                      }}
                      className={`group flex flex-col items-center text-center gap-2 p-4 bg-[#11212E]/40 border border-white/5 rounded-2xl transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55D6BE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C1B27] ${isUnavailable ? "opacity-60" : "hover:bg-[#172B3A] hover:border-[#55D6BE] hover:scale-[1.03]"
                        }`}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-tr from-white/15 to-white/5 shadow-md overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={wallet.icon} alt={wallet.name} className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                      <h4 className="text-white font-bold text-sm leading-tight group-hover:text-[#55D6BE] transition-colors">
                        {wallet.name}
                      </h4>
                      {isUnavailable && (
                        <p className="text-gray-500 text-[11px] leading-tight font-light">
                          Not installed
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {modalState === "connecting" && (
          <div className="flex flex-col items-center text-center py-6 space-y-6">
            <div className="w-12 h-12 border-4 border-[#55D6BE] border-t-transparent rounded-full animate-spin" />
            <div>
              <h3 id="connect-wallet-connecting-title" className="text-2xl font-bold text-white mb-2">
                Connecting to {selectedWalletName}...
              </h3>
              <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                Please authorize the connection request in your wallet extension
                popup.
              </p>
            </div>
          </div>
        )}

        {modalState === "failed" && (
          <div className="flex flex-col items-center text-center py-6 space-y-6 animate-[fadeInUp_0.25s_ease-out_forwards]">
            {/* Warning Red Sign */}
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 id="connect-wallet-failed-title" className="text-2xl font-black text-white mb-2 tracking-tight">
                Connection Failed
              </h3>
              <p className="text-red-400 text-sm font-light max-w-sm mx-auto leading-relaxed bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-left">
                {errorMsg}
              </p>
            </div>
            <button
              onClick={() => {
                setModalState("select");
                setErrorMsg("");
              }}
              className="w-full py-4 bg-[#55D6BE] hover:bg-[#38B99F] text-[#081521] font-bold rounded-xl transition-all duration-150 active:scale-95 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- MAIN HOMEPAGE COMPONENT ---
export default function HomePage() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const handleConnectWallet = () => setIsConnectModalOpen(true);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#081521] text-white selection:bg-[#55D6BE] selection:text-[#081521]">
      <Navbar onConnectClick={handleConnectWallet} />
      <main>
        <section className="relative isolate overflow-hidden border-b border-white/10">
          <div aria-hidden="true" className="absolute -right-40 -top-40 -z-10 h-[560px] w-[560px] rounded-full bg-[#55D6BE]/10 blur-[110px]" />
          <div aria-hidden="true" className="absolute -bottom-56 left-1/3 -z-10 h-[440px] w-[440px] rounded-full bg-sky-400/10 blur-[100px]" />
          <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#55D6BE]/25 bg-[#55D6BE]/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#8DE8D5]">
                <span className="h-2 w-2 rounded-full bg-[#55D6BE]" />
                Built on Stellar · Testnet preview
              </div>
              <h1 className="text-5xl font-semibold leading-[1.04] tracking-[-0.05em] md:text-7xl">
                Local money moves <span className="text-[#55D6BE]">on Stellar.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300 md:text-xl">
                LocalSettle brings people together to trade stablecoins for local payments, with on-chain escrow coordinating each peer-to-peer deal.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button onClick={handleConnectWallet} className="inline-flex items-center gap-2 rounded-xl bg-[#55D6BE] px-6 py-3.5 font-semibold text-[#081521] transition hover:bg-[#8DE8D5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  Connect a Stellar wallet <ArrowRight className="h-4 w-4" />
                </button>
                <Link href="/info" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 font-semibold text-white transition hover:border-white/35 hover:bg-white/5">
                  Explore how it works <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-5 text-sm text-slate-400">Use a compatible wallet connected to Stellar Testnet to preview the app.</p>
            </div>

            <div className="relative mx-auto w-full max-w-lg">
              <div className="rounded-[2rem] border border-white/10 bg-[#0D1D2C]/90 p-5 shadow-[0_32px_100px_-40px_rgba(85,214,190,0.35)] backdrop-blur">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Trade preview</p>
                    <p className="mt-1 text-xs text-slate-500">Peer-to-peer · Stellar escrow</p>
                  </div>
                  <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-200">Awaiting agreement</span>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-8">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <p className="text-xs text-slate-400">You send</p>
                    <p className="mt-3 text-2xl font-semibold">250 <span className="text-base text-slate-400">USDC</span></p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[#55D6BE]/10 text-[#55D6BE]"><ArrowRight className="h-4 w-4" /></div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <p className="text-xs text-slate-400">Local payment</p>
                    <p className="mt-3 text-sm font-medium text-slate-300">Local currency</p>
                    <p className="mt-1 text-xs text-slate-400">Agreed with your peer</p>
                  </div>
                </div>
                <div className="space-y-4 rounded-2xl bg-[#081521] p-4">
                  <div className="flex items-center gap-3 text-sm"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#55D6BE] text-[#081521]"><Check className="h-4 w-4" /></span><span className="text-slate-200">Trade terms agreed</span></div>
                  <div className="flex items-center gap-3 text-sm"><span className="grid h-7 w-7 place-items-center rounded-full border border-[#55D6BE]/60 text-[#55D6BE]">2</span><span className="text-slate-300">USDC secured in escrow</span></div>
                  <div className="flex items-center gap-3 text-sm"><span className="grid h-7 w-7 place-items-center rounded-full border border-white/15 text-slate-400">3</span><span className="text-slate-400">Peer confirms local payment</span></div>
                </div>
                <div className="mt-4 flex items-center gap-2 px-1 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-[#55D6BE]" />Escrow state is recorded on Stellar.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#55D6BE]">One wallet, two ways to move</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Tools for everyday Stellar payments.</h2>
            <p className="mt-5 text-base leading-7 text-slate-400">Trade with another person through the marketplace or send USDC directly to a wallet address or LocalSettle alias.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { number: "01", title: "Find a trade", description: "Browse buy and sell offers, compare terms, and choose a payment method that works for you." },
              { number: "02", title: "Coordinate locally", description: "Use the order chat and payment evidence to keep both sides aligned during settlement." },
              { number: "03", title: "Settle on-chain", description: "Track escrow progress on Stellar, or send USDC directly with a wallet-signed transaction." },
            ].map((item) => (
              <article key={item.number} className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 md:p-8">
                <span className="text-sm font-semibold text-[#55D6BE]">{item.number}</span>
                <h3 className="mt-8 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-400">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0D1D2C]">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-14 md:flex-row md:items-center md:px-8 md:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#55D6BE]">Open source, built for Stellar</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">A clearer path from local payment to on-chain settlement.</h2>
              <p className="mt-4 leading-7 text-slate-400">LocalSettle is in active development. Connect on Testnet to explore the product, or read the project overview and technical notes.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link href="https://github.com/iKa-h" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 font-semibold hover:bg-white/5">View source <ArrowUpRight className="h-4 w-4" /></Link>
              <button onClick={handleConnectWallet} className="inline-flex items-center gap-2 rounded-xl bg-[#55D6BE] px-5 py-3 font-semibold text-[#081521] hover:bg-[#8DE8D5]">Try the app <Wallet className="h-4 w-4" /></button>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-4">
          <Image src="/localsettle-wordmark.svg" alt="LocalSettle" width={180} height={42} />
          <span>Peer-to-peer settlement on Stellar.</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-5">
          <Link href="/info" className="hover:text-white">Project overview</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="https://stellar.org" className="inline-flex items-center gap-1 hover:text-white">Stellar <Globe className="h-3.5 w-3.5" /></Link>
        </nav>
        <span>© 2026 LocalSettle</span>
      </footer>
      <ConnectWalletModal isOpen={isConnectModalOpen} onClose={() => setIsConnectModalOpen(false)} />
    </div>
  );
}
