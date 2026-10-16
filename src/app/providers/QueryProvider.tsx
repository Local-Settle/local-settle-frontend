"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useLayoutEffect, useState } from "react";
import { useUser } from "@/features/user/presentation/context/UserContext";

function ScopedQueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30 * 1000,
                gcTime: 5 * 60 * 1000,
                refetchOnWindowFocus: true,
                retry: 1,
            },
        },
    }));

    useLayoutEffect(() => () => queryClient.clear(), [queryClient]);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const { accessToken } = useUser();

    // Keep the entire cache scoped to one authenticated session. This also
    // clears public query data on identity changes, so public data is refetched
    // rather than carried across accounts.
    return <ScopedQueryProvider key={accessToken ?? "anonymous"}>{children}</ScopedQueryProvider>;
}
