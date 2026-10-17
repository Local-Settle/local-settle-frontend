"use client";

export default function ProtectedRouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <main role="alert" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#081521] px-6 text-center text-white">
            <h1 className="text-xl font-bold">This page could not be loaded</h1>
            <p className="max-w-md text-sm text-[#9BABB7]">
                Your session is still active. Retry the page, or return to your account navigation and try again later.
            </p>
            <button
                type="button"
                onClick={reset}
                className="rounded-lg bg-[#55D6BE] px-5 py-3 text-sm font-bold text-[#081521] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
                Retry page
            </button>
        </main>
    );
}
