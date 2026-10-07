"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const OrderNavbar = () => {
    const pathname = usePathname();
    const isOrders = pathname === "/p2p/orders" || pathname.startsWith("/p2p/orders/");

    return (
        <nav aria-label="P2P Order Navigation" className="flex items-center gap-4 px-4 md:px-12 pt-6 bg-[#0A0D14]/30 border-b border-[#263949] shrink-0">
            <Link
                href="/p2p"
                className={`pb-4 font-medium text-[14px] uppercase tracking-wider transition-colors cursor-pointer flex-1 md:flex-none text-center md:text-left ${
                    !isOrders
                        ? "text-[#55D6BE] font-bold border-b-2 border-[#55D6BE]"
                        : "text-[#9BABB7] hover:text-white border-b-2 border-transparent"
                }`}
            >
                Market
            </Link>
            <Link
                href="/p2p/orders"
                className={`pb-4 font-medium text-[14px] uppercase tracking-wider transition-colors cursor-pointer flex-1 md:flex-none text-center md:text-left ${
                    isOrders
                        ? "text-[#55D6BE] font-bold border-b-2 border-[#55D6BE]"
                        : "text-[#9BABB7] hover:text-white border-b-2 border-transparent"
                }`}
            >
                Orders
            </Link>
        </nav>
    );
};
