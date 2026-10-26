import { afterEach, describe, expect, it, vi } from "vitest";
import { invokeApi } from "@/lib/apiClient";

afterEach(() => vi.unstubAllGlobals());

describe("flow API transport", () => {
  it("does not request cross-origin cookies for payment sessions", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ valid: false }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await invokeApi("flow-session", { body: { action: "validate" } });

    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      credentials: "same-origin",
      method: "POST",
    }));
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ valid: false });
  });
});