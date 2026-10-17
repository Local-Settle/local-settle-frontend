export type SendAnalyticsStage = 'resolve' | 'confirmation' | 'signing' | 'submit';
export type SendAnalyticsOutcome = 'started' | 'success' | 'failure' | 'cancelled';

/** Emit only bounded, non-wallet-sensitive send funnel fields when opted in. */
export function trackSendStage(stage: SendAnalyticsStage, outcome: SendAnalyticsOutcome): void {
  if (process.env.NEXT_PUBLIC_SEND_ANALYTICS_ENABLED !== 'true' || typeof window === 'undefined') return;

  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK?.toLowerCase() === 'public' ? 'mainnet' : 'testnet';
  window.dispatchEvent(new CustomEvent('local-settle:send-analytics', {
    detail: { stage, network, providerCategory: 'wallet', outcome },
  }));
}
