"use client";

import { Aside } from "../../components/Aside";
import { Header } from "../../components/Header";
import { WalletDashboard } from "./components/WalletDashboard";
import { MarketSnapshot } from "./components/MarketSnapshot";
import { ActiveOrdersSection } from "@/features/order/components/ActiveOrdersSection";
import { useUser } from "@/features/user/presentation/context/UserContext";
import { Suspense } from "react";

export default function DashboardPage() {
    const { currentUser } = useUser();
    const displayName = currentUser?.alias || (currentUser?.publicKey ? `${currentUser.publicKey.slice(0, 6)}...` : "");

    return (
        <div className="flex min-h-screen w-full bg-[#081521]">
            <Aside />
            <div className="flex flex-col flex-1 min-w-0">
                <Header
                    description="account overview"
                    title="Welcome back,"
                    name={displayName}
                    mobileLabel="Welcome back"
                />
                <main className="flex flex-col w-full min-w-0">
                    <Suspense fallback={
                        <div className="w-full flex items-center justify-center p-8">
                            <div className="w-8 h-8 border-4 border-[#55D6BE] border-t-transparent rounded-full animate-spin" />
                        </div>
                    }>
                        <WalletDashboard />
                    </Suspense>

                    <div className="grid grid-cols-1 gap-6 px-4 pb-24 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-8 md:px-12 md:pb-12">
                        <ActiveOrdersSection />
                        <MarketSnapshot />
                    </div>
                </main>
            </div>
        </div>
    );
}