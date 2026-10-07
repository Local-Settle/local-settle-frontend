export function ProgressBar({ stage }: { stage: number }) {
    return (
        <div className="flex gap-2 mb-2 w-150">
            {[1, 2, 3].map((step) => (
                <div
                    key={step}
                    className={`h-[3px] flex-1 ${
                        step <= stage ? 'bg-[#55D6BE]' : 'bg-[#2A2D35]'
                    }`}
                />
            ))}
        </div>
    );
}
