import { describe, expect, it } from "vitest";
import { validateEvidenceFile } from "../evidence-file";

describe("validateEvidenceFile", () => {
  it("accepts matching supported MIME types and extensions up to the 10 MB limit", () => {
    expect(validateEvidenceFile({ name: "receipt.PDF", type: "application/pdf", size: 10 * 1024 * 1024 })).toBeNull();
    expect(validateEvidenceFile({ name: "receipt.jpg", type: "image/jpeg", size: 100 })).toBeNull();
  });

  it("rejects files over the limit, unsupported MIME types, and mismatched extensions", () => {
    expect(validateEvidenceFile({ name: "receipt.pdf", type: "application/pdf", size: 10 * 1024 * 1024 + 1 })).toMatch(/10 MB/i);
    expect(validateEvidenceFile({ name: "receipt.gif", type: "image/gif", size: 100 })).toMatch(/JPG, PNG, WEBP, or PDF/i);
    expect(validateEvidenceFile({ name: "receipt.pdf", type: "image/png", size: 100 })).toMatch(/extension/i);
  });
});
