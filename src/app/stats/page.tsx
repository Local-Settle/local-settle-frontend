'use client';

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "../welcome/components/Navbar";
import { useStats } from "@/features/stats/hooks/useStats";
import type { TimeWindow } from "@/features/stats/hooks/useStats";
import { MetricCard } from "./components/MetricCard";
import { ShieldCheck, TrendingUp, UserPlus, Wallet } from "lucide-react";
import dynamic from "next/dynamic";
const WaitlistGrowth = dynamic(() => import("./components/WaitlistGrowth").then(mod => mod.WaitlistGrowth), { ssr: false });

export default function StatsPage() {
    const [, setIsConnectModalOpen] = useState(false);
    const [timeWindow, setTimeWindow] = useState<TimeWindow>("7d");
    const { stats, getStats } = useStats();

    const handleConnectWallet = () => {
        setIsConnectModalOpen(true);
    };

    const handleWindowChange = useCallback((w: TimeWindow) => {
        setTimeWindow(w);
        getStats(w);
    }, [getStats]);

    useEffect(() => {
        getStats("7d");
    }, [getStats]);

    const escrowsCompleted = stats?.escrows_completed || 0;
    const escrowsCreated = stats?.escrow_created || 0;
    const escrowSuccessRate = escrowsCreated > 0 
        ? ((escrowsCompleted / escrowsCreated) * 100).toFixed(1) 
        : "0.0";

    // Calcular "Waitlist Interest Boost" (crecimiento últimos 7 días)
    let waitlistBoost = "0.0";
    const timeline = stats?.waitlist_timeline || [];
    if (timeline.length > 0) {
        const currentMembers = stats?.waitlist_member || 0;
        // El array finaliza en "hoy". Para ir 7 días atrás, retrocedemos 7 índices.
        // Si el array es más corto (ej. inicio hace <7 días), tomamos el primer índice (0).
        const prevIndex = Math.max(0, timeline.length - 8);
        const previousMembers = timeline[prevIndex].count;
        const growth = currentMembers - previousMembers;
        
        if (previousMembers > 0) {
            waitlistBoost = ((growth / previousMembers) * 100).toFixed(1);
        } else if (growth > 0) {
            waitlistBoost = "100.0";
        }
    }

    return (
        <div className="min-h-screen bg-[#081521] text-white flex flex-col font-sans overflow-x-hidden selection:bg-[#55D6BE] selection:text-[#081521]">
            <Navbar onConnectClick={handleConnectWallet} />
            
            <main className="flex-1 w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-10">
                    <h1 className="text-[#55D6BE] font-bold text-xl mb-2">
                        STATISTICS & ANALYTICS
                    </h1>
                    <p className="text-[#C0CAAD] text-sm">
                        Real-time network performance and node consensus data.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
                    <MetricCard
                        icon={<UserPlus size={18} />}
                        badge={
                            <span className="flex items-center gap-1 text-[11px] text-[#55D6BE] font-medium tracking-wide">
                                <TrendingUp size={11} /> {waitlistBoost}% BOOST
                            </span>
                        }
                        label="Waitlist Interest"
                        value={<span className="text-[#55D6BE]">{stats?.waitlist_member || 0}</span>}
                        unit="Units"
                    />
                    <MetricCard
                        icon={<Wallet size={20} />}
                        badge={
                            <span className="flex items-center justify-center gap-1 text-[10px] text-[#55D6BE] font-extrabold uppercase">
                                Testnet Alpha
                            </span>
                        }
                        label="Connected Wallets"
                        value={stats?.wallets_connected || 0}
                        unit="Active"
                    />
                    <MetricCard
                        icon={<ShieldCheck size={20} />}
                        badge={
                            <span className="flex items-center justify-center gap-1 text-[10px] text-[#55D6BE] font-extrabold uppercase">
                                {escrowSuccessRate}% Success
                            </span>
                        }
                        label="Escrows Completed"
                        value={escrowsCompleted}
                        unit="Settled"
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-20">
                    <div className="xl:col-span-2 flex flex-col bg-[#1A1A1A99] border border-[#FFFFFF0D] rounded-lg p-6 min-h-[380px]">
                        <div className="flex justify-between items-center mb-10">
                            <p className="font-semibold text-xl text-[#E3E2E2]">Waitlist growth</p>
                        </div>
                        <div className="flex-1 w-full min-w-0">
                            <WaitlistGrowth
                                timeLine={stats?.waitlist_timeline || []}
                                activeWindow={timeWindow}
                                onWindowChange={handleWindowChange}
                            />
                        </div>
                    </div>

                    <div className="xl:col-span-1 flex flex-col bg-[#1A1A1A99] border border-[#FFFFFF0D] rounded-lg p-6">
                        <p className="text-[#E3E2E2] font-bold text-[11px] mb-8">Live Feed Stats</p>
                        <div className="flex flex-col gap-12">
                            <div>
                                <p className="text-[14px] text-[#C0CAAD]">Escrows Created</p>
                                <p className="text-[24px] text-[#A0FB00] font-bold">{stats?.escrow_created || 0}</p>
                            </div>
                            <div>
                                <p className="text-[14px] text-[#C0CAAD]">Avg. Monthly Completed Escrows</p>
                                <p className="text-[24px] text-[#E3E2E2] font-bold">{stats?.avg_monthly_completed_escrow || 0}</p>
                            </div>
                            <div>
                                <p className="text-[14px] text-[#C0CAAD]">Avg. Transactions per User (a month)</p>
                                <p className="text-[24px] text-[#E3E2E2] font-bold">{stats?.avg_transactions_per_user || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}