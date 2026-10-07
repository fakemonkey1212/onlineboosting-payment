import { describe, it, expect, vi } from "vitest";
import { loadDisplaySetting, readDisplaySetting } from "@/lib/publicDisplaySettings";

describe("current-opening display settings", () => {
  it("ignores old browser storage", () => {
    localStorage.setItem("genz_gateway_name", "Old branding");
    expect(readDisplaySetting("not-fetched-name")).toBeUndefined();
  });

  it("deduplicates concurrent reads but refreshes on the next read", async () => {
    const fetchValue = vi.fn().mockResolvedValueOnce("Current").mockResolvedValueOnce("Updated");
    const first = loadDisplaySetting("test-name", fetchValue);
    const second = loadDisplaySetting("test-name", fetchValue);
    expect(first).toBe(second);
    await first;
    expect(fetchValue).toHaveBeenCalledTimes(1);
    expect(readDisplaySetting("test-name")).toBe("Current");
    await loadDisplaySetting("test-name", fetchValue);
    expect(readDisplaySetting("test-name")).toBe("Updated");
    expect(fetchValue).toHaveBeenCalledTimes(2);
  });
});