import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
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

    if (action === "adminListPaymentMethods") {
      const rows = await callRpc("admin_list_payment_methods", { _password: text(body.password, 200) });
      const safeRows = Array.isArray(rows) ? rows.map((row) => ({ id: row.id, enabled: row.enabled })) : [];
      return json({ data: safeRows }, 200, cors);
    }

    if (action === "verifyAdminLogin") {
      return json({ data: await callRpc("verify_admin_login", { _email: text(body.email, 200), _password: text(body.password, 200) }) }, 200, cors);
    }

    if (action === "adminSetPaymentMethodEnabled") {
      return json({ data: await callRpc("admin_set_payment_method_enabled", { _password: text(body.password, 200), _id: text(body.id, 40), _enabled: body.enabled === true }) }, 200, cors);
    }

    if (action === "adminSetAppSetting") {
      return json({ data: await callRpc("admin_set_app_setting", { _password: text(body.password, 200), _key: text(body.key, 80), _value: text(body.value, 400000) }) }, 200, cors);
    }

    if (action === "updateAdminSecrets") {
      return json({
        data: await callRpc("update_admin_secrets", {
          _current_password: text(body.currentPassword, 200),
          _new_email: text(body.newEmail, 200) || null,
          _new_password: text(body.newPassword, 200) || null,
          _new_support: text(body.newSupport, 40) || null,
        }),
      }, 200, cors);
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
      return json({ data: await callRpc("verify_support_gate", { _number: text(body.number, 40) }) }, 200, cors);
    }

    return json({ error: "unknown_action" }, 400, cors);
  } catch (err) {
    console.error("secure-api error:", (err as Error)?.message, (err as Error)?.stack);
    return json({ error: "request_failed" }, 400, cors);
  }
});