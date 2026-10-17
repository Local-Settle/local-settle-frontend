import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Stats } from "../models/stats";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export type TimeWindow = "7d" | "2s" | "1m" | "all";

function isValidDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value)
        && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
        && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

export function useStats() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawWindow = searchParams.get("window") || "7d";
    const timeWindow = (["7d", "2s", "1m", "all"] as string[]).includes(rawWindow) ? rawWindow : "7d";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const customRange = isValidDate(from) && isValidDate(to) && from <= to;

    const { data: stats = null, isLoading } = useQuery<Stats | null>({
        queryKey: queryKeys.stats.window(customRange ? `${from}:${to}` : timeWindow),
        queryFn: () => {
            const params = new URLSearchParams();
            if (customRange) {
                params.set("from", `${from}T00:00:00.000Z`);
                params.set("to", `${to}T23:59:59.999Z`);
            } else if (timeWindow !== "7d") {
                params.set("window", timeWindow);
            }
            const query = params.toString();
            return apiFetch<Stats>(`/stats${query ? `?${query}` : ""}`);
        }
    });

    const getStats = useCallback(async (window?: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("from");
        params.delete("to");
        if (window && window !== "7d") params.set("window", window);
        else params.delete("window");
        const query = params.toString();
        router.replace(query ? `?${query}` : "?", { scroll: false });
    }, [router, searchParams]);

    const setDateRange = useCallback((nextFrom: string, nextTo: string) => {
        if (nextFrom && nextTo && (!isValidDate(nextFrom) || !isValidDate(nextTo) || nextFrom > nextTo)) return;
        const params = new URLSearchParams(searchParams.toString());
        params.delete("window");
        if (nextFrom) params.set("from", nextFrom); else params.delete("from");
        if (nextTo) params.set("to", nextTo); else params.delete("to");
        const query = params.toString();
        router.replace(query ? `?${query}` : "?", { scroll: false });
    }, [router, searchParams]);

    return { stats, getStats, isLoading, from: isValidDate(from) ? from : "", to: isValidDate(to) ? to : "", setDateRange, timeWindow: timeWindow as TimeWindow };
}
