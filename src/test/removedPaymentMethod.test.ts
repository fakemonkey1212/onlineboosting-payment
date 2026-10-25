import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("removed payment method", () => {
  it("rejects bKash2 in the server flow and admin method allowlists", () => {
    for (const [file, declaration] of [
      ["supabase/functions/flow-session/index.ts", /const PLATFORMS = (\[[^;]+\]);/],
      ["supabase/functions/secure-api/index.ts", /const PAYMENT_IDS = new Set\((\[[^;]+\])\);/],
    ] as const) {
      const source = readFileSync(file, "utf8");
      const match = source.match(declaration);
      expect(match).not.toBeNull();
      const ids: string[] = JSON.parse(match?.[1] ?? "[]");
      expect(ids).not.toContain("bkash2");
      expect(ids).toContain("bkash");
    }
  });
});