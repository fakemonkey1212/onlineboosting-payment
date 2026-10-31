import { describe, expect, it } from "vitest";
import { readRedirectAmount, removeRedirectRef } from "@/lib/redirectAmount";

const encode = (payload: unknown) => btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

describe("redirect amount", () => {
  it("decodes the amount from an unpadded Base64url ref", () => {
    expect(readRedirectAmount(`?ref=${encode({ amount: 1250 })}`)).toEqual({ amount: "1250", invalid: false });
  });
  it("preserves exact decimal strings", () => {
    expect(readRedirectAmount(`?ref=${encode({ amount: "1250.50" })}`)).toEqual({ amount: "1250.50", invalid: false });
  });
  it("retains existing plain amount links", () => {
    expect(readRedirectAmount("?amount=250")).toEqual({ amount: "250", invalid: false });
  });
  it("rejects malformed ref rather than throwing or using a different amount", () => {
    expect(readRedirectAmount("?ref=broken&amount=250")).toEqual({ amount: null, invalid: true });
  });
  it("rejects invalid amounts", () => {
    for (const amount of [-1, 0, true, null, {}, "1e3", "1000000000", " 250 "]) {
      expect(readRedirectAmount(`?ref=${encode({ amount })}`).invalid).toBe(true);
    }
  });
  it("removes only ref and preserves router state", () => {
    window.history.replaceState({ idx: 2 }, "", "/payment?ref=secret&amount=250#test");
    removeRedirectRef();
    expect(window.location.pathname + window.location.search + window.location.hash).toBe("/payment?amount=250#test");
    expect(window.history.state).toEqual({ idx: 2 });
  });
});