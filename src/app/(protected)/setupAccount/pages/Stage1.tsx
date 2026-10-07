'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import userIcon from '../../../../../public/user-icon-selected.svg'
import { Button } from '../components/Button'
import { useUsers } from '../../../../features/user/hooks/useUsers'
import { SetupAccountPayload } from '../../../../features/user/models/setupAccount'

interface Stage1Props {
    onNext: (data: Partial<SetupAccountPayload>) => void;
}

export default function Stage1({ onNext }: Stage1Props) {
    const [alias, setAlias] = useState('');
    const [email, setEmail] = useState('');
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const { checkAliasAvailable } = useUsers();

    useEffect(() => {
        if (!alias) return;

        const timer = setTimeout(async () => {
            const { available } = await checkAliasAvailable(alias);
            setIsAvailable(available);
        }, 500);

        return () => clearTimeout(timer);
    }, [alias, checkAliasAvailable]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext({ alias, email });
    }

    return (
        <form onSubmit={handleSubmit} className='flex flex-col gap-8'>
            <div className="bg-[#0D1D2C] rounded-2xl p-6 flex flex-col gap-6 w-150">
                <div className="flex items-center gap-2">
                    <Image
                        src={userIcon}
                        width={20}
                        height={20}
                        alt='icono de profile details'
                    />
                    <p className="text-[#F1F5F9] font-bold text-[20px]">1. Profile Details</p>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                        <label className="text-[#CBD5E1] font-semibold text-sm">Username</label>
                        {isAvailable !== null && alias && (
                            <span className={`text-xs font-medium ${isAvailable ? 'text-[#55D6BE]' : 'text-red-400'}`}>
                                {isAvailable ? '✓ Available' : '✗ Already taken'}
                            </span>
                        )}
                    </div>
                    <input
                        type="text"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        placeholder="e.g. Satoshi_Master"
                        className={`bg-[#08152180] text-[#F1F5F9] text-[16px] rounded-xl px-4 py-3 outline-none border transition-colors ${
                            isAvailable === false ? 'border-red-400' : 'border-[#263949] focus:border-[#55D6BE]'
                        }`}
                        required
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-[#CBD5E1] font-semibold text-sm">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@localsettle.example"
                        className="bg-[#08152180] text-[#F1F5F9] text-[16px] rounded-xl px-4 py-3 outline-none border border-[#263949] focus:border-[#55D6BE]"
                        required
                    />
                </div>
            </div>
            <Button text='Next Step' />
        </form>
    );
}
