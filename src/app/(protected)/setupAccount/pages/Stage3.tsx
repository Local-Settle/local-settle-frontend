'use client'

import { useState, useMemo, useRef, useId } from 'react'
import Image from 'next/image'
import preferencesIcon from '../../../../../public/preferences-icon.svg'
import arrow from '../../../../../public/down-arrow.svg'
import { Button } from '../components/Button'
import { SetupAccountPayload } from '../../../../features/user/models/setupAccount'
import { usePaymentProviders, PaymentProvider } from '../../../../features/paymentMethod/hooks/usePaymentProviders'
import { validateField, validateFields, trimFieldValues } from '../../../../features/paymentMethod/utils/paymentMethodValidation'

interface Stage3Props {
    onFinish: (data: Partial<SetupAccountPayload>) => void;
    isSubmitting?: boolean;
    submitError?: string | null;
}

type ProviderType = 'MOBILE' | 'PLATFORM' | 'BANK';

export default function Stage3({ onFinish, isSubmitting = false, submitError = null }: Stage3Props) {
    const { providers, loading, error } = usePaymentProviders();
    const listboxId = useId();

    const [selectedType, setSelectedType] = useState<ProviderType>('BANK');
    const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
    const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isProviderListOpen, setIsProviderListOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const filteredProviders = useMemo(() => {
        return providers.filter(p => p.type === selectedType);
    }, [providers, selectedType]);

    const resetFieldState = () => {
        setDynamicFields({});
        setFieldErrors({});
    };

    const handleTypeChange = (type: ProviderType) => {
        setSelectedType(type);
        setSelectedProvider(null);
        resetFieldState();
    };

    const handleProviderSelect = (provider: PaymentProvider) => {
        setSelectedProvider(provider);
        // A previous provider's values don't necessarily map to this one's
        // fields (e.g. switching from PayPal's email to a bank's IBAN), so we
        // start the dynamic section clean rather than carrying stale values.
        resetFieldState();
        setIsProviderListOpen(false);
        triggerRef.current?.focus();
    };

    const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsProviderListOpen(true);
        } else if (e.key === 'Escape') {
            setIsProviderListOpen(false);
        }
    };

    const handleOptionKeyDown = (e: React.KeyboardEvent<HTMLLIElement>, provider: PaymentProvider, index: number) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleProviderSelect(provider);
        } else if (e.key === 'Escape') {
            setIsProviderListOpen(false);
            triggerRef.current?.focus();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            document.getElementById(`${listboxId}-option-${index + 1}`)?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            document.getElementById(`${listboxId}-option-${index - 1}`)?.focus();
        }
    };

    const handleFieldChange = (field: string, value: string) => {
        setDynamicFields(prev => ({ ...prev, [field]: value }));

        if (!selectedProvider) return;
        const requirement = selectedProvider.metadata.ui_requirements.find(r => r.db_field === field);
        if (!requirement) return;

        const message = validateField(requirement, value);
        setFieldErrors(prev => {
            const next = { ...prev };
            if (message) next[field] = message;
            else delete next[field];
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProvider || isSubmitting) return;

        const trimmed = trimFieldValues(dynamicFields);
        const errors = validateFields(selectedProvider.metadata.ui_requirements, trimmed);

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        onFinish({
            providerId: selectedProvider.provider_id,
            accountIdentifier: trimmed['account_identifier'],
            identificationNumber: trimmed['identification_number'],
            beneficiaryName: trimmed['beneficiary_name'],
            description: trimmed['description']
        });
    }

    const hasBlockingErrors = Object.keys(fieldErrors).length > 0;
    const hasEmptyRequiredField = Boolean(
        selectedProvider?.metadata.ui_requirements.some(r => r.required && !dynamicFields[r.db_field]?.trim())
    );
    const canSubmit = Boolean(selectedProvider) && !hasEmptyRequiredField && !hasBlockingErrors && !isSubmitting;

    if (loading) {
        return (
            <div role="status" aria-live="polite" className="text-white text-center">
                Loading payment providers...
            </div>
        );
    }

    if (error) {
        return (
            <div role="alert" className="text-red-400 text-center max-w-150">
                We couldn&apos;t load payment providers right now. Please try again later.
            </div>
        );
    }

    if (providers.length === 0) {
        return (
            <div role="status" className="text-[#94A3B8] text-center max-w-150">
                No payment methods are currently available for your country. Please try again later.
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className='flex flex-col gap-8' noValidate>
            <div className="bg-[#0D1D2C] rounded-2xl p-6 flex flex-col gap-6 w-full max-w-150">
                <div className='flex flex-col items-end p-0 -m-3'>
                    <section className='flex w-[134.5px] items-center justify-center h-5.5 rounded-full bg-[#55D6BE1A] border border-[#55D6BE33]'>
                        <p className='font-bold text-[#55D6BE] uppercase text-[10px]'>Recommended for P2P</p>
                    </section>
                </div>

                <div className="flex flex-col items-start gap-2">
                    <div className='flex gap-3'>
                        <Image src={preferencesIcon} width={20} height={20} alt='' />
                        <p className="text-[#F1F5F9] font-bold text-[20px]">3. Optional P2P Setup</p>
                    </div>
                    <p className='text-[14px] text-[#94A3B8]'>Add your primary payment method to start peer-to-peer trading.</p>
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-[#CBD5E1] text-sm font-semibold px-1">Method Classification</p>
                    <div className="flex bg-[#08152180] p-1 rounded-xl border border-[#263949]" role="group" aria-label="Payment method category">
                        {(['BANK', 'PLATFORM', 'MOBILE'] as ProviderType[]).map((type) => (
                            <button
                                key={type}
                                type="button"
                                aria-pressed={selectedType === type}
                                onClick={() => handleTypeChange(type)}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                                    selectedType === type
                                    ? 'bg-[#55D6BE] text-[#0D1D2C]'
                                    : 'text-[#94A3B8] hover:text-white'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative">
                    <label id={`${listboxId}-label`} className="text-[#CBD5E1] text-sm font-semibold mb-2 px-1 block">
                        Select Provider
                    </label>
                    <button
                        type="button"
                        ref={triggerRef}
                        aria-haspopup="listbox"
                        aria-expanded={isProviderListOpen}
                        aria-labelledby={`${listboxId}-label`}
                        onClick={() => setIsProviderListOpen(!isProviderListOpen)}
                        onKeyDown={handleTriggerKeyDown}
                        className="relative w-full text-left bg-[#08152180] border border-[#263949] rounded-xl px-5 py-4 cursor-pointer"
                    >
                        <span className="text-[#F1F5F9] text-[16px]">
                            {selectedProvider ? selectedProvider.name : `Select a ${selectedType.toLowerCase()} provider...`}
                        </span>
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                            <Image src={arrow} width={24} height={24} alt="" className={isProviderListOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                        </div>
                    </button>
                    {isProviderListOpen && (
                        <ul
                            id={listboxId}
                            role="listbox"
                            aria-labelledby={`${listboxId}-label`}
                            className="absolute z-10 w-full mt-1 bg-[#1a1d27] rounded-xl overflow-y-auto border border-white/10 shadow-2xl max-h-[280px]"
                        >
                            {filteredProviders.length > 0 ? (
                                filteredProviders.map((p, index) => (
                                    <li
                                        key={p.provider_id}
                                        id={`${listboxId}-option-${index}`}
                                        role="option"
                                        aria-selected={selectedProvider?.provider_id === p.provider_id}
                                        tabIndex={0}
                                        onClick={() => handleProviderSelect(p)}
                                        onKeyDown={(e) => handleOptionKeyDown(e, p, index)}
                                        className={`px-5 py-3 text-[16px] cursor-pointer hover:bg-white/10 focus:bg-white/10 outline-none transition-colors ${selectedProvider?.provider_id === p.provider_id ? 'text-[#55D6BE]' : 'text-[#F1F5F9]'}`}
                                    >
                                        {p.name}
                                    </li>
                                ))
                            ) : (
                                <li className="px-5 py-3 text-[#94A3B8] text-sm italic text-center">No providers found for this category.</li>
                            )}
                        </ul>
                    )}
                </div>

                {selectedProvider && (
                    <div className="flex flex-col gap-5 animate-slide-down overflow-hidden origin-top">
                        {selectedProvider.metadata.ui_requirements.map((req) => {
                            const fieldId = `${listboxId}-field-${req.db_field}`;
                            const errorId = `${fieldId}-error`;
                            const fieldError = fieldErrors[req.db_field];

                            return (
                                <div key={req.db_field} className="flex flex-col gap-1">
                                    <label htmlFor={fieldId} className="text-[#CBD5E1] font-semibold text-sm">
                                        {req.label} {req.required && <span aria-hidden="true" className="text-red-500">*</span>}
                                        {req.required && <span className="sr-only"> (required)</span>}
                                    </label>
                                    <input
                                        id={fieldId}
                                        type={req.type}
                                        value={dynamicFields[req.db_field] || ''}
                                        onChange={(e) => handleFieldChange(req.db_field, e.target.value)}
                                        onBlur={(e) => handleFieldChange(req.db_field, e.target.value)}
                                        placeholder={req.placeholder}
                                        required={req.required}
                                        aria-required={req.required}
                                        aria-invalid={Boolean(fieldError)}
                                        aria-describedby={fieldError ? errorId : undefined}
                                        className={`bg-[#08152180] text-[#F1F5F9] text-[16px] rounded-xl px-4 py-3 outline-none border transition-all ${
                                            fieldError ? 'border-red-500' : 'border-[#263949] focus:border-[#55D6BE]'
                                        }`}
                                    />
                                    {fieldError && (
                                        <p id={errorId} role="alert" className="text-red-400 text-xs mt-1">
                                            {fieldError}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {submitError && (
                <p role="alert" className="text-red-400 text-sm text-center max-w-150">
                    {submitError}
                </p>
            )}

            <Button
                text={isSubmitting ? 'Saving...' : 'Complete setup'}
                disabled={!canSubmit}
            />

            <style jsx>{`
                @keyframes slide-down {
                    from { opacity: 0; transform: translateY(-20px); max-height: 0; }
                    to { opacity: 1; transform: translateY(0); max-height: 500px; }
                }
                .animate-slide-down {
                    animation: slide-down 0.4s ease-out forwards;
                }
            `}</style>
        </form>
    );
}
