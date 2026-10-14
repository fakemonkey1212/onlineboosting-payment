// Where the PAYMENT SITE itself runs (browser callers of these functions).
// Merchant / referring websites are NOT listed here — they live only in the
// Admin Panel's Allowed Websites list (allowed_websites table).
//
// Configure production hosts with the PAYMENT_SITE_ORIGINS secret, comma-separated,
// e.g. "https://pay.example.com,https://my-worker.example.workers.dev".

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// This Lovable project's own preview / published hosts (for editing and testing).
const LOVABLE_DEV_PATTERNS: RegExp[] = [
  /^https:\/\/([a-z0-9-]+--)?f9250e90-65c3-4670-ac1e-e765ff2ca041(-[a-z0-9-]+)?\.lovable\.app$/i,
  /^https:\/\/([a-z0-9-]+--)?f9250e90-65c3-4670-ac1e-e765ff2ca041(-[a-z0-9-]+)?\.lovableproject\.com$/i,
  /^https:\/\/bkcdaa\.lovable\.app$/i,
  /^http:\/\/localhost(:\d+)?$/i,
];

export function configuredPaymentOrigins(): string[] {
  return (Deno.env.get("PAYMENT_SITE_ORIGINS") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => { try { return new URL(s).origin; } catch { return ""; } })
    .filter(Boolean);
}

export function paymentOriginPatterns(): RegExp[] {
  return [
    ...configuredPaymentOrigins().map((o) => new RegExp(`^${esc(o)}$`, "i")),
    ...LOVABLE_DEV_PATTERNS,
  ];
}

/** True only when the payment page itself is running in this project's Lovable preview/dev. */
export const isLovableDevOrigin = (o: string | null) => !!o && LOVABLE_DEV_PATTERNS.some((r) => r.test(o));

/**
 * Strict Allowed-Websites match. An entry "https://shop.com" matches exactly that
 * host (www.shop.com counts as the same site). An entry with a path
 * ("https://shop.com/pay") matches that path and below only.
 * Never a plain text prefix: "shop.com.evil.net" does NOT match "shop.com".
 */
export function referrerMatches(referrer: string, entry: string): boolean {
  let r: URL, e: URL;
  try { r = new URL(referrer); } catch { return false; }
  const raw = entry.trim();
  try { e = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`); } catch { return false; }
  if (!/^https?:$/.test(r.protocol)) return false;
  const host = (h: string) => h.toLowerCase().replace(/^www\./, "");
  if (host(r.hostname) !== host(e.hostname)) return false;
  if (e.port && e.port !== r.port) return false;
  const ePath = e.pathname.replace(/\/+$/, "");
  if (!ePath) return true;
  const rPath = r.pathname.replace(/\/+$/, "");
  return rPath === ePath || rPath.startsWith(ePath + "/");
}
