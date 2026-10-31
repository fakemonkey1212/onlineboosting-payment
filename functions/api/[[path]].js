const BACKEND_BASE = "https://mtssmootnyokdstjwtog.supabase.co/functions/v1";

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);

  // api-এর পরের পাথের নাম নেবে (যেমন: flow-session, secure-api ইত্যাদি)
  const path = Array.isArray(params.path) ? params.path.join("/") : (params.path || "");

  if (!path) {
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers = new Headers(request.headers);
  // মূল ডোমেইনের Host হেডার মুছে ক্লাউডফ্লেয়ারের সার্ভার থেকে ব্যাকএন্ডে কল পাঠানো হবে
  headers.delete("host");

  const init = {
    method: request.method,
    headers,
    redirect: "follow",
  };

  // GET বা HEAD ছাড়া বাকি মেথডে body ফরোয়ার্ড হবে
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  return await fetch(`${BACKEND_BASE}/${path}${url.search}`, init);
}
