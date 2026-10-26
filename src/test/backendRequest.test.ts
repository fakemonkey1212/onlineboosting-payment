import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/apiClient", () => ({
  invokeApi: vi.fn(), apiBase: () => "/api", apiHeaders: () => ({}),
}));
import { invokeApi } from "@/lib/apiClient";

afterEach(() => { vi.useRealTimers(); vi.resetAllMocks(); });

describe("public request budget", () => {
  it("shares enabled methods for 15 seconds and refreshes afterwards", async () => {
    vi.resetModules();
    vi.useFakeTimers();
    const { getEnabledPaymentMethods } = await import("@/lib/backend-api");
    vi.mocked(invokeApi).mockResolvedValue({ data: { data: ["bkash"] }, error: null });
    expect(await getEnabledPaymentMethods()).toEqual(["bkash"]);
    expect(await getEnabledPaymentMethods()).toEqual(["bkash"]);
    expect(invokeApi).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(15_000);
    vi.mocked(invokeApi).mockResolvedValue({ data: { data: [] }, error: null });
    expect(await getEnabledPaymentMethods()).toEqual([]);
    expect(invokeApi).toHaveBeenCalledTimes(2);
  });

  it("waits a full minute after 429 before retrying public requests", async () => {
    vi.resetModules();
    vi.useFakeTimers();
    const { fetchEnabledPaymentMethodsFresh } = await import("@/lib/backend-api");
    vi.mocked(invokeApi)
      .mockResolvedValueOnce({ data: null, error: new Error("429 rate_limited") })
      .mockResolvedValue({ data: { data: ["bkash"] }, error: null });
    const request = fetchEnabledPaymentMethodsFresh();
    await vi.advanceTimersByTimeAsync(59_999);
    expect(invokeApi).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(await request).toEqual(["bkash"]);
    expect(invokeApi).toHaveBeenCalledTimes(2);
  });
});