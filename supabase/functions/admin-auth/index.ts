import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ABSOLUTE_TTL_MS,
  randomToken,
  requireAdminSession,
  sessionCookie,
  sessionTokenFrom,
  sha256,
} from "../_shared/adminSession.ts";

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/(www\.)?genzsmm\.com$|^https:\/\/pay\.genzsmm\.com$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovable\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovableproject\.com$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovable\.dev$/i,
  /^https:\/\/([a-z0-9-]+\.)*pages\.dev$/i,
  /^https:\/\/([a-z0-9-]+\.)*workers\.dev$/i,
  /^https:\/\/([a-z0-9-]+\.)*netlify\.app$/i,
  /^http:\/\/localhost(:\d+)?$/i,
];

const isAllowedOrigin = (origin: string | null) => !!origin && ALLOWED_ORIGIN_PATTERNS.some((r) => r.test(origin));

function corsFor(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin! : "",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
    "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info, x-csrf-token, x-admin-session",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(data: unknown, status: number, headers: HeadersInit, cookie?: string) {
  const h = new Headers({ ...(headers as Record<string, string>) });
  h.set("Content-Type", "application/json");
  h.set("Cache-Control", "no-store");
  if (cookie) h.append("Set-Cookie", cookie);
  return new Response(JSON.stringify(data), { status, headers: h });
}

const clean = (v: unknown, max = 200) =>
  v === null || v === undefined
    ? ""
    : String(v)
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .trim()
        .slice(0, max);

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsFor(origin);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);
  if (!isAllowedOrigin(origin)) return json({ error: "forbidden" }, 403, cors);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) return json({ error: "not_configured" }, 500, cors);

  const backend = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ip = String(req.headers.get("x-forwarded-for") || "unknown")
    .split(",")[0]
    .trim();
  const userAgent = clean(req.headers.get("user-agent"), 300);

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    /* empty body ok */
  }
  const action = clean(body.action, 32);

  try {
    if (action === "login") {
      const email = clean(body.email, 200).toLowerCase();
      const password = clean(body.password, 200);
      if (!email || !password) return json({ error: "invalid_credentials" }, 401, cors);

      const since = new Date(Date.now() - WINDOW_MS).toISOString();
      const { count } = await backend
        .from("admin_login_attempts")
        .select("id", { count: "exact", head: true })
        .eq("success", false)
        .gte("created_at", since)
        .or(`ip.eq.${ip},email.eq.${email}`);
      if ((count ?? 0) >= MAX_ATTEMPTS) {
        return json({ error: "too_many_attempts" }, 429, cors);
      }

      const { data: ok, error } = await backend.rpc("verify_admin_login", {
        _email: email,
        _password: password,
      });
      if (error) console.error("verify_admin_login failed:", error.message);

      await backend.from("admin_login_attempts").insert({ ip, email, success: ok === true });

      if (ok !== true) return json({ error: "invalid_credentials" }, 401, cors);

      const token = randomToken(32);
      const csrf = randomToken(32);
      const expiresAt = new Date(Date.now() + ABSOLUTE_TTL_MS).toISOString();
      const { error: insErr } = await backend.from("admin_sessions").insert({
        token_hash: await sha256(token),
        csrf_hash: await sha256(csrf),
        ip,
        user_agent: userAgent,
        expires_at: expiresAt,
      });
      if (insErr) {
        console.error("session insert failed:", insErr.message);
        return json({ error: "request_failed" }, 500, cors);
      }
      return json(
        { data: { token, csrf, expiresAt } },
        200,
        cors,
        sessionCookie(token, Math.floor(ABSOLUTE_TTL_MS / 1000)),
      );
    }

    if (action === "logout") {
      const token = sessionTokenFrom(req);
      if (token) {
        await backend
          .from("admin_sessions")
          .update({ revoked_at: new Date().toISOString() })
          .eq("token_hash", await sha256(token))
          .is("revoked_at", null);
      }
      return json({ data: true }, 200, cors, sessionCookie("", 0));
    }

    if (action === "session") {
      // Resume after reload: the HttpOnly cookie (or in-memory bearer) proves the
      // session; the strict Origin allow-list + CORS stop cross-site reads, and
      // a fresh CSRF token is rotated in for subsequent admin calls.
      const check = await requireAdminSession(req, backend, { csrf: false });
      if (!check.ok) return json({ data: null }, 200, cors);
      const csrf = randomToken(32);
      await backend
        .from("admin_sessions")
        .update({ csrf_hash: await sha256(csrf) })
        .eq("id", check.sessionId);
      return json({ data: { csrf } }, 200, cors);
    }

    return json({ error: "unknown_action" }, 400, cors);
  } catch (err) {
    console.error("admin-auth error:", (err as Error)?.message);
    return json({ error: "request_failed" }, 400, cors);
  }
});
