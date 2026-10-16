'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from './components/Header'
import { Line } from './components/Line'
import { ProgressBar } from './components/ProgressBar'
import Stage1 from './pages/Stage1'
import Stage2 from './pages/Stage2'
import Stage3 from './pages/Stage3'
import { useUsers } from '../../../features/user/hooks/useUsers'
import { useUser } from '../../../features/user/presentation/context/UserContext'
import { SetupAccountPayload } from '../../../features/user/models/setupAccount'

const ONBOARDING_PROGRESS_KEY = 'local-settle:onboarding-progress'

type OnboardingProgress = {
    stage: 1 | 2 | 3;
    formData: Pick<SetupAccountPayload, 'alias' | 'email' | 'notificationsEnabled' | 'preferredCurrency'>;
}

function clearOnboardingProgress() {
    try {
        window.localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
    } catch {
        // Storage may be disabled; onboarding remains usable for this session.
    }
}

export default function SetupAccount() {
    const [stage, setStage] = useState<1 | 2 | 3>(1);
    const [formData, setFormData] = useState<SetupAccountPayload>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { setupAccount, setupError, clearSetupError } = useUsers();
    const { currentUser, setCurrentUser } = useUser();
    const router = useRouter();

    // Restore only non-sensitive profile/preferences fields. Bank identifiers
    // and other account details are deliberately never written to browser storage.
    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(ONBOARDING_PROGRESS_KEY);
            if (!saved) return;
            const progress = JSON.parse(saved) as Partial<OnboardingProgress>;
            if (progress.stage === 2 || progress.stage === 3) setStage(progress.stage);
            if (progress.formData && typeof progress.formData === 'object') {
                setFormData({
                    alias: progress.formData.alias,
                    email: progress.formData.email,
                    notificationsEnabled: progress.formData.notificationsEnabled,
                    preferredCurrency: progress.formData.preferredCurrency,
                });
            }
        } catch {
            clearOnboardingProgress();
        }
    }, []);

    const handleNext = (data: Partial<SetupAccountPayload>) => {
        const nextData = { ...formData, ...data };
        const nextStage = Math.min(stage + 1, 3) as 1 | 2 | 3;
        setFormData(nextData);
        setStage(nextStage);
        try {
            window.localStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify({
                stage: nextStage,
                formData: {
                    alias: nextData.alias,
                    email: nextData.email,
                    notificationsEnabled: nextData.notificationsEnabled,
                    preferredCurrency: nextData.preferredCurrency,
                },
            } satisfies OnboardingProgress));
        } catch {
            // Keep the current session usable if storage is unavailable.
        }
    };

    const handleFinish = async (data: Partial<SetupAccountPayload>) => {
        if (!currentUser || isSubmitting) return;

        const finalData = { ...formData, ...data };
        setIsSubmitting(true);
        clearSetupError();
        try {
            const updated = await setupAccount(currentUser.userId, finalData);
            if (updated) {
                setCurrentUser(updated);
                clearOnboardingProgress();
                router.push('/dashboard');
            }
            // On failure, `setupError` is now populated by useUsers and Stage3
            // keeps the entered values so the user can retry without re-typing.
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = async () => {
        if (currentUser) {
            const updated = await setupAccount(currentUser.userId, { ...({ pendingAccountInfo: false } as Record<string, unknown>) });
            if (updated) {
                setCurrentUser(updated);
                clearOnboardingProgress();
                router.push('/dashboard');
            }
        }
    };

    return (
        <div className="relative flex flex-col justify-start items-center min-h-screen w-full overflow-y-auto overflow-x-hidden [@media(min-height:900px)]:pb-[72px] [@media(min-height:900px)]:pt-[72px]">
            <div className="absolute top-0 [@media(min-height:900px)]:top-[72px] left-0 w-full">
                <Line />
            </div>
            <div className="w-full max-w-content flex flex-col items-center mt-[20px] mb-8 z-10">
                <div className="flex flex-col gap-6 w-full items-center">
                    <ProgressBar stage={stage} />
                    <Header />
                    <p className="w-full max-w-150 text-center text-sm text-[#94A3B8]">
                        LocalSettle is using Stellar {process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'Testnet'}. You will approve any transaction in your wallet; never enter a seed phrase or private key here. Your setup progress can be resumed later.
                    </p>
                    {stage === 1 && <Stage1 onNext={handleNext} />}
                    {stage === 2 && <Stage2 onNext={handleNext} />}
                    {stage === 3 && (
                        <Stage3
                            onFinish={handleFinish}
                            isSubmitting={isSubmitting}
                            submitError={setupError}
                        />
                    )}
                    
                    <button 
                        onClick={handleSkip}
                        className="text-[#94A3B8] text-sm hover:text-[#F1F5F9] transition-colors mt-2"
                    >
                        Skip for now, I&apos;ll do this later
                    </button>
                </div>
            </div>
            
            <div className="absolute bottom-0 [@media(min-height:900px)]:bottom-[72px] left-0 w-full">
                <Line />
            </div>
        </div>
    );
}
