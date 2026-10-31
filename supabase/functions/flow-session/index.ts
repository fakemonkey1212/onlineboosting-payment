import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { checkFlowSession, sha256 } from "../_shared/flowSession.ts";

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*genzsmm\.com$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovable\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovableproject\.com$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovable\.dev$/i,
  /^https:\/\/([a-z0-9-]+\.)*pages\.dev$/i,
  /^https:\/\/([a-z0-9-]+\.)*workers\.dev$/i,
  /^https:\/\/([a-z0-9-]+\.)*netlify\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)*netlify\.com$/i,
  /^https:\/\/([a-z0-9-]+\.)*vercel\.app$/i,
  /^http:\/\/localhost(:\d+)?$/i,
];
const LOVABLE_RE = /^https?:\/\/([a-z0-9-]+\.)*(lovable\.app|lovable\.dev|lovableproject\.com)(:\d+)?$/i;

const isAllowedOrigin = (o: string | null) => !!o && ALLOWED_ORIGIN_PATTERNS.some((r) => r.test(o));
const cors = (o: string | null) => ({
  ...corsHeaders,
  "Access-Control-Allow-Origin": isAllowedOrigin(o) ? (o ?? "") : "",
  "Access-Control-Allow-Credentials": "true",
  "Vary": "Origin",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

const PLATFORMS = ["bkash", "nagad", "rocket", "upay", "card", "visa", "mastercard", "binance"];
const TTL_MS = 30 * 60 * 1000;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function secureToken(len = 25): string {
  // Rejection sampling for an unbiased pick from 62 chars.
  const out: string[] = [];
  const buf = new Uint8Array(64);
  while (out.length < len) {
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b < 248 && out.length < len) out.push(ALPHABET[b % 62]);
    }
  }
  return out.join("");
}

const normalize = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const h = cors(origin);
  const json = (d: unknown, s = 200) =>
    new Response(JSON.stringify(d), { status: s, headers: { ...h, "Content-Type": "application/json", "Cache-Control": "no-store" } });

  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!isAllowedOrigin(origin)) return json({ error: "forbidden" }, 403);

  const backend = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "start") {
      const nonce = String(body.nonce || "");
      if (nonce.length < 16 || nonce.length > 128) return json({ error: "invalid" }, 400);
      const referrer = String(body.referrer || "").slice(0, 500);

      // Trusted-referrer validation MUST pass before any token or session is created.
      // A missing/invalid referrer is always rejected (no origin-only bypass).
      let allowed = false;
      let refUrl: URL | null = null;
      try { refUrl = referrer ? new URL(referrer) : null; } catch { refUrl = null; }
      if (refUrl && /^https?:$/.test(refUrl.protocol)) {
        if (LOVABLE_RE.test(refUrl.origin)) allowed = true;
        if (!allowed) {
          const { data: sites } = await backend.from("allowed_websites").select("url");
          const nRef = normalize(referrer);
          const refHost = refUrl.hostname.toLowerCase();
          allowed = (sites ?? []).some((s: { url: string }) => {
            const n = normalize(s.url);
            if (!n) return false;
            if (nRef.startsWith(n)) return true;
            // Same domain or any subdomain of an allowed domain (www./*. ignored).
            const host = n.split(/[/:?#]/)[0].replace(/^\*\./, "").replace(/^www\./, "");
            return !!host && host.includes(".") && (refHost === host || refHost.endsWith(`.${host}`));
          });
        }
      }
      if (!allowed) {
        await backend.from("blocked_access_logs").insert({ referrer: referrer || "(empty)" });
        return json({ error: "referrer_not_allowed" }, 403);
      }

      // Preserve the trusted referrer's validated decimal text exactly. The
      // legacy integer column remains populated for backwards compatibility.
      const amountPattern = /^(0|[1-9]\d{0,8})(\.\d{1,8})?$/;
      let amountRaw = String(body.amount ?? "").trim();
      if (!amountPattern.test(amountRaw)) {
        try { amountRaw = new URL(referrer).searchParams.get("amount")?.trim() || ""; } catch { amountRaw = ""; }
      }
      const amountExact = amountPattern.test(amountRaw) ? amountRaw : "0";
      const amount = Math.trunc(Number(amountExact));
      let refOrigin = "";
      try { refOrigin = new URL(referrer).origin; } catch { /* ignore */ }
      const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim().slice(0, 64);
      const clientHash = await sha256(nonce);

      for (let i = 0; i < 5; i++) {
        const token = secureToken();
        const orderId = `ORD${Date.now().toString(36).toUpperCase()}${secureToken(6).toUpperCase()}`;
        const { error } = await backend.from("payment_sessions").insert({
          token, order_id: orderId, amount, amount_exact: amountExact, referrer, referrer_origin: refOrigin,
          client_hash: clientHash, ip, expires_at: new Date(Date.now() + TTL_MS).toISOString(),
        });
        if (!error) return json({ token });
        if (error.code !== "23505") throw error;
      }
      return json({ error: "token_generation_failed" }, 500);
    }

    const check = await checkFlowSession(backend, body.token, body.nonce);

    if (action === "validate") {
      if (!check.ok) return json({ valid: false, reason: check.reason });
      const s = check.session;
      const platform = body.platform ? String(body.platform) : null;
      if (platform && s.platform !== platform) return json({ valid: false, reason: "mismatch" });
      return json({
        valid: true,
        amount: s.amount_exact ?? String(s.amount),
        platform: s.platform,
        orderId: s.order_id,
        referrerOrigin: s.referrer_origin,
        expiresAt: s.expires_at,
      });
    }

    if (action === "bind") {
      if (!check.ok) return json({ ok: false, reason: check.reason }, 403);
      const platform = String(body.platform || "");
      if (!PLATFORMS.includes(platform)) return json({ error: "invalid_platform" }, 400);
      await backend.from("payment_sessions").update({ platform }).eq("id", check.session.id).eq("status", "active");
      return json({ ok: true });
    }

    if (action === "complete") {
      if (!check.ok) return json({ ok: false, reason: check.reason });
      await backend.from("payment_sessions")
        .update({ status: "used", used_at: new Date().toISOString() })
        .eq("id", check.session.id).eq("status", "active");
      return json({ ok: true, amount: check.session.amount_exact ?? String(check.session.amount), referrerOrigin: check.session.referrer_origin });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error("flow-session error", (e as Error)?.message);
    return json({ error: "request_failed" }, 400);
  }
});
