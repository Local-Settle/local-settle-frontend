"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import Image from 'next/image'
import { ConnectButton } from "@/features/wallet/presentation/components/ConnectButton";
import { walletOptions } from "@/features/wallet/config/wallet-options";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { getRovingFocusIndex } from "@/utils/keyboardNavigation";

const navLinks = [
	{ label: "Home", href: "/" },
	{ label: "Statistics", href: "/stats" },
	{ label: "Info", href: "/info" },
];

export function Navbar({ onConnectClick }: { onConnectClick?: () => void }) {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const navRef = useRef<HTMLElement>(null);
	const desktopTriggerRef = useRef<HTMLButtonElement>(null);
	const mobileTriggerRef = useRef<HTMLButtonElement>(null);
	const desktopMenuRef = useRef<HTMLDivElement>(null);
	const mobileMenuRef = useRef<HTMLDivElement>(null);
	const lastDropdownTriggerRef = useRef<HTMLButtonElement | null>(null);
	const pathname = usePathname()

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (navRef.current && !navRef.current.contains(e.target as Node)) {
				setDropdownOpen(false);
			}
		}
		function handleEscape(e: KeyboardEvent) {
			if (e.key !== "Escape") return;
			if (dropdownOpen) {
				e.preventDefault();
				setDropdownOpen(false);
				requestAnimationFrame(() => lastDropdownTriggerRef.current?.focus());
			} else if (mobileMenuOpen) {
				setMobileMenuOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [dropdownOpen, mobileMenuOpen]);

	const focusMenuItem = (menuRef: React.RefObject<HTMLDivElement | null>, index: number) => {
		requestAnimationFrame(() => {
			const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])');
			items?.[index]?.focus();
		});
	};

	const handleConnectClick = (trigger: HTMLButtonElement | null) => {
		if (onConnectClick) {
			onConnectClick();
			return;
		}
		lastDropdownTriggerRef.current = trigger;
		setDropdownOpen(open => !open);
	};

	const handleConnectKeyDown = (
		event: React.KeyboardEvent<HTMLButtonElement>,
		menuRef: React.RefObject<HTMLDivElement | null>,
	) => {
		if (onConnectClick) return;
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			lastDropdownTriggerRef.current = event.currentTarget;
			setDropdownOpen(true);
			const itemCount = walletOptions.filter(wallet => wallet.enabled).length;
			focusMenuItem(menuRef, event.key === "ArrowDown" ? 0 : itemCount - 1);
		} else if (event.key === "Escape" && dropdownOpen) {
			event.preventDefault();
			setDropdownOpen(false);
			event.currentTarget.focus();
		}
	};

	const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape") return;
		if (event.key === "Tab") {
			setDropdownOpen(false);
			return;
		}

		const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'));
		const currentIndex = items.indexOf(event.target as HTMLElement);
		const nextIndex = getRovingFocusIndex(event.key, Math.max(0, currentIndex), items.length, "vertical");
		if (nextIndex !== null) {
			event.preventDefault();
			items[nextIndex]?.focus();
		}
	};

	return (
		<nav ref={navRef} aria-label="Public Navigation" className="w-full bg-[#081521CC] border-b border-[#FFFFFF1A] backdrop-blur-md sticky top-0 z-50 px-4 md:px-8">
			<div className="max-w-7xl mx-auto flex items-center justify-between h-16">
				<div className="flex flex-row items-center gap-4">
					<Image
						src="/localsettle-wordmark.svg"
						alt="LocalSettle logo"
						width={100}
						height={45}
					/>
				</div>

				<ul className="hidden md:flex items-center gap-8">
					{navLinks.map((link) => {
						const isActive = pathname === link.href
						return (
							<li key={link.label}>
								<Link
									href={link.href}
									className={`text-sm transition-colors duration-150 ${isActive
										? "text-[#55D6BE] font-medium"
										: "text-gray-400 hover:text-white font-medium"
										}`}
								>
									{link.label}
								</Link>
							</li>
						);
					})}
				</ul>
				
				<div className="hidden md:block relative">
					<button
						ref={desktopTriggerRef}
						type="button"
						onClick={() => handleConnectClick(desktopTriggerRef.current)}
						onKeyDown={(event) => handleConnectKeyDown(event, desktopMenuRef)}
						aria-haspopup={onConnectClick ? "dialog" : "menu"}
						aria-expanded={onConnectClick ? undefined : dropdownOpen}
						aria-controls={!onConnectClick && dropdownOpen ? "desktop-wallet-menu" : undefined}
						className="flex items-center gap-1 justify-center bg-[#55D6BE] hover:bg-[#38B99F] active:scale-95 text-[#081521] 
						text-sm font-bold w-[150.02px] h-10 rounded-full transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#081521]"
					>
						Connect Wallet
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none"
							className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}>
							<path d="M3 5L7 9L11 5" stroke="#0d0d0d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</button>

					{dropdownOpen && (
						<div className="absolute right-0 mt-2 w-64 border border-[#55D6BE] rounded-xl shadow-2xl overflow-hidden z-50 bg-[#081521]">
							<p className="text-xs text-gray-500 px-4 pt-3 pb-2 uppercase tracking-widest">
								Choose wallet
							</p>
							<div
								ref={desktopMenuRef}
								id="desktop-wallet-menu"
								role="menu"
								aria-label="Choose wallet"
								onKeyDown={handleMenuKeyDown}
							>
							{walletOptions.filter((wallet) => wallet.enabled).map((wallet) => (
								<div role="none" key={wallet.id}>
									<ConnectButton label={wallet.name} description={wallet.description} walletId={wallet.id} icon={wallet.icon} menuItem />
								</div>
							))}
							</div>
							<div className="border-t border-white/10 px-4 py-3">
								<p className="text-xs text-gray-600 text-center">
									By connecting you agree to our{" "}
									<Link href="/terms" className="text-[#55D6BE] cursor-pointer hover:underline">Terms</Link>
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Mobile Menu Button */}
				<div className="md:hidden flex items-center">
					<button
						type="button"
						aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
						aria-expanded={mobileMenuOpen}
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="text-gray-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55D6BE]"
					>
						{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
					</button>
				</div>
			</div>

			{/* Mobile Menu Dropdown */}
			{mobileMenuOpen && (
				<div className="md:hidden absolute top-16 left-0 w-full bg-[#081521] border-b border-[#FFFFFF1A] shadow-2xl z-40 py-4 px-4 flex flex-col gap-6">
					<ul className="flex flex-col gap-4" aria-label="Mobile Navigation Menu">
						{navLinks.map((link) => {
							const isActive = pathname === link.href;
							return (
								<li key={link.label}>
									<Link
										href={link.href}
										onClick={() => setMobileMenuOpen(false)}
										className={`block text-lg transition-colors duration-150 ${isActive
											? "text-[#55D6BE] font-medium"
											: "text-gray-400 hover:text-white font-medium"
											}`}
									>
										{link.label}
									</Link>
								</li>
							);
						})}
					</ul>
					
					<div className="relative border-t border-[#ffffff1a] pt-6">
						<button
							ref={mobileTriggerRef}
							type="button"
							onClick={() => handleConnectClick(mobileTriggerRef.current)}
							onKeyDown={(event) => handleConnectKeyDown(event, mobileMenuRef)}
							aria-haspopup={onConnectClick ? "dialog" : "menu"}
							aria-expanded={onConnectClick ? undefined : dropdownOpen}
							aria-controls={!onConnectClick && dropdownOpen ? "mobile-wallet-menu" : undefined}
							className="flex items-center gap-2 justify-center bg-[#55D6BE] hover:bg-[#38B99F] active:scale-95 text-[#081521] 
							text-sm font-bold w-full h-12 rounded-full transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#081521]"
						>
							Connect Wallet
							<svg width="14" height="14" viewBox="0 0 14 14" fill="none"
								className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}>
								<path d="M3 5L7 9L11 5" stroke="#0d0d0d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</button>

						{dropdownOpen && (
							<div className="mt-4 w-full border border-[#55D6BE] rounded-xl shadow-2xl overflow-hidden bg-[#11212E]/50">
								<p className="text-xs text-gray-500 px-4 pt-3 pb-2 uppercase tracking-widest">
									Choose wallet
								</p>
								<div
									ref={mobileMenuRef}
									id="mobile-wallet-menu"
									role="menu"
									aria-label="Choose wallet"
									onKeyDown={handleMenuKeyDown}
								>
								{walletOptions.filter((wallet) => wallet.enabled).map((wallet) => (
									<div role="none" key={wallet.id}>
										<ConnectButton label={wallet.name} description={wallet.description} walletId={wallet.id} icon={wallet.icon} menuItem />
									</div>
								))}
								</div>
								<div className="border-t border-white/10 px-4 py-3">
									<p className="text-xs text-gray-600 text-center">
										By connecting you agree to our{" "}
										<Link href="/terms" className="text-[#55D6BE] cursor-pointer hover:underline">Terms</Link>
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</nav>
	);
}
