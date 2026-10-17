"use client";

import { useState } from "react";

export default function CopyIssuer({ issuer }: { issuer: string }) {
  const [copied, setCopied] = useState(false);

  async function copyIssuer() {
    try {
      await navigator.clipboard.writeText(issuer);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <code className="break-all rounded-lg bg-black/20 px-3 py-2 text-sm text-slate-200">{issuer}</code>
      <button type="button" onClick={copyIssuer} className="rounded-lg border border-white/15 px-3 py-2 text-sm text-[#55D6BE] hover:bg-white/5">
        {copied ? "Copied" : "Copy address"}
      </button>
    </div>
  );
}
