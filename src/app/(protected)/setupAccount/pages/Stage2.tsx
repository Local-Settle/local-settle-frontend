'use client'

import { useState } from 'react'
import Image from 'next/image'
import preferencesIcon from '../../../../../public/preferences-icon.svg'
import arrow from '../../../../../public/down-arrow.svg'
import currencies from '../secondStage/utils/currencies'
import { Button } from '../components/Button'
import { SetupAccountPayload } from '../../../../features/user/models/setupAccount'

interface Stage2Props {
    onNext: (data: Partial<SetupAccountPayload>) => void;
}

export default function Stage2({ onNext }: Stage2Props) {
    const [notifications] = useState(true);
    const [currency, setCurrency] = useState(currencies[0]);
    const [open, setOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext({ 
            notificationsEnabled: notifications, 
            preferredCurrency: currency 
        });
    }

    return (
        <form onSubmit={handleSubmit} className='flex flex-col gap-8'>
            <div className="bg-[#0D1D2C] rounded-2xl p-6 flex flex-col gap-6 w-150">
                <div className="flex items-center gap-2">
                    <Image
                        src={preferencesIcon}
                        width={20}
                        height={20}
                        alt='icono de preferences'
                    />
                    <p className="text-[#F1F5F9] font-bold text-[20px]">2. Preferences</p>
                </div>
                {/*
                <div className="bg-[#0815214D] border border-[#263949] rounded-xl px-5 py-4 mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-[#F1F5F9] text-[16px] font-semibold">Enable Notifications</p>
                        <p className="text-[#64748B] text-xs mt-0.5">Real-time trade alerts</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setNotifications(!notifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${notifications ? 'bg-[#55D6BE]' : 'bg-gray-600'}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${notifications ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
                </div>
                */}
                <div className="relative">
                    <p className="text-[#CBD5E1] text-sm font-semibold mb-2 px-1">Display Currency</p>
                    <div
                        className="relative bg-[#08152180] border border-[#263949] rounded-xl px-5 py-4 cursor-pointer"
                        onClick={() => setOpen(!open)}
                    >
                        <span className="text-[#F1F5F9] text-[16px]">{currency}</span>
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <Image src={arrow} width={24} height={24} alt="flecha del select" />
                        </div>
                    </div>
                    {open && (
                        <div className="absolute z-10 w-full mt-1 bg-[#1a1d27] rounded-xl overflow-hidden border border-white/10">
                            {currencies.map((c) => (
                                <div
                                    key={c}
                                    onClick={() => { setCurrency(c); setOpen(false); }}
                                    className={`px-5 py-3 text-[16px] cursor-pointer hover:bg-white/10 transition-colors ${currency === c ? 'text-[#55D6BE]' : 'text-[#F1F5F9]'}`}
                                >
                                    {c}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Button text='Next Step' />
        </form>
    );
}
