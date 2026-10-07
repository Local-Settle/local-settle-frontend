"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_STORAGE_KEY = "ikash_cookie_consent";

export function CookieConsentBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
            if (!stored) {
                setIsVisible(true);
            }
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    const handleChoice = (choice: "accepted" | "declined") => {
        localStorage.setItem(CONSENT_STORAGE_KEY, choice);
        setIsVisible(false);
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div
            role="region"
            aria-label="Cookie consent"
            className="fixed bottom-0 left-0 right-0 z-[60] border-t border-[#ffffff1a] bg-[#081521]/95 backdrop-blur-md px-4 py-4 md:px-8"
        >
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <p className="text-xs md:text-sm text-gray-400 flex-1 text-center md:text-left">
                    We use cookies to keep you signed in and to understand how LocalSettle is used. See our{" "}
                    <Link href="/privacy" className="text-[#55D6BE] hover:underline">
                        Privacy Policy
                    </Link>{" "}
                    for details.
                </p>
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={() => handleChoice("declined")}
                        className="text-xs md:text-sm text-gray-400 hover:text-white font-medium px-4 py-2 rounded-full transition-colors duration-150 cursor-pointer"
                    >
                        Decline
                    </button>
                    <button
                        onClick={() => handleChoice("accepted")}
                        className="bg-[#55D6BE] hover:bg-[#38B99F] active:scale-95 text-[#081521] text-xs md:text-sm font-bold px-5 py-2 rounded-full transition-all duration-150 cursor-pointer"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
}
