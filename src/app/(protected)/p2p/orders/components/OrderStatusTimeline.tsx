"use client";

type Role = "buyer" | "seller";
type Status = "pending" | "initialized" | "funded" | "fiat_sent" | "released" | "disputed" | "resolved";

const STEPS: Record<Status, { title: string; track: string }> = {
    pending: { title: "Order opened", track: "Local trade terms" },
    initialized: { title: "Escrow initialized", track: "On-chain USDC" },
    funded: { title: "USDC escrow funded", track: "On-chain USDC" },
    fiat_sent: { title: "Local payment reported", track: "Buyer-reported status" },
    released: { title: "USDC released", track: "On-chain USDC" },
    disputed: { title: "Dispute opened", track: "Review" },
    resolved: { title: "Dispute resolved", track: "Review" },
};

const ROLE_GUIDANCE: Record<Status, Record<Role, string>> = {
    pending: { buyer: "Review the agreed local payment terms.", seller: "Keep the agreed payment instructions available." },
    initialized: { buyer: "Wait for the escrow funding step to complete.", seller: "Follow the order flow to fund the USDC escrow." },
    funded: { buyer: "Send local payment using the agreed method.", seller: "Wait for the buyer to report payment; verify it in your account." },
    fiat_sent: { buyer: "Payment is reported, not independently verified by LocalSettle.", seller: "Check your account and confirm only after receipt." },
    released: { buyer: "Check that USDC arrived in your wallet.", seller: "USDC escrow has been released according to the order state." },
    disputed: { buyer: "Follow the dispute instructions and provide relevant evidence.", seller: "Follow the dispute instructions and provide relevant evidence." },
    resolved: { buyer: "Review the recorded dispute outcome.", seller: "Review the recorded dispute outcome." },
};

const ORDER: Status[] = ["pending", "initialized", "funded", "fiat_sent", "released"];

export function OrderStatusTimeline({ status, role }: { status: string; role: Role }) {
    const normalizedStatus = (status in STEPS ? status : "pending") as Status;
    const steps = normalizedStatus === "disputed" || normalizedStatus === "resolved"
        ? [...ORDER.slice(0, 4), "disputed" as const, ...(normalizedStatus === "resolved" ? ["resolved" as const] : [])]
        : ORDER.slice(0, ORDER.indexOf(normalizedStatus) + 1);

    return (
        <section aria-label="Order timeline" className="mb-5 w-full rounded-xl border border-white/10 bg-[#0D1D2C] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-white">Order progress</h2>
                <p className="text-xs text-[#9BABB7]">{ROLE_GUIDANCE[normalizedStatus][role]}</p>
            </div>
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                {steps.map((step, index) => (
                    <li key={step} aria-current={step === normalizedStatus ? "step" : undefined} className="rounded-lg border border-[#263949] p-2">
                        <span className="block text-[10px] uppercase tracking-wide text-[#55D6BE]">{STEPS[step].track}</span>
                        <span className="mt-1 block text-xs text-white">{index + 1}. {STEPS[step].title}</span>
                    </li>
                ))}
            </ol>
        </section>
    );
}
