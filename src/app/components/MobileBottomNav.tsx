'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'

export type NavLink = {
    href: string
    label: string
    icon: LucideIcon
}

function getNotchPath(activeIndex: number, totalLinks: number, viewBoxWidth: number) {
    if (activeIndex < 0) {
        return `M0,0 L${viewBoxWidth},0 L${viewBoxWidth},70 L0,70 Z`
    }

    const slotWidth = viewBoxWidth / totalLinks
    const cx = slotWidth * activeIndex + slotWidth / 2
    const r = 32
    const notchDepth = 22

    return `M0,0 
        L${cx - r - 15},0 
        Q${cx - r - 5},0 ${cx - r},${notchDepth * 0.4}
        Q${cx - r * 0.5},${notchDepth} ${cx},${notchDepth}
        Q${cx + r * 0.5},${notchDepth} ${cx + r},${notchDepth * 0.4}
        Q${cx + r + 5},0 ${cx + r + 15},0
        L${viewBoxWidth},0 L${viewBoxWidth},70 L0,70 Z`
}

export function MobileBottomNav({ links }: { links: NavLink[] }) {
    const pathname = usePathname()
    const viewBoxWidth = 375
    const activeIndex = links.findIndex((l) => pathname === l.href)
    const svgPath = getNotchPath(activeIndex, links.length, viewBoxWidth)

    return (
        <nav aria-label="Mobile Bottom Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40">
            <div className="relative w-full" style={{ height: '70px' }}>
                <svg
                    viewBox={`0 0 ${viewBoxWidth} 70`}
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d={svgPath} fill="#0e0e0e" />
                </svg>

                <div className="absolute inset-0 flex items-center">
                    {links.map((link) => {
                        const isActive = pathname === link.href
                        const IconComponent = link.icon
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex-1 flex flex-col items-center justify-center"
                                aria-label={link.label}
                            >
                                {isActive ? (
                                    <div className="flex flex-col items-center" style={{ transform: 'translateY(-14px)' }}>
                                        <div
                                            className="flex items-center justify-center rounded-full bg-[#55D6BE]"
                                            style={{ width: '52px', height: '52px' }}
                                        >
                                            <IconComponent size={24} strokeWidth={2.5} color="#000000" />
                                        </div>
                                        <span className="text-[10px] text-white tracking-wide mt-1">
                                            {link.label}
                                        </span>
                                    </div>
                                ) : (
                                    <IconComponent size={22} strokeWidth={2} color="#9BABB7" />
                                )}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}