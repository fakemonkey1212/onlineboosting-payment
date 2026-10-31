export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      // ১. /api/ রিকোয়েস্টগুলোকে ব্যাকএন্ডে প্রক্সি করা
      if (url.pathname.startsWith("/api/")) {
        const functionPath = url.pathname.replace(/^\/api\//, "");
        const backendUrl = `https://mtssmootnyokdstjwtog.supabase.co/functions/v1/${functionPath}${url.search}`;

        // Host হেডার বাদ দিয়ে বাকি হেডার কপি করা
        const headers = new Headers(request.headers);
        headers.delete("host");

        const init = {
          method: request.method,
          headers,
          redirect: "follow",
        };

        // GET বা HEAD মেথডে body দেওয়া যায় না, কেবল POST/PUT-এ দেওয়া যাবে
        if (request.method !== "GET" && request.method !== "HEAD") {
          init.body = request.body;
        }

        return await fetch(backendUrl, init);
      }

      // ২. ওয়েবসাইট ও স্ট্যাটিক ফাইল লোড করা
      if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
        return await env.ASSETS.fetch(request);
      }

      return await fetch(request);
    } catch (err) {
      // কোনো কারণে ক্র্যাশ হলে সাদা এররের বদলে এরর ডিটেইলস দেখাবে
      return new Response(`Worker Exception: ${err.message}`, {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  },
};

