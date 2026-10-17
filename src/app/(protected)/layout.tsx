"use client";

import { useWallet } from "@/features/wallet";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isConnected, isLoading } = useWallet();
  const router = useRouter();
  const canAccess = isConnected;

  useEffect(() => {
    if (!isLoading && !canAccess) {
      router.replace("/welcome");
      return;
    }
  }, [canAccess, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#081521]">
        <div className="w-8 h-8 border-4 border-[#55D6BE] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!canAccess) return null;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-[200] rounded bg-[#55D6BE] px-4 py-3 font-semibold text-[#081521] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      {children}
    </>
  );
}
