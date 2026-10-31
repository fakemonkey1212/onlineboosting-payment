const BACKEND_BASE =
  "https://mtssmootnyokdstjwtog.supabase.co/functions/v1";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      // কেবল /api/* রিকোয়েস্ট নিরাপদভাবে backend function-এ যাবে
      if (url.pathname.startsWith("/api/")) {
        const functionPath = url.pathname.slice("/api/".length);

        // /api/ বা খালি function path reject
        if (!functionPath) {
          return new Response("Not found", { status: 404 });
        }

        const headers = new Headers(request.headers);

        // মূল subdomain-এর Host backend-এ পাঠানো যাবে না
        headers.delete("host");

        const init = {
          method: request.method,
          headers,
          redirect: "follow",
        };

        // GET/HEAD request-এ body দেওয়া যায় না
        if (request.method !== "GET" && request.method !== "HEAD") {
          init.body = request.body;
        }

        return await fetch(
          `${BACKEND_BASE}/${functionPath}${url.search}`,
          init,
        );
      }

      // সব page, JS, CSS, image এবং SPA route Worker assets থেকে serve হবে
      if (!env.ASSETS) {
        return new Response("Static assets binding is missing.", {
          status: 500,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      return await env.ASSETS.fetch(request);
    } catch (error) {
      console.error("Worker request failed:", error);

      return new Response("Service temporarily unavailable.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  },
};

