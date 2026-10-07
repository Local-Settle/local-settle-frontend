type MetricCardProps = {
    icon: React.ReactNode;
    badge?: React.ReactNode;
    label: string;
    value: React.ReactNode;
    unit: string;
};

export function MetricCard({ icon, badge, label, value, unit }: MetricCardProps) {
    return (
        <div className="bg-[#1A1A1A99] border border-[#FFFFFF0D] rounded-xl p-5 flex flex-col justify-between w-full h-full min-h-[163px]">
            <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#55D6BE]">
                    {icon}
                </div>
                {badge}
            </div>
            <div className="mt-4">
                <p className="text-sm text-[#C0CAAD] mb-1">{label}</p>
                <p className="text-2xl font-semibold text-white leading-none">
                    {value}{" "}
                    {unit && <span className="text-xs font-normal text-[#C0CAAD66] ml-1">{unit}</span>}
                </p>
            </div>
        </div>
    );
}