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
    const firstCount = timeLine[0]?.count;
    const lastCount = timeLine.at(-1)?.count;
    const change = firstCount !== undefined && lastCount !== undefined
        ? lastCount - firstCount
        : undefined;
    const trendSummary = timeLine.length === 0
        ? "No waitlist growth data is available for this period."
        : `Waitlist count ${change === undefined ? "is shown" : `${change >= 0 ? "increased" : "decreased"} by ${Math.abs(change)}`} across ${timeLine.length} recorded periods; latest count is ${lastCount}.`;

    return (
        <div className="relative w-full h-full min-h-[300px]">
            <h3 className="sr-only">Waitlist growth</h3>
            <p className="sr-only" id="waitlist-growth-summary">{trendSummary}</p>
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
            <div role="img" aria-label={`Waitlist growth chart. ${trendSummary}`}>
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
            <details className="mt-3 text-sm text-[#E3E2E2]">
                <summary className="w-fit cursor-pointer rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#55D6BE]">
                    View waitlist growth data
                </summary>
                <div className="mt-2 max-h-48 overflow-auto rounded border border-[#FFFFFF1A]">
                    <table className="w-full text-left">
                        <caption className="sr-only">Waitlist counts by recorded period</caption>
                        <thead className="sticky top-0 bg-[#1A1A1A]">
                            <tr>
                                <th scope="col" className="px-3 py-2">Date</th>
                                <th scope="col" className="px-3 py-2">Waitlist count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {timeLine.length === 0 ? (
                                <tr><td colSpan={2} className="px-3 py-2">No data available</td></tr>
                            ) : timeLine.map((point, index) => (
                                <tr key={`${point.date}-${index}`} className="border-t border-[#FFFFFF1A]">
                                    <th scope="row" className="px-3 py-2 font-normal">{point.date}</th>
                                    <td className="px-3 py-2">{point.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
}
