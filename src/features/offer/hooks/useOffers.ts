import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Offer } from "../models/offer";
import { CreateOffer } from "../models/createOffer";
import { UpdateOffer } from "../models/updateOffer";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useOffers(filters?: Record<string, string>) {
    const queryClient = useQueryClient();

    const [manualFilters, setManualFilters] = useState<Record<string, string> | null>(null);
    const activeFilters = manualFilters ?? filters;

    const { data: offers = [], isLoading, isError, error, refetch, isFetching } = useQuery<Offer[]>({
        queryKey: queryKeys.offers.list(activeFilters),
        queryFn: ({ signal }) => {
            let endpoint = '/offers';
            if (activeFilters) {
                const params = new URLSearchParams(activeFilters);
                const queryString = params.toString();
                if (queryString) {
                    endpoint += `?${queryString}`;
                }
            }
            return apiFetch<Offer[]>(endpoint, { signal });
        },
    });

    const fetchOffers = useCallback(async (currentFilters?: Record<string, string>) => {
        if (currentFilters) {
            setManualFilters(currentFilters);
        } else {
            queryClient.invalidateQueries({ queryKey: queryKeys.offers.list(activeFilters) });
        }
    }, [queryClient, activeFilters]);

    const getOffer = async (offerId: string) => {
        return await queryClient.fetchQuery({
            queryKey: queryKeys.offers.detail(offerId),
            queryFn: () => apiFetch<Offer>(`/offers/${offerId}`)
        });
    };

    const { mutateAsync: createOffer } = useMutation({
        mutationFn: (newOffer: CreateOffer) => apiFetch<Offer>('/offers', {
            method: "POST",
            body: newOffer
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
        }
    });

    const { mutateAsync: updateOffer } = useMutation({
        mutationFn: ({ offerId, update }: { offerId: string, update: UpdateOffer }) => apiFetch<Offer>(`/offers/${offerId}`, {
            method: "PATCH",
            body: update
        }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.offers.detail(variables.offerId) });
        }
    });

    const { mutateAsync: deleteOffer } = useMutation({
        mutationFn: (offerId: string) => apiFetch<void>(`/offers/${offerId}`, {
            method: "DELETE"
        }),
        onSuccess: (_, offerId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.offers.detail(offerId) });
        }
    });

    const wrappedUpdateOffer = (offerId: string, update: UpdateOffer) => updateOffer({ offerId, update });
    const wrappedDeleteOffer = (offerId: string) => deleteOffer(offerId);

    return { 
        offers, 
        offer: null, 
        fetchOffers, 
        getOffer, 
        createOffer, 
        updateOffer: wrappedUpdateOffer, 
        deleteOffer: wrappedDeleteOffer, 
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    };
}
