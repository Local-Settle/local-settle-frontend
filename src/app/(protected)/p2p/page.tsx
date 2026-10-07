import { Aside } from "../../components/Aside";
import { Header } from "../../components/Header";
import { OrderNavbar } from "./components/OrderNavbar";
import { TradeDashboard } from "./components/TradeDashboard";
import { OrdersSummaryBox } from "./components/OrdersSummaryBox";

export default function p2pPage() {
    return (
        <div className="flex min-h-screen w-full bg-[#081521]">
            <Aside />
            <div className="flex flex-col min-w-0 flex-1 pb-20 md:pb-0">
                <Header description="trading floor" title="p2p marketplace" />
                <OrderNavbar />
                <main className="flex-1 pt-0 flex flex-col lg:flex-row gap-4">
                    <div className="px-4 lg:px-8 h-full flex-1 lg:flex-[7]">
                        <TradeDashboard />
                    </div>
                    
                    <div className="hidden lg:block w-px bg-[#263949]" />
                    <div className="hidden lg:flex flex-[3] pt-8 px-8 flex-col gap-6 shrink-0">
                        <OrdersSummaryBox />
                    </div>
                    <div className="lg:hidden px-4 pb-4">
                        <OrdersSummaryBox />
                    </div>
                </main>
            </div>
        </div>
    );
}