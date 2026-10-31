import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ক্যাশ ভ্যারিয়েবল (বারবার DB হিট এড়াতে ৬০ সেকেন্ড ক্যাশ)
let cachedAllowedDomains: string[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 60_000;

// টেস্ট ও প্রিভিউ সবসময় যাতে কাজ করে
const DEFAULT_ALLOWED = [
  /^https:\/\/([a-z0-9-]+\.)*lovable\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovable\.dev$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovableproject\.com$/i,
  /^http:\/\/localhost(:\d+)?$/i,
];

export async function isAllowedOriginDynamic(
  origin: string | null,
  client: SupabaseClient
): Promise<boolean> {
  if (!origin) return false;

  // ১. ডিফল্ট প্রিভিউ ডোমেইন চেক
  if (DEFAULT_ALLOWED.some((r) => r.test(origin))) {
    return true;
  }

  let originHost = "";
  try {
    originHost = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }

  // ২. ক্যাশ থেকে বা DB থেকে allowed_websites পড়া
  const now = Date.now();
  if (now - lastFetchTime > CACHE_TTL_MS || cachedAllowedDomains.length === 0) {
    const { data } = await client.from("allowed_websites").select("url");
    if (data) {
      cachedAllowedDomains = data
        .map((row: { url: string }) => {
          try {
            const parsed = row.url.startsWith("http")
              ? new URL(row.url)
              : new URL(`https://${row.url}`);
            return parsed.hostname.toLowerCase().replace(/^www\./, "");
          } catch {
            return row.url.toLowerCase().trim().replace(/^www\./, "");
          }
        })
        .filter(Boolean);
      lastFetchTime = now;
    }
  }

  // ৩. অরিজিন ডোমেইন বা সাবডোমেইন ম্যাচ করছে কি না চেক
  return cachedAllowedDomains.some((domain) => {
    return originHost === domain || originHost.endsWith(`.${domain}`);
  });
}
