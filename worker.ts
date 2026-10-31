// Cloudflare static assets + a fixed, allowlisted same-origin function proxy.
const FUNCTION_BASE = "https://mtssmootnyokdstjwtog.supabase.co/functions/v1/";
const FUNCTIONS = new Set(["flow-session", "secure-api", "admin-auth", "profile-lookup"]);

type Env = { ASSETS: { fetch(request: Request): Promise<Response> } };

const error = (message: string, status: number) => new Response(JSON.stringify({ error: message }), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/api" && !url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    const fn = url.pathname.slice(5);
    if (!FUNCTIONS.has(fn) || url.search) return error("not_found", 404);
    if (request.method !== "POST" && request.method !== "OPTIONS") return error("method_not_allowed", 405);
    // Never synthesize a trusted Origin for a caller that did not send one.
    if (request.headers.get("origin") !== url.origin) return error("forbidden", 403);
    const headers = new Headers();
    for (const name of ["content-type", "origin", "cookie", "x-admin-session", "x-csrf-token", "user-agent", "access-control-request-method", "access-control-request-headers"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    // Cloudflare supplies this header; never trust caller-controlled forwarding chains.
    const ip = request.headers.get("cf-connecting-ip");
    if (ip) headers.set("x-forwarded-for", ip);
    try {
      const upstream = await fetch(`${FUNCTION_BASE}${fn}`, {
        method: request.method, headers,
        body: request.method === "POST" ? request.body : undefined,
        redirect: "manual",
      });
      const responseHeaders = new Headers(upstream.headers);
      responseHeaders.set("Cache-Control", "no-store");
      // Response headers, including HttpOnly Set-Cookie, must reach the browser unchanged.
      return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
    } catch { return error("upstream_unavailable", 502); }
  },
};
