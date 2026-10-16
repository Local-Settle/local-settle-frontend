import type {
    SecurityPreferences,
    UserSession,
} from "../types/security-settings.types";

function getApiBaseUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
}

const DEFAULT_PREFERENCES: SecurityPreferences = {
    securityUpdates: true,
    loginAlerts: true,
    transactionNotifications: true,
    escrowStatusUpdates: true,
    emailNotifications: false,
};

export const securitySettingsService = {
    async getSecuritySettings(accessToken?: string | null): Promise<SecurityPreferences> {
        try {
            const headers: Record<string, string> = {};
            if (accessToken) {
                headers["Authorization"] = `Bearer ${accessToken}`;
            }

            const res = await fetch(`${getApiBaseUrl()}/users/me/security-settings`, {
                method: "GET",
                headers,
            });

            if (!res.ok) {
                // If endpoint doesn't exist yet or fails, fallback to defaults/stored prefs
                return DEFAULT_PREFERENCES;
            }

            const data = (await res.json()) as Partial<SecurityPreferences>;
            return {
                ...DEFAULT_PREFERENCES,
                ...data,
            };
        } catch {
            return DEFAULT_PREFERENCES;
        }
    },

    async updateSecuritySettings(
        updates: Partial<SecurityPreferences>,
        accessToken?: string | null,
    ): Promise<SecurityPreferences> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const res = await fetch(`${getApiBaseUrl()}/users/me/security-settings`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(updates),
        });

        if (!res.ok) {
            // If backend is not available or mock environment, simulate update
            if (res.status === 404 || res.status === 501) {
                return {
                    ...DEFAULT_PREFERENCES,
                    ...updates,
                };
            }
            const errorText = await res.text().catch(() => "Failed to update security preferences");
            throw new Error(errorText || "Failed to update security preferences");
        }

        const data = (await res.json()) as Partial<SecurityPreferences>;
        return {
            ...DEFAULT_PREFERENCES,
            ...data,
        };
    },

    async getRecentSessions(accessToken?: string | null): Promise<UserSession[]> {
        const headers: Record<string, string> = {};
        if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const res = await fetch(`${getApiBaseUrl()}/users/me/sessions`, {
            method: "GET",
            headers,
        });

        if (!res.ok) {
            throw new Error(`Unable to load recent sessions (${res.status}).`);
        }

        const data: unknown = await res.json();
        if (!Array.isArray(data)) {
            throw new Error("The recent sessions response was invalid.");
        }
        return data as UserSession[];
    },

    async revokeRecentSession(sessionId: string, accessToken?: string | null): Promise<void> {
        if (!sessionId.trim()) {
            throw new Error("A session ID is required.");
        }

        const headers: Record<string, string> = {};
        if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const res = await fetch(
            `${getApiBaseUrl()}/users/me/sessions/${encodeURIComponent(sessionId)}`,
            { method: "DELETE", headers },
        );
        if (!res.ok) {
            throw new Error(`Unable to revoke this session (${res.status}).`);
        }
    },
};
