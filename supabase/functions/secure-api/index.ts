import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminSession } from "../_shared/adminSession.ts";

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/(www\.)?genzsmm\.com$/i,
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
  const allow = isAllowedOrigin(origin) ? origin! : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info, x-csrf-token, x-admin-session",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const rateBuckets = new Map<string, { count: number; ts: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 90;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.ts > RATE_WINDOW_MS) {
    rateBuckets.set(ip, { count: 1, ts: now });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

function text(value: unknown, max = 200): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2028\u2029]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function json(data: unknown, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsFor(origin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);
  if (!isAllowedOrigin(origin)) return json({ error: "forbidden" }, 403, cors);

  const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  const clientIp = String(rawIp).split(",")[0].trim();
  if (rateLimited(clientIp)) return json({ error: "rate_limited" }, 429, cors);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) return json({ error: "not_configured" }, 500, cors);

  try {
    const body = await req.json();
    const action = text(body.action, 64);
    const backend = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-application-name": "genz-secure-api" } },
    });

    const callRpc = async (name: string, args: Record<string, unknown> = {}) => {
      const { data, error } = await backend.rpc(name, args);
      if (error) {
        console.error(`rpc ${name} failed:`, error.message, error.details, error.hint, error.code);
        throw new Error(error.message || "request_failed");
      }
      return data;
    };

    if (action === "getEnabledPaymentMethods") {
      const rows = await callRpc("get_enabled_payment_methods");
      const enabledIds = Array.isArray(rows)
        ? rows
            .filter((row) => row && typeof row === "object" && row.enabled === true && typeof row.id === "string")
            .map((row) => row.id)
        : [];
      return json({ data: enabledIds }, 200, cors);
    }

    // ---------------- Admin actions: server-side session required ----------------
    if (action.startsWith("admin")) {
      const session = await requireAdminSession(req, backend);
      if (!session.ok) return json({ error: "unauthorized" }, session.status, cors);

      const PAYMENT_IDS = new Set(["bkash", "nagad", "rocket", "upay", "card", "visa", "mastercard", "binance"]);
      const RESERVED_KEYS = new Set(["admin_email", "admin_password", "support_gate_number"]);
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const KEY_RE = /^[a-z0-9_\-]{1,80}$/i;
      const validUrl = (u: string) => {
        try { const p = new URL(u); return p.protocol === "https:" || p.protocol === "http:"; } catch { return false; }
      };
      const bad = () => json({ error: "invalid_input" }, 400, cors);
      const revokeOthers = async () => {
        await backend.from("admin_sessions")
          .update({ revoked_at: new Date().toISOString() })
          .is("revoked_at", null)
          .neq("id", session.sessionId);
      };

      if (action === "adminListPaymentMethods") {
        const { data, error } = await backend.from("payment_methods").select("id, enabled").order("id");
        if (error) throw error;
        return json({ data: data ?? [] }, 200, cors);
      }

      if (action === "adminSetPaymentMethodEnabled") {
        const id = text(body.id, 40);
        if (!PAYMENT_IDS.has(id) || typeof body.enabled !== "boolean") return bad();
        const { error } = await backend.from("payment_methods")
          .update({ enabled: body.enabled, updated_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
        return json({ data: true }, 200, cors);
      }

      if (action === "adminSetAppSetting") {
        const key = text(body.key, 80);
        if (!KEY_RE.test(key) || RESERVED_KEYS.has(key)) return bad();
        if (typeof body.value !== "string" || body.value.length > 400000) return bad();
        const { error } = await backend.from("app_settings")
          .upsert({ key, value: body.value, updated_at: new Date().toISOString() }, { onConflict: "key" });
        if (error) throw error;
        return json({ data: true }, 200, cors);
      }

      if (action === "adminListAllowedWebsites") {
        const { data, error } = await backend.from("allowed_websites").select("id, url, created_at").order("created_at");
        if (error) throw error;
        return json({ data: data ?? [] }, 200, cors);
      }

      if (action === "adminAddAllowedWebsite") {
        const u = text(body.url, 500);
        if (!validUrl(u)) return bad();
        const { error } = await backend.from("allowed_websites").insert({ url: u });
        if (error) throw error;
        return json({ data: true }, 200, cors);
      }

      if (action === "adminUpdateAllowedWebsite") {
        const id = text(body.id, 40); const u = text(body.url, 500);
        if (!UUID_RE.test(id) || !validUrl(u)) return bad();
        const { error } = await backend.from("allowed_websites").update({ url: u }).eq("id", id);
        if (error) throw error;
        return json({ data: true }, 200, cors);
      }

      if (action === "adminDeleteAllowedWebsite") {
        const id = text(body.id, 40);
        if (!UUID_RE.test(id)) return bad();
        const { error } = await backend.from("allowed_websites").delete().eq("id", id);
        if (error) throw error;
        return json({ data: true }, 200, cors);
      }

      if (action === "adminListBlockedLogs") {
        const { data, error } = await backend.from("blocked_access_logs")
          .select("id, referrer, blocked_at").order("blocked_at", { ascending: false }).limit(50);
        if (error) throw error;
        return json({ data: data ?? [] }, 200, cors);
      }

      if (action === "adminClearBlockedLogs") {
        const { error } = await backend.from("blocked_access_logs").delete().not("id", "is", null);
        if (error) throw error;
        return json({ data: true }, 200, cors);
      }

      if (action === "adminUpdateSecrets") {
        const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
        if (newPassword && (newPassword.length < 8 || newPassword.length > 200)) return bad();
        const newEmail = text(body.newEmail, 200);
        if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return bad();
        const newSupport = text(body.newSupport, 40);
        if (newSupport && !/^[0-9+]{4,20}$/.test(newSupport)) return bad();
        const ok = await callRpc("update_admin_secrets", {
          _current_password: text(body.currentPassword, 200),
          _new_email: newEmail || null,
          _new_password: newPassword || null,
          _new_support: newSupport || null,
        });
        if (ok === true && (newPassword || newEmail)) await revokeOthers();
        return json({ data: ok === true }, 200, cors);
      }

      if (action === "adminUpdateTelegram") {
        const newBotToken = text(body.newBotToken, 200);
        const newChatId = text(body.newChatId, 80);
        if (newBotToken && !/^\d{5,15}:[A-Za-z0-9_-]{20,100}$/.test(newBotToken)) return bad();
        if (newChatId && !/^-?\d{3,20}$|^@[A-Za-z0-9_]{4,64}$/.test(newChatId)) return bad();
        const result = await callRpc("admin_update_telegram", {
          _current_password: text(body.currentPassword, 200),
          _new_bot_token: newBotToken || null,
          _new_chat_id: newChatId || null,
        });
        // Best-effort: re-register the Telegram webhook with the derived secret.
        if (result === true) {
          try {
            const { data: rows } = await backend.from("admin_secrets").select("key, value").eq("key", "telegram_bot_token");
            const botToken = String(rows?.[0]?.value || "").trim();
            if (botToken) {
              const projectRef = (url || "").match(/https:\/\/([^.]+)/)?.[1];
              const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/telegram-webhook`;
              const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`telegram-webhook:${botToken}`));
              const secret = btoa(String.fromCharCode(...new Uint8Array(digest)))
                .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
              await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: webhookUrl, secret_token: secret, allowed_updates: ["callback_query"], drop_pending_updates: false }),
              });
            }
          } catch (e) {
            console.warn("webhook re-register failed:", (e as Error)?.message);
          }
        }
        return json({ data: result === true }, 200, cors);
      }

      if (action === "adminTelegramStatus") {
        const { data } = await backend.from("admin_secrets").select("key, value")
          .in("key", ["telegram_bot_token", "telegram_chat_id"]);
        const map = new Map((data ?? []).map((r: { key: string; value: string }) => [r.key, (r.value || "").trim()]));
        return json({ data: { bot: !!map.get("telegram_bot_token"), chat: !!map.get("telegram_chat_id") } }, 200, cors);
      }

      return json({ error: "unknown_action" }, 400, cors);
    }

    if (action === "getPublicAppSetting") {
      // Public read: never fail the client — unknown/blocked keys resolve to null.
      try {
        const value = await callRpc("get_public_app_setting", { _key: text(body.key, 80) });
        return json({ data: value ?? null }, 200, cors);
      } catch (_e) {
        return json({ data: null }, 200, cors);
      }
    }


    if (action === "verifySupportGate") {
      // Anti-enumeration: uniform response shape and timing; locked-out callers
      // always get `false` (even for the right number), so lockout and wrong
      // guesses are indistinguishable. Numbers are logged only as hashes.
      const started = Date.now();
      const finish = async (ok: boolean) => {
        const wait = 700 + Math.floor(Math.random() * 300) - (Date.now() - started);
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        return json({ data: ok }, 200, cors);
      };
      const number = text(body.number, 40);
      const clientId = text(body.clientId, 12).replace(/[^A-Z0-9]/g, "");
      if (!/^01\d{9}$/.test(number)) return finish(false);

      const since15 = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const countFails = async (col: "ip" | "client_id", val: string, since: string) => {
        if (!val) return 0;
        const { count } = await backend.from("support_gate_attempts")
          .select("id", { count: "exact", head: true })
          .eq(col, val).eq("success", false).gte("created_at", since);
        return count ?? 0;
      };
      const [ip15, ip24, cl15, cl24] = await Promise.all([
        countFails("ip", clientIp, since15), countFails("ip", clientIp, since24),
        countFails("client_id", clientId, since15), countFails("client_id", clientId, since24),
      ]);
      // 5 fails / 15 min -> 15 min lockout; 10 fails / 24 h -> 24 h lockout (per IP and per browser).
      const locked = ip15 >= 5 || cl15 >= 5 || ip24 >= 10 || cl24 >= 10;

      let ok = false;
      if (!locked) {
        try { ok = (await callRpc("verify_support_gate", { _number: number })) === true; } catch { ok = false; }
      }
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`sg:${number}`));
      const numberHash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
      await backend.from("support_gate_attempts").insert({
        ip: clientIp.slice(0, 64), client_id: clientId, number_hash: numberHash, success: ok,
      });
      if (locked) console.warn("support gate locked", { ipFails15: ip15, clientFails15: cl15 });
      return finish(ok);
    }

    return json({ error: "unknown_action" }, 400, cors);
  } catch (err) {
    console.error("secure-api error:", (err as Error)?.message, (err as Error)?.stack);
    return json({ error: "request_failed" }, 400, cors);
  }
});