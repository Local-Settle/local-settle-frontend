"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ShieldCheck, UserCheck, CheckCircle2, Clock3, Camera } from "lucide-react";
import { useUser } from "@/features/user/presentation/context/UserContext";
import { useUsers } from "@/features/user/hooks/useUsers";
import { useNotifications } from "@/features/notifications";

export function ProfileTab() {
    const { currentUser } = useUser();
    const { updateUser, uploadProfilePicture, checkAliasAvailable } = useUsers();
    const { notify } = useNotifications();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [username, setUsername] = useState("");
    const [alias, setAlias] = useState("");
    const [aliasError, setAliasError] = useState("");
    const [email, setEmail] = useState("");
    const [bio, setBio] = useState("");
    const [profileImagePreview, setProfileImagePreview] = useState("");
    const [profileImageHasError, setProfileImageHasError] = useState(false);
    const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
    const [profileImageError, setProfileImageError] = useState("");
    const [profileImageMessage, setProfileImageMessage] = useState("");
    const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [kycLoading, setKycLoading] = useState(false);
    const [kycError, setKycError] = useState<string | null>(null);

    const aliasDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const aliasRequestSeqRef = useRef(0);

    useEffect(() => {
        if (currentUser) {
            setUsername(currentUser.username || "");
            setAlias(currentUser.alias || "");
            setEmail(currentUser.email || "");
            setBio(currentUser.bio || "");
            setProfileImagePreview((existingPreview) => {
                if (existingPreview.startsWith("blob:")) {
                    return existingPreview;
                }
                return currentUser.profileImageUrl || "";
            });
            setProfileImageHasError(false);
        }
    }, [currentUser]);

    useEffect(() => {
        return () => {
            if (profileImagePreview.startsWith("blob:")) {
                URL.revokeObjectURL(profileImagePreview);
            }

            if (aliasDebounceRef.current) {
                clearTimeout(aliasDebounceRef.current);
            }
        };
    }, [profileImagePreview]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (alias && !/^[a-z0-9.!_]+$/.test(alias)) {
            setAliasError("Invalid format. Use lowercase, numbers, and ., !, _");
            return;
        }

        if (aliasError) return;

        setIsSaving(true);
        setSaveMessage("");

        try {
            const payload: {
                email: string;
                bio: string;
                username?: string;
                alias?: string;
            } = {
                email,
                bio,
                username,
            };

            if (alias) {
                payload.alias = alias;
            }

            await updateUser(currentUser.userId, payload);
            setSaveMessage("Profile saved successfully!");
        } catch {
            setSaveMessage("Error saving profile");
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(""), 3000);
        }
    };

    const handleAliasChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setAlias(value);
            setAliasError("");

            if (aliasDebounceRef.current) {
                clearTimeout(aliasDebounceRef.current);
            }

            if (!value) return;

            const isValid = /^[a-z0-9.!_]+$/.test(value);
            if (!isValid) {
                setAliasError("Invalid format. Use lowercase, numbers, and ., !, _");
                return;
            }

            if (value !== currentUser?.alias) {
                aliasDebounceRef.current = setTimeout(async () => {
                    aliasRequestSeqRef.current += 1;
                    const seq = aliasRequestSeqRef.current;

                    try {
                        const { available } = await checkAliasAvailable(value);

                        if (seq !== aliasRequestSeqRef.current) return;

                        if (!available) {
                            setAliasError("This alias is already taken.");
                        }
                    } catch (err) {
                        if (seq !== aliasRequestSeqRef.current) return;
                        console.error("Failed to check alias", err);
                        notify(
                            "error",
                            "Could not verify alias availability. Please check your connection and try again."
                        );
                    }
                }, 500);
            }
        },
        [currentUser?.alias, checkAliasAvailable, notify]
    );

    const handleStartKyc = async () => {
        if (!currentUser?.userId) return;
        setKycLoading(true);
        setKycError(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/kyc/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId: currentUser.userId }),
            });

            if (!res.ok) {
                throw new Error("Failed to initialize KYC verification");
            }

            const data = await res.json();
            if (data?.sessionUrl) {
                window.open(data.sessionUrl, "_blank", "noopener,noreferrer");
            } else {
                throw new Error("No verification URL returned");
            }
        } catch (err: unknown) {
            setKycError(err instanceof Error ? err.message : "Something went wrong starting KYC.");
        } finally {
            setKycLoading(false);
        }
    };

    const handleSelectProfileImage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setProfileImageError("");
        setProfileImageMessage("");

        if (!file) {
            setSelectedProfileImage(null);
            return;
        }

        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedMimeTypes.includes(file.type)) {
            setSelectedProfileImage(null);
            setProfileImageError("Only JPEG, PNG, and WEBP images are allowed.");
            return;
        }

        const maxFileSize = 5 * 1024 * 1024;
        if (file.size > maxFileSize) {
            setSelectedProfileImage(null);
            setProfileImageError("Profile image must be 5MB or smaller.");
            return;
        }

        if (profileImagePreview.startsWith("blob:")) {
            URL.revokeObjectURL(profileImagePreview);
        }

        setSelectedProfileImage(file);
        setProfileImagePreview(URL.createObjectURL(file));
        setProfileImageHasError(false);
    };

    const handleUploadProfileImage = async () => {
        if (!currentUser?.userId || !selectedProfileImage) return;

        setIsUploadingProfileImage(true);
        setProfileImageError("");
        setProfileImageMessage("");

        try {
            const updatedUser = await uploadProfilePicture(currentUser.userId, selectedProfileImage);
            if (!updatedUser) {
                throw new Error("Upload failed");
            }

            if (profileImagePreview.startsWith("blob:")) {
                URL.revokeObjectURL(profileImagePreview);
            }

            setProfileImagePreview(updatedUser.profileImageUrl || "");
            setSelectedProfileImage(null);
            setProfileImageHasError(false);
            setProfileImageMessage("Profile picture uploaded successfully!");

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch {
            setProfileImageError("Failed to upload profile picture.");
        } finally {
            setIsUploadingProfileImage(false);
            setTimeout(() => setProfileImageMessage(""), 3000);
        }
    };

    const initials = (currentUser?.alias || currentUser?.publicKey || "IK")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="mx-auto w-full max-w-[1540px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.6fr)_420px] xl:items-start">
                <section className="space-y-6">
                    <div className="overflow-hidden rounded-[22px] border border-[#172B3A] bg-[linear-gradient(180deg,rgba(10,13,20,0.98)_0%,rgba(7,10,16,0.98)_100%)] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                        <div className="border-b border-[#172B3A] px-5 py-5 sm:px-7 sm:py-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-2">
                                    <h3 className="text-[1.6rem] font-bold tracking-tight text-[#F8FAFC] sm:text-[1.9rem]">
                                        Profile Settings
                                    </h3>
                                    <p className="max-w-2xl text-sm leading-7 text-[#F8FAFC] sm:text-[15px]">
                                        Refresh your public profile, update your contact details, and keep your account presentation polished across LocalSettle.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-6 px-5 py-5 sm:px-7 sm:py-7">
                            <div className="rounded-[18px] border border-[#172B3A] bg-[linear-gradient(180deg,rgba(9,12,18,0.98),rgba(5,7,12,0.92))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-5">
                                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-[#2B3320] bg-[#11151D] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                            {profileImagePreview && !profileImageHasError ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={profileImagePreview}
                                                    alt="Profile preview"
                                                    className="h-full w-full object-cover"
                                                    onError={() => setProfileImageHasError(true)}
                                                />
                                            ) : (
                                                <span className="text-3xl font-bold text-[#55D6BE]">
                                                    {initials}
                                                </span>
                                            )}
                                            <div className="absolute inset-x-2 bottom-2 rounded-full bg-[#020409]/78 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D9F99D] backdrop-blur">
                                                Avatar
                                            </div>
                                        </div>

                                        <div className="max-w-sm space-y-2">
                                            <div>
                                                <p className="text-base font-semibold text-[#F8FAFC]">
                                                    Profile picture
                                                </p>
                                                <p className="mt-1 text-sm leading-7 text-[#F8FAFC]">
                                                    Use a clean image that will represent you across profile views, offers, and future account surfaces.
                                                </p>
                                            </div>
                                            <p className="text-xs uppercase tracking-[0.18em] text-[#f8fafccb]">
                                                JPEG, PNG, or WEBP up to 5MB
                                            </p>
                                            {selectedProfileImage && (
                                                <p className="max-w-full truncate text-sm font-medium text-[#55D6BE]">
                                                    Ready to upload: {selectedProfileImage.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex w-full flex-col gap-3 rounded-[8px] border border-[#1B212B] bg-[#0C1017]/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] lg:w-auto">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleSelectProfileImage}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-[#2A3342] bg-[#11151D] px-4 py-3 text-sm font-semibold text-[#F1F5F9] transition hover:border-[#55D6BE] hover:text-white"
                                        >
                                            <Camera className="h-4 w-4" />
                                            Choose Image
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleUploadProfileImage}
                                            disabled={!selectedProfileImage || isUploadingProfileImage}
                                            className="rounded-[8px] bg-[#55D6BE] px-4 py-3 text-sm font-bold text-[#081521] transition hover:bg-[#55D6BE] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isUploadingProfileImage ? "Uploading..." : "Upload Photo"}
                                        </button>
                                    </div>
                                </div>

                                {(profileImageError || profileImageMessage) && (
                                    <div className="mt-4">
                                        {profileImageError && (
                                            <p className="text-sm text-red-400">{profileImageError}</p>
                                        )}
                                        {profileImageMessage && (
                                            <p className="text-sm text-[#55D6BE]">{profileImageMessage}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-[18px] border border-[#171C24] bg-[#090D14]/88 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-5">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-[#F8FAFC]">Public details</p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#f8fafcdc]">
                                            Identity shown on your profile
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <label className="text-sm font-medium text-[#F8FAFC]">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Enter display name"
                                            className="mt-2.5 h-14 w-full rounded-[12px] border border-[#172B3A] bg-[#05070C] px-4 text-[#F1F5F9] outline-none transition-colors placeholder:text-[#516072] focus:border-[#55D6BE]"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-medium text-[#F8FAFC]">
                                            Account Alias
                                        </label>
                                        <div className="mt-2.5">
                                            <input
                                                type="text"
                                                value={alias}
                                                onChange={handleAliasChange}
                                                placeholder="Enter unique alias"
                                                className={`h-14 w-full rounded-[12px] border bg-[#05070C] px-4 text-[#F1F5F9] outline-none transition-colors placeholder:text-[#516072] ${
                                                    aliasError
                                                        ? "border-red-500 focus:border-red-500"
                                                        : "border-[#172B3A] focus:border-[#55D6BE]"
                                                }`}
                                            />
                                            {aliasError && (
                                                <p className="mt-2 text-sm text-red-400">{aliasError}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4 md:col-span-2">
                                        <label className="text-sm font-medium text-[#F8FAFC]">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter email address"
                                            className="mt-2.5 h-14 w-full rounded-[12px] border border-[#172B3A] bg-[#05070C] px-4 text-[#F1F5F9] outline-none transition-colors placeholder:text-[#516072] focus:border-[#55D6BE]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[18px] border border-[#171C24] bg-[#090D14]/88 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-5">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-[#F8FAFC]">About you</p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#f8fafce1]">
                                            Short context for future trust signals
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#F8FAFC]">
                                        Bio
                                    </label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Write a short description about yourself..."
                                        rows={5}
                                        className="mt-2 w-full resize-none rounded-[12px] border border-[#172B3A] bg-[#05070C] px-4 py-4 text-[#F1F5F9] outline-none transition-colors placeholder:text-[#516072] focus:border-[#55D6BE]"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                <div className="flex min-h-6 items-center">
                                    {saveMessage && (
                                        <span className="text-sm font-medium text-[#55D6BE]">
                                            {saveMessage}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSaving || !!aliasError}
                                    className="w-full rounded-[8px] bg-[#55D6BE] px-6 py-3.5 text-sm font-bold text-[#081521] transition-all duration-200 hover:bg-[#55D6BE] disabled:opacity-50 sm:w-auto"
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                <aside className="xl:sticky xl:top-6">
                    <div className="overflow-hidden rounded-[22px] border border-[#172B3A] bg-[linear-gradient(180deg,rgba(10,13,20,0.98)_0%,rgba(7,10,16,0.98)_100%)] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                        <div className="border-b border-[#172B3A] px-5 py-5 sm:px-6 sm:py-6">
                            <h3 className="text-[1.45rem] font-bold tracking-tight text-[#F8FAFC]">
                                Identity Verification
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-[#F8FAFC]">
                                Status of your account verification and KYC documents.
                            </p>
                        </div>

                        {currentUser?.kycStatus === "approved" ? (
                            <div className="p-5 sm:p-6">
                                <div className="rounded-[10px] border border-[#2A3A1F] bg-[radial-gradient(circle_at_top,rgba(85,214,190,0.12),transparent_32%),#0F1A0C] p-5 sm:p-6">
                                    <div className="mx-auto inline-flex items-center gap-2 rounded-[8px] border border-[#bcf557]/20 bg-[#1A2D0F] px-4 py-2 text-[#55D6BE]">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-sm font-semibold">Account Verified</span>
                                    </div>

                                    <div className="mt-5 rounded-[12px] bg-[#0A0E13]">
                                        <div className="flex items-start gap-4">
                                            <div className="space-y-2">
                                                <h4 className="text-lg font-bold text-white">
                                                    KYC Tier 2 - Full Access
                                                </h4>
                                                <p className="text-sm leading-7 text-[#F8FAFC]">
                                                    Verified on{" "}
                                                    {currentUser.kycUpdatedAt
                                                        ? new Date(currentUser.kycUpdatedAt).toLocaleDateString("en-US", {
                                                              month: "long",
                                                              day: "numeric",
                                                              year: "numeric",
                                                          })
                                                        : "the verified date"}
                                                    . You have full access to all LocalSettle features, including high-volume P2P trades and instant withdrawals.
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="mt-6 w-full rounded-[14px] border border-[#2F431F] bg-[#162915] px-5 py-3.5 text-sm font-semibold text-[#F7FFDF] transition hover:border-[#55D6BE] hover:bg-[#1A2F10]"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 sm:p-6">
                                <div className="rounded-[20px] border border-[#172B3A] bg-[#081521]/60 p-6 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#9BABB7]/10">
                                        <UserCheck className="h-8 w-8 text-[#9BABB7]" />
                                    </div>

                                    <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                                        <span className="text-base font-bold text-[#F1F5F9]">
                                            Verification Status
                                        </span>
                                        <span className="rounded bg-[#9BABB7]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9BABB7]">
                                            {currentUser?.kycStatus || "NOT VERIFIED"}
                                        </span>
                                    </div>

                                    <p className="mx-auto max-w-[385px] text-sm leading-6 text-[#9BABB7]">
                                        To ensure security and comply with regulations, please provide a valid government issued ID and a live selfie.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={handleStartKyc}
                                        disabled={kycLoading}
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#55D6BE] py-3.5 text-sm font-bold text-[#081521] transition-all duration-200 hover:bg-[#55D6BE] disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        {kycLoading ? "Opening tab..." : "Verify Now"}
                                    </button>
                                    {kycError && (
                                        <p className="mt-3 text-xs text-red-400">{kycError}</p>
                                    )}

                                    <div className="mt-5 flex items-center justify-center gap-6 text-xs text-[#9BABB7]">
                                        <div className="flex items-center gap-1.5">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            <span>Secure</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock3 className="h-3.5 w-3.5" />
                                            <span>~5 mins</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
