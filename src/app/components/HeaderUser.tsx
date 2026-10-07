'use client';

import { User } from "lucide-react";
import { useUser } from "@/features/user/presentation/context/UserContext";

function truncateKey(publicKey: string) {
    if (publicKey.length <= 11) return publicKey;
    return `${publicKey.slice(0, 5)}…${publicKey.slice(-4)}`;
}

export function HeaderUser() {
    const { currentUser } = useUser();

    if (!currentUser) return null;

    const username = truncateKey(currentUser.publicKey);
    const alias = currentUser.alias?.trim();
    const initial = (alias?.[0] ?? currentUser.publicKey?.[0] ?? "").toUpperCase();

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#374151] text-white text-sm font-semibold shrink-0 overflow-hidden">
                {currentUser.profileImageUrl ? (
                    <img
                        src={currentUser.profileImageUrl}
                        alt={alias ?? "User avatar"}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    initial || <User size={18} strokeWidth={2} />
                )}
            </div>

            <div className="hidden sm:flex flex-col min-w-0 max-w-[160px]">
                <span className="text-white text-sm font-semibold truncate">
                    {username}
                </span>
                {alias && (
                    <span className="text-[#9BABB7] text-xs truncate">
                        {alias}
                    </span>
                )}
            </div>
        </div>
    );
}
