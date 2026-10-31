/** Base64url is transport encoding, not authorization or a payment signature. */
export function readRedirectAmount(search: string): { amount: string | null; invalid: boolean } {
  const params = new URLSearchParams(search);
  if (!params.has("ref")) return { amount: params.get("amount"), invalid: false };
  try {
    const ref = params.get("ref") || "";
    if (ref.length > 4096 || !/^[A-Za-z0-9_-]+={0,2}$/.test(ref)) throw new Error("invalid_ref");
    const b64 = ref.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
    const payload: unknown = JSON.parse(atob(b64 + "=".repeat((4 - b64.length % 4) % 4)));
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("invalid_payload");
    const raw = (payload as Record<string, unknown>).amount;
    if (typeof raw !== "string" && typeof raw !== "number") throw new Error("invalid_amount");
    const amount = typeof raw === "string" ? raw : String(raw);
    if (!/^(0|[1-9]\d{0,8})(\.\d{1,8})?$/.test(amount) || Number(amount) <= 0) throw new Error("invalid_amount");
    return { amount, invalid: false };
  } catch {
    return { amount: null, invalid: true };
  }
}

export function removeRedirectRef() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("ref")) return;
  url.searchParams.delete("ref");
  // Keep router history state, other query parameters and the fragment intact.
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}