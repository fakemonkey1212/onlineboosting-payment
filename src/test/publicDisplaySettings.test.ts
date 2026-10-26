import { describe, it, expect, vi } from "vitest";
import { loadDisplaySetting, readDisplaySetting } from "@/lib/publicDisplaySettings";

describe("current-opening display settings", () => {
  it("ignores old browser storage", () => {
    localStorage.setItem("genz_gateway_name", "Old branding");
    expect(readDisplaySetting("not-fetched-name")).toBeUndefined();
  });

  it("shares concurrent reads and the 15-second opening snapshot, then refreshes", async () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
    const fetchValue = vi.fn().mockResolvedValueOnce("Current").mockResolvedValueOnce("Updated");
    const first = loadDisplaySetting("test-name", fetchValue);
    const second = loadDisplaySetting("test-name", fetchValue);
    expect(first).toBe(second);
    await first;
    expect(fetchValue).toHaveBeenCalledTimes(1);
    expect(readDisplaySetting("test-name")).toBe("Current");
    await loadDisplaySetting("test-name", fetchValue);
    expect(fetchValue).toHaveBeenCalledTimes(1);
    expect(readDisplaySetting("test-name")).toBe("Current");
    clock.mockReturnValue(16000);
    await loadDisplaySetting("test-name", fetchValue);
    expect(readDisplaySetting("test-name")).toBe("Updated");
    expect(fetchValue).toHaveBeenCalledTimes(2);
    clock.mockRestore();
  });
});