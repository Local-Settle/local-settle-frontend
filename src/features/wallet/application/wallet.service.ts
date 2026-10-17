import { stellarWalletKitService } from "./stellar-wallet-kit.service";
import { ApiError, apiFetch } from "@/lib/api";

// Última wallet usada
const WALLET_ID_KEY = "wallet:provider";
const PUBLICKEY_KEY = "wallet:publicKey";

interface ChallengeResponse {
    challenge: string;
    expiresAt?: string;
}

interface LoginResponse {
    access_token?: string;
    token?: string;
    jwt?: string;
}

function normalizeSignature(signature: string): string {
    return signature.trim();
}

function isExpiredChallengeError(error: unknown): boolean {
    if (error instanceof ApiError && error.code === "INVALID_CHALLENGE") {
        return true;
    }
    const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
    return message.toLowerCase().includes("expired");
}

let authInFlight: Promise<string> | null = null;

async function requestChallenge(publicKey: string): Promise<ChallengeResponse> {
    return apiFetch<ChallengeResponse>("/auth/challenge", {
        method: "POST",
        authenticated: false,
        body: { publicKey },
        defaultError: "Could not request authentication challenge.",
    });
}

async function requestLogin(publicKey: string, challenge: string, signature: string): Promise<string> {
    const data = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        authenticated: false,
        body: { publicKey, challenge, signature },
        defaultError: "Could not complete login.",
    });

    return data.access_token || data.token || data.jwt || "";
}

async function signChallenge(challenge: string): Promise<string> {
    const walletId = localStorage.getItem(WALLET_ID_KEY);
    const publicKey = localStorage.getItem(PUBLICKEY_KEY);
    if (!walletId || !publicKey) throw new Error("No wallet connected");

    stellarWalletKitService.setWallet(walletId);
    const signed = await stellarWalletKitService.signMessage(challenge, publicKey);
    return normalizeSignature(signed);
}

export const walletService = {
    // Restaura sesión desde localStorage. Nunca asume que una wallet
    // previamente seleccionada sigue conectada: vuelve a pedir la dirección
    // y la compara contra lo guardado antes de confiar en la sesión.
    async restoreSession(): Promise<{ publicKey: string; walletId: string } | null> {
        const savedWalletId = localStorage.getItem(WALLET_ID_KEY);
        const savedPublicKey = localStorage.getItem(PUBLICKEY_KEY);

        if (!savedWalletId || !savedPublicKey) return null;

        try {
            stellarWalletKitService.setWallet(savedWalletId);
            const address = await stellarWalletKitService.getAddress();

            if (!address || address !== savedPublicKey) {
                this.clearSession();
                return null;
            }

            return { publicKey: address, walletId: savedWalletId };
        } catch {
            this.clearSession();
            return null;
        }
    },

    // Conecta la wallet indicada a través de Stellar Wallets Kit
    async connect(walletId: string): Promise<string> {
        const publicKey = await stellarWalletKitService.connect(walletId);

        localStorage.setItem(WALLET_ID_KEY, walletId);
        localStorage.setItem(PUBLICKEY_KEY, publicKey);
        return publicKey;
    },

    async signTransaction(xdr: string): Promise<string> {
        const walletId = localStorage.getItem(WALLET_ID_KEY);
        const address = localStorage.getItem(PUBLICKEY_KEY);
        if (!walletId) throw new Error("No wallet connected");

        stellarWalletKitService.setWallet(walletId);
        return await stellarWalletKitService.signTransaction(xdr, address ?? undefined);
    },

    async detectNetwork() {
        return await stellarWalletKitService.detectNetwork();
    },

    getExpectedNetwork() {
        const raw = (process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet").toLowerCase();
        return raw === "mainnet" || raw === "public" ? "mainnet" : "testnet";
    },

    async authenticate(publicKey: string): Promise<string> {
        if (authInFlight) {
            return authInFlight;
        }

        authInFlight = (async () => {
            let currentChallenge = "";

            try {
            const walletId = localStorage.getItem(WALLET_ID_KEY);
            if (!walletId) throw new Error("No wallet connected");
            if (!stellarWalletKitService.supportsMessageSigning(walletId)) {
                throw new Error("This wallet does not support SEP-43 message signing. Choose a wallet that supports message signing to sign in.");
            }

                const challengeResponse = await requestChallenge(publicKey);
                currentChallenge = challengeResponse.challenge;

                for (let attempt = 0; attempt < 2; attempt += 1) {
                    try {
                        const signature = await signChallenge(currentChallenge);
                        const token = await requestLogin(publicKey, currentChallenge, signature);
                        if (!token) {
                            throw new Error("Authentication response did not include a JWT.");
                        }
                        return token;
                    } catch (error) {
                        if (attempt === 0 && isExpiredChallengeError(error)) {
                            const freshChallenge = await requestChallenge(publicKey);
                            currentChallenge = freshChallenge.challenge;
                            continue;
                        }

                        if (isSignatureCancelled(error)) {
                            throw new Error("Wallet signature is required to verify ownership and complete login.");
                        }

                        throw error;
                    }
                }

                throw new Error("Could not complete login.");
            } catch (error) {
                if (isSignatureCancelled(error)) {
                    throw new Error("Wallet signature is required to verify ownership and complete login.");
                }
                throw error;
            }
        })();

        try {
            return await authInFlight;
        } finally {
            authInFlight = null;
        }
    },

    clearSession() {
        localStorage.removeItem(WALLET_ID_KEY);
        localStorage.removeItem(PUBLICKEY_KEY);
        void stellarWalletKitService.disconnect();
    },
};

export function isSignatureCancelled(error: unknown): boolean {
    if (typeof error === "object" && error !== null) {
        const err = error as Record<string, unknown>;

        // Primary detection: Freighter/kit-style rejection { code: -4, message: "..." }
        if (err.code === -4) return true;

        // Fallback: message-based matching for wallets without a reliable numeric code.
        const msg = err.message;
        if (typeof msg === "string") {
            const lower = msg.toLowerCase();
            if (lower.includes("cancel") || lower.includes("reject") || lower.includes("declined")) {
                return true;
            }
        }
    }

    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        return msg.includes("cancel") || msg.includes("reject") || msg.includes("declined");
    }

    return false;
}
