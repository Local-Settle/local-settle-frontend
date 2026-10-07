"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BookOpen, ShieldCheck, Compass, ArrowLeft } from "lucide-react";

export default function InfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Platform Overview",
      href: "/info",
      icon: Compass,
      description: "How LocalSettle works & general flow",
    },
    {
      label: "Platform Features",
      href: "/info/features",
      icon: BookOpen,
      description: "P2P exchange & Stellar escrows",
    },
    {
      label: "Ecosystem Security",
      href: "/info/security",
      icon: ShieldCheck,
      description: "Wallet signing & system trust boundaries",
    },
  ];

  return (
    <div className="min-h-screen bg-[#081521] text-white flex flex-col font-sans selection:bg-[#55D6BE] selection:text-[#081521]">
      {/* Top Banner Background Blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#55D6BE]/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] left-0 w-[300px] h-[300px] bg-[#55D6BE]/2 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full bg-[#081521]/80 border-b border-[#ffffff10] backdrop-blur-md sticky top-0 z-50 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/localsettle-mark.svg"
                alt="LocalSettle"
                width={40}
                height={40}
                className="hover:scale-105 transition-transform"
              />
              <span className="text-xl font-black tracking-tighter text-white">
                LocalSettle <span className="text-[#55D6BE] font-normal text-sm tracking-widest uppercase ml-1">Docs</span>
              </span>
            </Link>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-12 md:py-16 relative z-10 flex flex-col lg:flex-row gap-10">
        {/* Left Sub-Navigation Sidebar */}
        <aside aria-label="Documentation Navigation" className="w-full lg:w-[320px] shrink-0 space-y-6">
          <div className="bg-[#11212E]/35 border border-[#ffffff08] rounded-3xl p-6 md:p-8 backdrop-blur-sm">
            <h2 className="text-[#9BABB7] text-xs font-black uppercase tracking-[2px] mb-6">
              Documentation Sections
            </h2>
            <nav aria-label="Documentation Sections" className="flex flex-col gap-3">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                const Icon = tab.icon;

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`group flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 ${
                      isActive
                        ? "bg-[#55D6BE]/10 border border-[#55D6BE]/20 text-white"
                        : "border border-transparent hover:bg-[#11212E]/55 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl transition-colors ${
                        isActive
                          ? "bg-[#55D6BE] text-[#081521]"
                          : "bg-white/5 text-gray-400 group-hover:bg-[#55D6BE]/10 group-hover:text-[#55D6BE]"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-sm leading-tight transition-colors duration-200">
                        {tab.label}
                      </span>
                      <span className="text-gray-500 text-[11px] font-light mt-1 leading-normal">
                        {tab.description}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Content Area */}
        <section className="flex-1 min-w-0">
          <div className="bg-[#11212E]/20 border border-[#ffffff05] rounded-[32px] p-6 md:p-12 min-h-[500px] backdrop-blur-sm">
            {children}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#081521] border-t border-[#ffffff05] py-8 text-center text-xs text-gray-500 tracking-wider font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <span>© 2026 LOCALSETTLE. POWERED BY STELLAR BLOCKCHAIN.</span>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white transition-colors">
              Platform
            </Link>
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Stellar Network
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
