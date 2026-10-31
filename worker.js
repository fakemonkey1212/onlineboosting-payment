export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // /api/ দিয়ে শুরু হলে রিকোয়েস্টটি ক্লাউড ব্যাকএন্ড ফাংশনে ফরওয়ার্ড হবে
    if (url.pathname.startsWith("/api/")) {
      const functionPath = url.pathname.replace(/^\/api\//, "");
      const backendUrl = `https://mtssmootnyokdstjwtog.supabase.co/functions/v1/${functionPath}${url.search}`;

      const newRequest = new Request(backendUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: "follow",
      });

      return fetch(newRequest);
    }

    // বাকি সব পেজ ও স্ট্যাটিক ফাইলের জন্য
    return env.ASSETS.fetch(request);
  },
};
