"use client";

import { Bell, Loader2, ShieldCheck, Mail, AlertTriangle, ArrowRightLeft, Lock } from "lucide-react";
import { useSecuritySettings } from "../hooks/useSecuritySettings";
import type { SecurityPreferences as PreferencesType } from "../types/security-settings.types";

interface PreferenceItem {
    key: keyof PreferencesType;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}

const PREFERENCE_ITEMS: PreferenceItem[] = [
    {
        key: "securityUpdates",
        title: "Security Updates",
        description: "Receive critical security patches, account safety notices, and protocol changes.",
        icon: ShieldCheck,
    },
    {
        key: "loginAlerts",
        title: "Login Alerts",
        description: "Get notified when a new wallet session or signature challenge is completed.",
        icon: Lock,
    },
    {
        key: "transactionNotifications",
        title: "Transaction Notifications",
        description: "Real-time alerts when Stellar transactions or deposits are confirmed on-chain.",
        icon: ArrowRightLeft,
    },
    {
        key: "escrowStatusUpdates",
        title: "Escrow Status Updates",
        description: "Notifications when escrow funds are deposited, locked, released, or refunded.",
        icon: AlertTriangle,
    },
    {
        key: "emailNotifications",
        title: "Email Notifications",
        description: "Receive security alerts and transaction receipts via your verified email address.",
        icon: Mail,
    },
];

export function SecurityPreferences() {
    const { preferences, isLoading, error, updatingKeys, updatePreference } = useSecuritySettings();

    return (
        <div className="rounded-xl border border-[#172B3A] bg-[#0E121B]/60 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-[#172B3A] pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#55D6BE]/10 text-[#55D6BE]">
                    <Bell className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-[17px] font-semibold text-white">Notification & Security Preferences</h2>
                    <p className="text-xs text-[#9BABB7]">
                        Manage which security alerts and activity notifications you receive
                    </p>
                </div>
            </div>

            <div className="pt-4 divide-y divide-[#172B3A]">
                {isLoading ? (
                    <div className="space-y-4 py-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between py-3 animate-pulse">
                                <div className="space-y-2">
                                    <div className="h-4 w-40 bg-[#172B3A] rounded" />
                                    <div className="h-3 w-64 bg-[#172B3A]/60 rounded" />
                                </div>
                                <div className="h-6 w-11 bg-[#172B3A] rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : (
                    PREFERENCE_ITEMS.map(({ key, title, description, icon: Icon }) => {
                        const isEnabled = preferences[key];
                        const isUpdating = !!updatingKeys[key];

                        return (
                            <div
                                key={key}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4"
                            >
                                <div className="flex items-start gap-3.5 max-w-xl">
                                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-[#161B22] text-[#9BABB7] shrink-0">
                                        <Icon className="h-4 w-4 text-[#55D6BE]" />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor={`pref-toggle-${key}`}
                                            className="text-sm font-medium text-white cursor-pointer"
                                        >
                                            {title}
                                        </label>
                                        <p className="text-xs text-[#9BABB7] mt-0.5 leading-relaxed">
                                            {description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                                    {isUpdating && (
                                        <Loader2 className="h-4 w-4 animate-spin text-[#55D6BE]" />
                                    )}
                                    <button
                                        id={`pref-toggle-${key}`}
                                        type="button"
                                        role="switch"
                                        aria-checked={isEnabled}
                                        aria-label={`Toggle ${title}`}
                                        disabled={isUpdating}
                                        onClick={() => void updatePreference(key, !isEnabled)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                                            isEnabled ? "bg-[#55D6BE]" : "bg-[#263949]"
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                                                isEnabled ? "translate-x-6" : "translate-x-1 bg-[#9BABB7]"
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        );
                    })
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
