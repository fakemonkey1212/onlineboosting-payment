// deno-lint-ignore-file no-explicit-any
export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

const TOKEN_RE = /^[A-Za-z0-9]{25}$/;

export type SessionCheck =
  | { ok: true; session: any }
  | { ok: false; reason: "invalid" | "expired" | "used" | "mismatch" };

/** Server-side validation: token exists, belongs to this browser, unexpired, and (optionally) unused. */
export async function checkFlowSession(
  backend: any,
  token: unknown,
  nonce: unknown,
  opts: { allowUsedWithinMs?: number; allowExpiredWithinMs?: number } = {},
): Promise<SessionCheck> {
  if (typeof token !== "string" || !TOKEN_RE.test(token)) return { ok: false, reason: "invalid" };
  if (typeof nonce !== "string" || nonce.length < 16 || nonce.length > 128) return { ok: false, reason: "mismatch" };
  const { data } = await backend.from("payment_sessions").select("*").eq("token", token).maybeSingle();
  if (!data) return { ok: false, reason: "invalid" };
  if (data.client_hash !== (await sha256(nonce))) return { ok: false, reason: "mismatch" };
  if (data.status !== "active") {
    const grace = opts.allowUsedWithinMs ?? 0;
    if (grace > 0 && data.used_at && Date.now() - new Date(data.used_at).getTime() < grace) {
      return { ok: true, session: data };
    }
    return { ok: false, reason: "used" };
  }
  if (new Date(data.expires_at).getTime() < Date.now()) {
    const grace = opts.allowExpiredWithinMs ?? 0;
    if (grace > 0 && Date.now() - new Date(data.expires_at).getTime() < grace) {
      return { ok: true, session: data };
    }
    return { ok: false, reason: "expired" };
  }
  return { ok: true, session: data };
}
