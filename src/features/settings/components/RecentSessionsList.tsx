"use client";

import { Laptop, Smartphone, Globe, Clock, ShieldCheck, RefreshCw } from "lucide-react";
import { useRecentSessions } from "../hooks/useRecentSessions";

export function RecentSessionsList() {
    const { sessions, isLoading, error, reload } = useRecentSessions();

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="rounded-xl border border-[#172B3A] bg-[#0E121B]/60 p-6 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#172B3A] pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#55D6BE]/10 text-[#55D6BE]">
                        <Globe className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-[17px] font-semibold text-white">Recent Sessions & Login Activity</h2>
                        <p className="text-xs text-[#9BABB7]">
                            Devices and browsers that recently connected to your LocalSettle profile
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => void reload()}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#172B3A] bg-[#161B22] px-3 py-1.5 text-xs font-medium text-[#9BABB7] hover:text-white hover:bg-[#263949] transition cursor-pointer disabled:opacity-50"
                    aria-label="Refresh recent sessions"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            <div className="pt-4">
                {isLoading ? (
                    <div className="space-y-3 py-2">
                        {[1, 2].map((i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between rounded-lg border border-[#172B3A] bg-[#081521] p-4 animate-pulse"
                            >
                                <div className="space-y-2">
                                    <div className="h-4 w-32 bg-[#172B3A] rounded" />
                                    <div className="h-3 w-48 bg-[#172B3A]/60 rounded" />
                                </div>
                                <div className="h-6 w-20 bg-[#172B3A] rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="py-8 text-center text-sm text-[#9BABB7]">
                        No recent session activity is available.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map((session) => {
                            const isMobile =
                                /mobile|android|iphone|ipad/i.test(session.device) ||
                                (session.os && /android|ios/i.test(session.os));
                            const Icon = isMobile ? Smartphone : Laptop;

                            return (
                                <div
                                    key={session.id}
                                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 transition ${
                                        session.isCurrent
                                            ? "border-[#55D6BE]/30 bg-[#55D6BE]/5"
                                            : "border-[#172B3A] bg-[#081521]"
                                    }`}
                                >
                                    <div className="flex items-start gap-3.5">
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                                                session.isCurrent
                                                    ? "bg-[#55D6BE]/20 text-[#55D6BE]"
                                                    : "bg-[#161B22] text-[#9BABB7]"
                                            }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-medium text-white">
                                                    {session.device}
                                                </h3>
                                                {session.isCurrent && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#55D6BE]/15 px-2 py-0.5 text-[11px] font-semibold text-[#55D6BE]">
                                                        <ShieldCheck className="h-3 w-3" />
                                                        Current session
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#9BABB7]">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(session.createdAt)}
                                                </span>
                                                {session.ipAddress && (
                                                    <span>IP: {session.ipAddress}</span>
                                                )}
                                                {session.location && (
                                                    <span>• {session.location}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {!session.isCurrent && (
                                        <div className="self-end sm:self-center">
                                            <span
                                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                                    session.status === "active"
                                                        ? "bg-[#10B981]/15 text-[#10B981]"
                                                        : session.status === "revoked"
                                                        ? "bg-[#EF4444]/15 text-[#EF4444]"
                                                        : "bg-[#9BABB7]/15 text-[#9BABB7]"
                                                }`}
                                            >
                                                {session.status}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 p-3 text-xs text-[#F87171]">
                    {error}
                </div>
            )}
        </div>
    );
}
