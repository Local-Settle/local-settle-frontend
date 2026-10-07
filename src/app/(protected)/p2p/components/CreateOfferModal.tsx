'use client';

import Image from 'next/image'
import { FormEvent, useState } from 'react';
import usdcIcon from '../../../../../public/usdc.png';
import { CloseModalProps } from '@/app/utils/closeModalProps';
import { useOffers } from '@/features/offer/hooks/useOffers';
import { useUser } from '@/features/user/presentation/context/UserContext';
import { useWallet, useWalletBalance } from '@/features/wallet';
import { getRovingFocusIndex } from '@/utils/keyboardNavigation';

const offerTypeTabs = ["Buy", "Sell"] as const;

export function CreateOfferModal({ onClose }: CloseModalProps) {
    const { currentUser } = useUser();
    const { publicKey } = useWallet();
    const { balances } = useWalletBalance(publicKey);

    // USDC asset only
    const usdcAsset = { label: 'USD Coin', value: 'USDC', icon: usdcIcon };
    const [tab, setTab] = useState("Buy");
    const [form, setForm] = useState({
        price: '',
        minAmount: '',
        maxAmount: '',
    });

    // Obtener balance de USDC del usuario
    const usdcAssetBalance = balances?.find(
        (b) => b.asset_code === 'USDC'
    );
    const usdcBalance = usdcAssetBalance
        ? parseFloat(usdcAssetBalance.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0.00';
    const { createOffer } = useOffers();

    const [checked, setChecked] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        const nextIndex = getRovingFocusIndex(event.key, index, offerTypeTabs.length, "horizontal");
        if (nextIndex === null) return;

        event.preventDefault();
        const nextTab = offerTypeTabs[nextIndex];
        setTab(nextTab);
        document.getElementById(`create-offer-tab-${nextTab.toLowerCase()}`)?.focus();
    };
    const toggle = (id: string) => {
        setChecked(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!currentUser || currentUser.kycStatus !== "approved") {
            alert("KYC verification required to publish offers.");
            return;
        }

        setIsSubmitting(true);
        try {
            const newOffer = await createOffer({
                ...form,
                creatorId: currentUser.userId,
                type: tab.toLowerCase(),
                assetCode: usdcAsset.value,
                paymentMethodIds: checked.map(String),
            });
            if (newOffer) {
                window.location.reload();
            } else {
                setIsSubmitting(false);
            }
        } catch (err: unknown) {
            alert(`Failed to create offer: ${err instanceof Error ? err.message : String(err)}`);
            setIsSubmitting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 bg-[black/60] backdrop-blur-sm z-40 flex items-center justify-end"
            onClick={() => { if (!isSubmitting) onClose(); }}
        >
            <div
                className="bg-[#081521F2] h-full w-md p-8 border-r border-white/10 relative overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Premium Loading Overlay */}
                {isSubmitting && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#081521]/80 backdrop-blur-md">
                        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
                            <div className="absolute w-full h-full border-4 border-[#55D6BE]/10 rounded-full"></div>
                            <div className="absolute w-full h-full border-4 border-[#55D6BE] rounded-full border-t-transparent animate-spin drop-shadow-[0_0_15px_rgba(85,214,190,0.5)]"></div>
                            <div className="absolute w-16 h-16 border-4 border-[#55D6BE]/20 rounded-full border-b-transparent animate-[spin_1.5s_linear_infinite_reverse]"></div>
                        </div>
                        <h3 className="text-[#55D6BE] font-semibold text-xl tracking-wide animate-pulse mb-2">Creating Offer...</h3>
                        <p className="text-gray-400 text-sm text-center max-w-[280px] px-4 leading-relaxed">
                            Please wait while we process your request and secure your offer details in the blockchain.
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white text-lg font-semibold">Create New Offer</h2>
                    <button
                        onClick={() => onClose()}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="w-full h-px mb-6" style={{ background: 'linear-gradient(to right, #55D6BE00, #55D6BE, #55D6BE00)' }} />

                <div className="w-99.75 h-12">
                    <form onSubmit={handleSubmit}>
                        <div>
                            <p className="text-[#64748B]">Offer type</p>
                            <div className="flex flex-col h-full items-center justify-center mb-6">
                                <div
                                    role="tablist"
                                    aria-label="Offer type"
                                    className="grid grid-cols-2 bg-[#08152180] w-full rounded-lg p-1"
                                >
                                    {offerTypeTabs.map((t, index) => (
                                        <button
                                            key={t}
                                            id={`create-offer-tab-${t.toLowerCase()}`}
                                            type='button'
                                            role="tab"
                                            aria-selected={tab === t}
                                            aria-controls="create-offer-details-panel"
                                            tabIndex={tab === t ? 0 : -1}
                                            onClick={() => setTab(t)}
                                            onKeyDown={(event) => handleTabKeyDown(event, index)}
                                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55D6BE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#081521]
                                    ${tab === t
                                                    ? "bg-[#55D6BE] text-[#081521]"
                                                    : "text-[#94A3B8] hover:text-white"
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div
                            id="create-offer-details-panel"
                            role="tabpanel"
                            aria-labelledby={`create-offer-tab-${tab.toLowerCase()}`}
                            className="mt-3"
                        >
                            <p className="text-[#CBD5E1]">Crypto Asset</p>
                            <div className="flex items-center gap-4 bg-[#081521] border border-[#11212E] rounded-xl px-5 py-4 select-none">
                                <Image src={usdcAsset.icon} width={32} height={32} alt="USDC icon" />
                                <div className="flex flex-col">
                                    <span className="text-[#F1F5F9] text-[16px] font-bold">{usdcAsset.label} (USDC)</span>
                                    <span className="text-[#94A3B8] text-xs">Available: <span className="text-[#55D6BE] font-bold">{usdcBalance}</span> USDC</span>
                                </div>
                            </div>
                            <p className="text-[#64748B] text-[11px] mt-2 leading-relaxed">
                                Currently our system only supports fund locking of USDC. Please swap your assets if required.
                            </p>
                        </div>
                        <div className='mt-3'>
                            <p className="text-[#CBD5E1]">Price per Unit</p>
                            <div className="relative mt-3">
                                <input
                                    type="number"
                                    name='price'
                                    value={form.price}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    min={0}
                                    step="0.0001"
                                    onKeyDown={(e) => ["-", "e", "E"].includes(e.key) && e.preventDefault()}
                                    className="bg-[#081521] w-full border border-[#11212E] rounded-xl px-5 
                                        py-4 text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none 
                                        focus:ring-2 focus:ring-[#55D6BE] [appearance:textfield]
                                        [&::-webkit-outer-spin-button]:appearance-none
                                        [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                                    <span className="text-[14px] text-[#94A3B8] font-bold select-none">
                                        USD
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className='grid grid-cols-2 gap-3 mt-3'>
                            <div>
                                <p className="text-[#CBD5E1]">Min Amount</p>
                                <div className="relative mt-3">
                                    <input
                                        type="number"
                                        name='minAmount'
                                        value={form.minAmount}
                                        onChange={handleChange}
                                        placeholder="Min"
                                        min={0}
                                        onKeyDown={(e) => ["-", "e", "E"].includes(e.key) && e.preventDefault()}
                                        className="bg-[#081521] w-full border border-[#11212E] rounded-xl px-5 
                                            py-4 text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none 
                                            focus:ring-2 focus:ring-[#55D6BE] [appearance:textfield]
                                            [&::-webkit-outer-spin-button]:appearance-none
                                            [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <p className="text-[#CBD5E1]">Max Amount</p>
                                <div className="relative mt-3">
                                    <input
                                        type="number"
                                        name='maxAmount'
                                        value={form.maxAmount}
                                        onChange={handleChange}
                                        placeholder="Max"
                                        min={0}
                                        onKeyDown={(e) => ["-", "e", "E"].includes(e.key) && e.preventDefault()}
                                        className="bg-[#081521] w-full border border-[#11212E] rounded-xl px-5 
                                            py-4 text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none 
                                            focus:ring-2 focus:ring-[#55D6BE] [appearance:textfield]
                                            [&::-webkit-outer-spin-button]:appearance-none
                                            [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className='mt-3'>
                            <p className="text-[#CBD5E1]">Payment Methods</p>
                            <div className="flex flex-col gap-4">
                                {/* Legacy payment methods */}
                                {currentUser?.paymentMethods?.map((pm) => {
                                    const id = String(pm.paymentId ?? pm.payment_id ?? pm.id ?? "");
                                    const name = pm.payment_provider?.name || pm.paymentProvider?.name || pm.bankName || pm.type || "Payment Method";
                                    const identifier = pm.accountIdentifier || pm.account_identifier || pm.accountDetails || "";
                                    const owner = pm.beneficiaryName || pm.beneficiary_name || "";
                                    
                                    return (
                                        <div
                                            key={id}
                                            className={`flex w-99.75 h-17.5 border rounded-xl items-center gap-3 cursor-pointer
                                                    ${checked.includes(id) ? 'border-[#55D6BE66]' : 'border-[#11212E]'}`}
                                            onClick={() => toggle(id as unknown as string)}
                                        >
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors m-3
                                                    ${checked.includes(id) ? 'bg-[#55D6BE] border-[#55D6BE]' : 'bg-transparent border-gray-600'}`}
                                            >
                                                {checked.includes(id) && (
                                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className='flex flex-col'>
                                                <span className="text-[#F1F5F9] text-sm select-none">{name}</span>
                                                <span className="text-[#94A3B8] text-xs select-none">
                                                    {identifier}{owner ? ` - ${owner}` : ''}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* New payment_method (v2) */}
                                {currentUser?.payment_method?.map((pm) => {
                                    const id = String(pm.payment_id ?? pm.paymentId ?? pm.id ?? "");
                                    const name = pm.payment_provider?.name || pm.paymentProvider?.name || pm.type || "Payment Method";
                                    const identifier = pm.account_identifier || pm.accountIdentifier || pm.accountDetails || "";
                                    const owner = pm.beneficiary_name || pm.beneficiaryName || "";
                                    
                                    return (
                                        <div
                                            key={id}
                                            className={`flex w-99.75 h-17.5 border rounded-xl items-center gap-3 cursor-pointer
                                                    ${checked.includes(id) ? 'border-[#55D6BE66]' : 'border-[#11212E]'}`}
                                            onClick={() => toggle(id as unknown as string)}
                                        >
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors m-3
                                                    ${checked.includes(id) ? 'bg-[#55D6BE] border-[#55D6BE]' : 'bg-transparent border-gray-600'}`}
                                            >
                                                {checked.includes(id) && (
                                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className='flex flex-col'>
                                                <span className="text-[#F1F5F9] text-sm select-none">{name}</span>
                                                <span className="text-[#94A3B8] text-xs select-none">
                                                    {identifier}{owner ? ` - ${owner}` : ''}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {(!currentUser?.paymentMethods?.length && !currentUser?.payment_method?.length) && (
                                    <p className="text-[#94A3B8] text-sm italic">No payment methods found. Add one in settings.</p>
                                )}
                            </div>
                        </div>
                        <div className="flex w-full items-center justify-center gap-3 mt-10">
                            <button
                                type='submit'
                                disabled={isSubmitting}
                                className={`flex-1 font-semibold px-4 py-3 rounded-xl transition-all duration-300
                                    ${isSubmitting 
                                        ? 'bg-[#55D6BE]/50 text-black/50 cursor-not-allowed' 
                                        : 'bg-[#55D6BE] text-black hover:bg-[#38B99F] hover:shadow-[0_0_15px_rgba(85,214,190,0.3)]'
                                    }`}
                            >
                                {isSubmitting ? 'Processing...' : 'Publish Offer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
