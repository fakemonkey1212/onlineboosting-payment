/**
 * Single entry point for every server call.
 * On the production custom domain the browser only talks to same-origin `/api/<fn>`
 * (rewritten by the host to the backend), so no backend address appears in requests.
 * Preview/hosted domains without rewrite support call the backend directly.
 */
const DIRECT_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const usesProxy = () => {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return !(h === "localhost" || h === "127.0.0.1" || h.endsWith(".lovable.app") || h.endsWith(".lovableproject.com"));
};

export const apiBase = () => (usesProxy() ? "/api" : DIRECT_BASE);

export const apiHeaders = (): Record<string, string> =>
  usesProxy()
    ? { "Content-Type": "application/json" }
    : { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` };

export async function invokeApi<T = unknown>(
  fn: string,
  opts: { body?: unknown } = {},
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const res = await fetch(`${apiBase()}/${fn}`, {
      method: "POST",
      // Public/flow requests do not use admin cookies. Keep same-origin
      // proxy cookies without requesting cross-origin credentials in preview.
      credentials: "same-origin",
      headers: apiHeaders(),
      body: JSON.stringify(opts.body ?? {}),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { data: null, error: new Error(`${res.status} ${(data as { error?: string })?.error || "request_failed"}`) };
    return { data: data as T, error: null };
  } catch (e) {
    return { data: null, error: new Error((e as Error)?.message || "failed to fetch") };
  }
}
