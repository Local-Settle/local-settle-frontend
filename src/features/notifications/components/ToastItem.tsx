"use client";

import { X, CheckCircle, CircleAlert, TriangleAlert, Info } from "lucide-react";
import Link from "next/link";
import type { NotificationType, Toast } from "../types/notification.types";

const TYPE_META: Record<NotificationType, { icon: typeof Info; label: string; border: string; iconClass: string; labelClass: string }> = {
    success: {
        icon: CheckCircle,
        label: "Success",
        border: "border-[#55D6BE]/40",
        iconClass: "text-[#55D6BE]",
        labelClass: "text-[#55D6BE]",
    },
    error: {
        icon: CircleAlert,
        label: "Error",
        border: "border-red-500/40",
        iconClass: "text-red-500",
        labelClass: "text-red-400",
    },
    warning: {
        icon: TriangleAlert,
        label: "Warning",
        border: "border-yellow-500/40",
        iconClass: "text-yellow-500",
        labelClass: "text-yellow-400",
    },
    info: {
        icon: Info,
        label: "Info",
        border: "border-blue-500/40",
        iconClass: "text-blue-500",
        labelClass: "text-blue-400",
    },
};

interface ToastItemProps {
    toast: Toast;
    onDismiss: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
    const meta = TYPE_META[toast.type];
    const Icon = meta.icon;
    const isAlert = toast.type === "error" || toast.type === "warning";

    const handleActionClick = () => {
        toast.action?.onAction?.();
        onDismiss(toast.id);
    };

    return (
        <li
            role={isAlert ? "alert" : "status"}
            aria-live={isAlert ? "assertive" : "polite"}
            data-testid={`toast-${toast.type}`}
            data-toast-id={toast.id}
            className={`toast-enter pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-[#0D1D2C] p-4 shadow-2xl ${meta.border}`}
        >
            <span className={`mt-0.5 shrink-0 ${meta.iconClass}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.labelClass}`}>
                        {meta.label}
                    </span>
                    <button
                        type="button"
                        onClick={() => onDismiss(toast.id)}
                        aria-label="Dismiss notification"
                        className="shrink-0 text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>

                <p className="mt-1 text-sm font-semibold leading-snug text-white">
                    {toast.title}
                </p>

                {toast.message && (
                    <p className="mt-0.5 text-xs leading-relaxed text-[#C2C7D0]">
                        {toast.message}
                    </p>
                )}

                {toast.action && (
                    <div className="mt-2">
                        {toast.action.href ? (
                            <Link
                                href={toast.action.href}
                                onClick={handleActionClick}
                                className="text-xs font-bold uppercase tracking-wide text-[#55D6BE] transition-colors hover:text-[#55D6BE]"
                            >
                                {toast.action.label}
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={handleActionClick}
                                className="text-xs font-bold uppercase tracking-wide text-[#55D6BE] transition-colors hover:text-[#55D6BE]"
                            >
                                {toast.action.label}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
}