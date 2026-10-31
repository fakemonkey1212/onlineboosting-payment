const BACKEND_BASE = "https://mtssmootnyokdstjwtog.supabase.co/functions/v1";

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      // ১. /api/ রিকোয়েস্টগুলো ব্যাকএন্ডে প্রক্সি করবে (IP গোপন থাকবে)
      if (url.pathname.startsWith("/api/")) {
        const functionPath = url.pathname.replace(/^\/api\//, "");
        const targetUrl = `${BACKEND_BASE}/${functionPath}${url.search}`;

        const headers = new Headers(request.headers);
        headers.delete("host");

        const init = {
          method: request.method,
          headers,
          redirect: "follow",
        };

        if (request.method !== "GET" && request.method !== "HEAD") {
          init.body = request.body;
        }

        return await fetch(targetUrl, init);
      }

      // ২. ওয়েবসাইট, স্ক্রিপ্ট ও পেজ dist থেকে লোড করবে
      if (env.ASSETS) {
        return await env.ASSETS.fetch(request);
      }

      return new Response("Assets not bound", { status: 500 });
    } catch (err) {
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
