import { WaitListTimeLine } from "../models/timeLine";
import {
    AreaChart,
    Area,
    XAxis,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

type TimeWindow = "7d" | "2s" | "1m" | "all";

type WaitlistGrowthProps = {
    timeLine: WaitListTimeLine[];
    activeWindow: TimeWindow;
    onWindowChange: (w: TimeWindow) => void;
}

const windows: { key: TimeWindow; label: string }[] = [
    { key: "7d", label: "7D" },
    { key: "2s", label: "2S" },
    { key: "1m", label: "1M" },
    { key: "all", label: "ALL" },
];

export function WaitlistGrowth({ timeLine, activeWindow, onWindowChange }: WaitlistGrowthProps) {
    return (
        <div className="relative w-full h-full min-h-[300px]">
            <div className="absolute -top-10 right-0 flex gap-1.5 z-10">
                {windows.map((w) => (
                    <button
                        key={w.key}
                        onClick={() => onWindowChange(w.key)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                            activeWindow === w.key
                                ? "bg-[#55D6BE] text-[#081521]"
                                : "bg-[#2A2A2A] text-[#9ca3af] hover:bg-[#3A3A3A] hover:text-white"
                        }`}
                    >
                        {w.label}
                    </button>
                ))}
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeLine} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#55D6BE" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#55D6BE" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        vertical={true}
                        horizontal={false}
                        stroke="#ffffff"
                        strokeOpacity={0.06}
                    />

                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6b7280", fontSize: 10 }}
                        interval="preserveStartEnd"
                        minTickGap={20}
                    />

                    <Tooltip
                        contentStyle={{
                            background: "#111111",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                        labelStyle={{ color: "#9ca3af" }}
                        itemStyle={{ color: "#55D6BE" }}
                    />

                    <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#55D6BE"
                        strokeWidth={2}
                        fill="url(#lineGlow)"
                        dot={{ r: 4, fill: "#55D6BE", strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}