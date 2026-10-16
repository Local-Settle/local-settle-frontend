import { describe, expect, it } from "vitest";
import { getSendErrorGuidance } from "../send-error-guidance";

describe("getSendErrorGuidance", () => {
  it("explains insufficient token balance separately from XLM reserve errors", () => {
    expect(getSendErrorGuidance("op_underfunded", "USDC")).toMatch(/enough USDC/i);
    expect(getSendErrorGuidance("tx_insufficient_balance", "USDC")).toMatch(/more XLM/i);
    expect(getSendErrorGuidance("op_low_reserve", "USDC")).toMatch(/more XLM/i);
  });

  it("keeps an unknown server message as a safe fallback", () => {
    expect(getSendErrorGuidance("Horizon is temporarily unavailable")).toBe("Horizon is temporarily unavailable");
    expect(getSendErrorGuidance("")).toMatch(/could not be submitted/i);
  });
});
