const BACKEND_BASE = "https://mtssmootnyokdstjwtog.supabase.co/functions/v1";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // /api/ রিকোয়েস্টগুলো ব্যাকএন্ডে প্রক্সি করবে (ব্রাউজারে আসল ব্যাকএন্ড লিঙ্ক কখনো প্রকাশ পাবে না)
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

    // বাকি সব পেজ, ছবি ও ফাইল dist থেকে লোড করবে
    return env.ASSETS.fetch(request);
  },
};
