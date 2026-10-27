// Cloudflare Worker: proxies same-origin /api/<fn> to the backend functions; everything else is the static app.
const BACKEND = "https://mtssmootnyokdstjwtog.supabase.co/functions/v1";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/api\/([a-z0-9-]+)$/i);
    if (!m) return env.ASSETS.fetch(request);
    const headers = new Headers(request.headers);
    headers.delete("host");
    const res = await fetch(`${BACKEND}/${m[1]}${url.search}`, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "manual",
    });
    const out = new Response(res.body, res);
    out.headers.set("Cache-Control", "no-store");
    return out;
  },
};
