"use client";

import { useCallback, useState } from "react";
import { useUser } from "@/features/user/presentation/context/UserContext";
import { useUsers } from "@/features/user/hooks/useUsers";
import { useNotifications } from "@/features/notifications";
import type { SecurityPreferences } from "../types/security-settings.types";

export function useSecuritySettings() {
    const { currentUser } = useUser();
    const { updateUser } = useUsers();
    const { notify } = useNotifications();
    const [updatingKeys, setUpdatingKeys] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);

    const preferences: SecurityPreferences = {
        securityUpdates: currentUser?.securityUpdates ?? true,
        emailNotifications: currentUser?.notificationsEnabled ?? true,
        // The account API currently persists only these two preferences.
        loginAlerts: true,
        transactionNotifications: true,
        escrowStatusUpdates: true,
    };

    const updatePreference = useCallback(async (key: keyof SecurityPreferences, value: boolean) => {
        if (!currentUser?.userId || preferences[key] === value) return;
        const previousValue = preferences[key];
        setError(null);
        setUpdatingKeys((prev) => ({ ...prev, [key]: true }));
        try {
            const accountField = key === "emailNotifications" ? "notificationsEnabled" : key;
            const updated = await updateUser(currentUser.userId, { [accountField]: value });
            if (!updated) throw new Error("Could not save this preference. Please try again.");
            notify("success", "Preference updated.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save this preference.");
            notify("error", "Preference was not saved. Your previous setting is unchanged.");
            // The user context remains the source of truth, so a failed save rolls back automatically.
            void previousValue;
        } finally {
            setUpdatingKeys((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    }, [currentUser, preferences, updateUser, notify]);

    return { preferences, isLoading: !currentUser, error, updatingKeys, updatePreference, reload: () => undefined };
}
