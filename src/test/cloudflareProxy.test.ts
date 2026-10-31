import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import worker from "../../worker";

const env = { ASSETS: { fetch: vi.fn(async () => new Response("app")) } };
const request = (path: string, options: RequestInit = {}) => new Request(`https://pay.genzsmm.com${path}`, { method: "POST", headers: { origin: "https://pay.genzsmm.com" }, ...options });
afterEach(() => vi.unstubAllGlobals());

describe("Cloudflare safe forwarding", () => {
  it("forwards flow data to a fixed destination and preserves the exact amount and nonce", async () => {
    const fetcher = vi.fn(async (_url: string, options: RequestInit) => {
      expect(await new Response(options.body).json()).toEqual({ action: "start", amount: "1250.50", nonce: "browser-bound-test-nonce" });
      return new Response('{"token":"test"}', { headers: { "Set-Cookie": "session=test; HttpOnly; Secure", "Cache-Control": "public" } });
    });
    vi.stubGlobal("fetch", fetcher);
    const response = await worker.fetch(request("/api/flow-session", { body: JSON.stringify({ action: "start", amount: "1250.50", nonce: "browser-bound-test-nonce" }) }), env);
    expect(fetcher.mock.calls[0][0]).toMatch(/^https:\/\/[^/]+\/functions\/v1\/flow-session$/);
    expect(response.headers.get("Set-Cookie")).toBe("session=test; HttpOnly; Secure");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ token: "test" });
  });
  it("preserves admin session, cookie and CSRF headers without adding public credentials", async () => {
    const fetcher = vi.fn(async (_url: string, options: RequestInit) => {
      const headers = new Headers(options.headers);
      expect(headers.get("x-admin-session")).toBe("test-session");
      expect(headers.get("x-csrf-token")).toBe("test-csrf");
      expect(headers.get("cookie")).toBe("admin=test");
      expect(headers.has("authorization")).toBe(false);
      expect(headers.has("apikey")).toBe(false);
      return new Response("{}", { status: 401 });
    });
    vi.stubGlobal("fetch", fetcher);
    const response = await worker.fetch(request("/api/secure-api", { headers: { origin: "https://pay.genzsmm.com", cookie: "admin=test", "x-admin-session": "test-session", "x-csrf-token": "test-csrf" } }), env);
    expect(response.status).toBe(401);
  });
  it("blocks retired Telegram/OTP endpoints, arbitrary targets and missing or foreign origins", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    for (const path of ["/api/telegram-notify", "/api/telegram-webhook", "/api/otp-status", "/api/https://example.com", "/api/flow-session?target=evil"]) {
      expect((await worker.fetch(request(path), env)).status).toBe(404);
    }
    for (const origin of ["", "https://evil.example"]) {
      expect((await worker.fetch(request("/api/admin-auth", { headers: { origin } }), env)).status).toBe(403);
    }
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("leaves SPA and asset handling intact and rejects unsupported API methods", async () => {
    expect(await (await worker.fetch(new Request("https://pay.genzsmm.com/payment-cancelled"), env)).text()).toBe("app");
    expect((await worker.fetch(request("/api/flow-session", { method: "GET" }), env)).status).toBe(405);
  });
  it("allows only HTTPS genzsmm.com and valid subdomains in every retained function", () => {
    for (const name of ["flow-session", "admin-auth", "secure-api", "profile-lookup"]) {
      const source = readFileSync(`supabase/functions/${name}/index.ts`, "utf8");
      const declaration = source.match(/const ALLOWED_ORIGIN_PATTERNS: RegExp\[\] = (\[[\s\S]*?\]);/);
      const patterns: RegExp[] = Function(`return ${declaration?.[1] ?? "[]"}`)();
      const allowed = (origin: string) => patterns.some(pattern => pattern.test(origin));
      for (const origin of ["https://genzsmm.com", "https://pay.genzsmm.com", "https://checkout.pay.genzsmm.com"]) expect(allowed(origin)).toBe(true);
      for (const origin of ["http://pay.genzsmm.com", "https://evilgenzsmm.com", "https://genzsmm.com.evil.example", "https://-bad.genzsmm.com", "https://pay.genzsmm.com@evil.example"]) expect(allowed(origin)).toBe(false);
    }
  });
});
