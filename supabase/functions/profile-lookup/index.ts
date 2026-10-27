import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/gekhanki\.lovable\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovable\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovableproject\.com$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovable\.dev$/i,
  /^https:\/\/([a-z0-9-]+\.)*pages\.dev$/i,
  /^https:\/\/([a-z0-9-]+\.)*workers\.dev$/i,
  /^https:\/\/([a-z0-9-]+\.)*netlify\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)*netlify\.com$/i,
  /^http:\/\/localhost(:\d+)?$/i,
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGIN_PATTERNS.some((r) => r.test(origin));
}

function corsFor(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin! : "",
    Vary: "Origin",
    "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(data: unknown, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

type Detected = { platform: string; username: string };

function detect(rawInput: string): Detected | null {
  const input = rawInput.trim();
  if (!input) return null;
  const clean = (v: string) => v.replace(/^@/, "").split(/[?#]/)[0].replace(/\/+$/, "").trim();

  const fb = input.match(/(?:facebook|fb)\.com\/(?:profile\.php\?id=(\d+)|people\/[^/]+\/(\d+)|([A-Za-z0-9.\-_]+))/i);
  if (fb) {
    const username = clean(fb[1] || fb[2] || fb[3] || "");
    if (username && !/^(share|watch|reel|story\.php|photo|video)$/i.test(username)) {
      return { platform: "facebook", username };
    }
  }

  const ig = input.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  if (ig) {
    const username = clean(ig[1]);
    if (username && !/^(p|reel|reels|tv|stories|explore)$/i.test(username)) {
      return { platform: "instagram", username };
    }
  }

  const tt = input.match(/tiktok\.com\/@([A-Za-z0-9._]+)/i);
  if (tt) return { platform: "tiktok", username: clean(tt[1]) };

  const ytHandle = input.match(/youtube\.com\/@([A-Za-z0-9._\-]+)/i);
  if (ytHandle) return { platform: "youtube", username: clean(ytHandle[1]) };
  const ytOther = input.match(/youtube\.com\/(?:c|channel|user)\/([A-Za-z0-9._\-]+)/i);
  if (ytOther) return { platform: "youtube", username: clean(ytOther[1]) };

  return null;
}

function candidates({ platform, username }: Detected): string[] {
  const u = encodeURIComponent(username);
  const list: string[] = [];
  if (platform === "facebook") {
    list.push(`https://graph.facebook.com/${u}/picture?type=large`);
    list.push(`https://graph.facebook.com/v19.0/${u}/picture?width=720&height=720`);
  }
  list.push(`https://unavatar.io/${platform}/${u}?fallback=false`);
  list.push(`https://unavatar.io/${u}?fallback=false`);
  return list;
}

// Resolve a Facebook vanity name to a numeric profile/page id so the Graph
// picture endpoint (which works without a token) can be used.
async function facebookNumericId(username: string): Promise<string | null> {
  if (/^\d+$/.test(username)) return username;
  const urls = [
    `https://mbasic.facebook.com/${encodeURIComponent(username)}`,
    `https://m.facebook.com/${encodeURIComponent(username)}`,
    `https://www.facebook.com/${encodeURIComponent(username)}`,
  ];
  for (const url of urls) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      if (!res.ok) continue;
      const html = (await res.text()).slice(0, 500_000);
      const m =
        html.match(/"userID":"(\d{5,})"/) ||
        html.match(/"entity_id":"(\d{5,})"/) ||
        html.match(/"pageID":"(\d{5,})"/) ||
        html.match(/profile_id=(\d{5,})/) ||
        html.match(/fb:\/\/(?:profile|page)\/(\d{5,})/) ||
        html.match(/content="fb:\/\/profile\/(\d{5,})"/);
      if (m) return m[1];
    } catch (_e) {
      // try next
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}
async function microlinkImage(target: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(target)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const payload = await res.json();
    // `logo` is the site's favicon (for Facebook this is the blue Facebook
    // logo), not the requested account's profile picture.
    const url = payload?.data?.image?.url;
    return typeof url === "string" && url.startsWith("http") ? url : null;
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function pageUrl({ platform, username }: Detected): string | null {
  const u = encodeURIComponent(username);
  if (platform === "instagram") return `https://www.instagram.com/${u}/`;
  if (platform === "tiktok") return `https://www.tiktok.com/@${u}`;
  if (platform === "youtube") return `https://www.youtube.com/@${u}`;
  if (platform === "facebook") return `https://www.facebook.com/${u}`;
  return null;
}

async function scrapeOgImage(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 400_000);
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/"avatarThumbUrl":"([^"]+)"/i) ||
      html.match(/"profile_pic_url_hd":"([^"]+)"/i) ||
      html.match(/(https:\\?\/\\?\/[a-z0-9.\-]*fbcdn\.net\\?\/[^"'\s]+)/i);
    if (!match) return null;
    return match[1]
      .replace(/\\u0026/g, "&")
      .replace(/&amp;/g, "&")
      .replace(/\\\//g, "/");
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function instagramAvatarUrl(username: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      {
        signal: controller.signal,
        headers: {
          "x-ig-app-id": "936619743392459",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: "application/json",
        },
      },
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const user = payload?.data?.user;
    const pic = user?.profile_pic_url_hd || user?.profile_pic_url;
    return typeof pic === "string" && pic.startsWith("http") ? pic : null;
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchAvatar(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ProfileLookup/1.0)" },
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    if (!type.startsWith("image/")) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength < 512 || buf.byteLength > 3_000_000) return null;
    let binary = "";
    for (let i = 0; i < buf.length; i += 8192) {
      binary += String.fromCharCode(...buf.subarray(i, i + 8192));
    }
    return `data:${type.split(";")[0]};base64,${btoa(binary)}`;
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function firstImage(tasks: Array<Promise<string | null>>): Promise<string | null> {
  if (tasks.length === 0) return null;
  return await new Promise((resolve) => {
    let remaining = tasks.length;
    let settled = false;
    for (const task of tasks) {
      task
        .then((image) => {
          if (!settled && image) {
            settled = true;
            resolve(image);
            return;
          }
          remaining -= 1;
          if (!settled && remaining === 0) resolve(null);
        })
        .catch(() => {
          remaining -= 1;
          if (!settled && remaining === 0) resolve(null);
        });
    }
  });
}

async function imageFromMetadata(url: string): Promise<string | null> {
  const imageUrl = await scrapeOgImage(url);
  return imageUrl ? await fetchAvatar(imageUrl) : null;
}

async function facebookImage(detected: Detected): Promise<string | null> {
  const username = detected.username;
  const page = pageUrl(detected);
  const directTasks = candidates(detected).map((url) => fetchAvatar(url));
  const numericTask = (async () => {
    const numericId = await facebookNumericId(username);
    if (!numericId) return null;
    return await firstImage([
      fetchAvatar(`https://graph.facebook.com/${numericId}/picture?type=large`),
      fetchAvatar(`https://graph.facebook.com/v19.0/${numericId}/picture?width=720&height=720`),
    ]);
  })();
  const microlinkTask = (async () => {
    const url = page ? await microlinkImage(page) : null;
    return url ? await fetchAvatar(url) : null;
  })();
  return await firstImage([
    ...directTasks,
    numericTask,
    microlinkTask,
    imageFromMetadata(`https://mbasic.facebook.com/${encodeURIComponent(username)}`),
    imageFromMetadata(`https://m.facebook.com/${encodeURIComponent(username)}`),
  ]);
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsFor(origin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);
  if (!isAllowedOrigin(origin)) return json({ error: "forbidden" }, 403, cors);

  try {
    const body = await req.json().catch(() => ({}));
    const input = String(body?.url ?? "").slice(0, 500);
    const detected = detect(input);
    if (!detected) return json({ data: null, error: "unsupported_link" }, 200, cors);

    const image =
      detected.platform === "facebook"
        ? await facebookImage(detected)
        : await firstImage([
            ...candidates(detected).map((candidate) => fetchAvatar(candidate)),
            ...(detected.platform === "instagram"
              ? [
                  (async () => {
                    const url = await instagramAvatarUrl(detected.username);
                    return url ? await fetchAvatar(url) : null;
                  })(),
                ]
              : []),
            ...(pageUrl(detected) ? [imageFromMetadata(String(pageUrl(detected)))] : []),
          ]);
    if (image) {
      return json({ data: { platform: detected.platform, username: detected.username, image } }, 200, cors);
    }
    return json({ data: null, error: "not_found" }, 200, cors);
  } catch (_err) {
    return json({ data: null, error: "request_failed" }, 200, cors);
  }
});
