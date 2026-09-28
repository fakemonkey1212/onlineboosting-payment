// Shared admin session helpers. Sessions live server-side only; the browser
// holds an opaque random token (HttpOnly cookie + in-memory bearer fallback).

export const SESSION_COOKIE = "genz_admin_session";
export const ABSOLUTE_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
export const IDLE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function readCookie(req: Request, name: string): string {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export function sessionTokenFrom(req: Request): string {
  const header = req.headers.get("x-admin-session") || "";
  if (header) return header.trim();
  return readCookie(req, SESSION_COOKIE);
}

export function sessionCookie(token: string, maxAgeSeconds: number): string {
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=None",
    `Max-Age=${maxAgeSeconds}`,
  ].join("; ");
}

export type AdminSessionCheck =
  | { ok: true; sessionId: string }
  | { ok: false; status: number; reason: string };

/**
 * Validates the admin session on every admin request: token must exist, not be
 * revoked, be within the absolute expiry and the idle window, and be
 * accompanied by a matching CSRF token (double submit). Slides last_seen_at.
 */
// deno-lint-ignore no-explicit-any
export async function requireAdminSession(req: Request, backend: any, opts: { csrf?: boolean } = {}): Promise<AdminSessionCheck> {
  const token = sessionTokenFrom(req);
  if (!token || token.length < 32 || token.length > 256) {
    return { ok: false, status: 401, reason: "no_session" };
  }
  const tokenHash = await sha256(token);
  const { data, error } = await backend
    .from("admin_sessions")
    .select("id, csrf_hash, expires_at, last_seen_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error || !data) return { ok: false, status: 401, reason: "invalid_session" };
  if (data.revoked_at) return { ok: false, status: 401, reason: "revoked" };

  const now = Date.now();
  if (new Date(data.expires_at).getTime() <= now) {
    await backend.from("admin_sessions").update({ revoked_at: new Date().toISOString() }).eq("id", data.id);
    return { ok: false, status: 401, reason: "expired" };
  }
  if (now - new Date(data.last_seen_at).getTime() > IDLE_TTL_MS) {
    await backend.from("admin_sessions").update({ revoked_at: new Date().toISOString() }).eq("id", data.id);
    return { ok: false, status: 401, reason: "idle_timeout" };
  }

  const csrf = (req.headers.get("x-csrf-token") || "").trim();
  if (opts.csrf === false) {
    await backend.from("admin_sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", data.id);
    return { ok: true, sessionId: String(data.id) };
  }
  if (!csrf) return { ok: false, status: 403, reason: "csrf_missing" };
  const csrfHash = await sha256(csrf);
  if (!timingSafeEqual(csrfHash, String(data.csrf_hash))) {
    return { ok: false, status: 403, reason: "csrf_invalid" };
  }

  await backend.from("admin_sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", data.id);
  return { ok: true, sessionId: String(data.id) };
}
