'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, Settings } from 'lucide-react'
import { useWallet } from '@/features/wallet'
import { useUser } from '@/features/user/presentation/context/UserContext'
import { HeaderUser } from './HeaderUser'

type HeaderProps = {
    description?: string
    title: string
    name?: string
    mobileLabel?: string
    showUser?: boolean
}

export function Header({ description, title, name, mobileLabel, showUser = true }: HeaderProps) {
    const router = useRouter()
    const { disconnect } = useWallet()
    const { setCurrentUser, setAccessToken } = useUser()
    const [menuOpen, setMenuOpen] = useState(false)

    const handleLogout = () => {
        disconnect()
        setCurrentUser(null)
        setAccessToken(null)
        router.push('/')
    }

    return (
        <>
            {/* Desktop header */}
            <header className="hidden md:flex items-center justify-between px-12 py-4 border-b border-[#263949] w-full">
                <div className="uppercase font-bold">
                    <div className="text-[12px] text-[#9BABB7]">
                        {description !== undefined && <p>{description}</p>}
                    </div>
                    <div className="text-[24px] text-white">
                        {name !== undefined ? <h1>{title} {name}</h1> : <h1>{title}</h1>}
                    </div>
                </div>
                {showUser && <HeaderUser />}
            </header>

            {/* Mobile header — sticky, solid background, hamburger + HeaderUser */}
            <header className="md:hidden sticky top-0 z-50 bg-[#0D1D2C] border-b border-[#263949] px-5 py-4">
                {!menuOpen ? (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMenuOpen(true)}
                            className="p-1"
                            aria-label="Open menu"
                            aria-expanded={menuOpen}
                        >
                            <Menu size={22} color="#ffffff" />
                        </button>

                        <div className="flex flex-col">
                            {mobileLabel !== undefined && (
                                <p className="text-[10px] text-[#9BABB7] uppercase tracking-wide">{mobileLabel}</p>
                            )}
                            {showUser && (
                                <div className="mt-1">
                                    <HeaderUser />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <nav className="flex flex-col gap-5" aria-label="Mobile Header Navigation">
                        <button
                            onClick={() => setMenuOpen(false)}
                            className="text-left text-[#55D6BE] text-base font-bold tracking-widest uppercase"
                            aria-label="Close menu"
                            aria-expanded={menuOpen}
                        >
                            Menu
                        </button>
                        <Link
                            href="/settings"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 text-white text-[17px] hover:text-[#55D6BE] transition-colors"
                        >
                            <Settings size={24} strokeWidth={2} />
                            Settings
                        </Link>
                        <button
                            onClick={() => { setMenuOpen(false); handleLogout() }}
                            className="flex items-center gap-3 text-white text-[17px] hover:text-[#55D6BE] transition-colors"
                        >
                            <Image src='/logout-icon.svg' width={24} height={24} alt='logout' />
                            Logout
                        </button>
                    </nav>
                )}
            </header>

            {/* Full-page blur overlay when menu is open */}
            {menuOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 transition-opacity duration-200"
                    onClick={() => setMenuOpen(false)}
                    style={{
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        background: 'rgba(0,0,0,0.35)',
                    }}
                />
            )}
        </>
    )
}
