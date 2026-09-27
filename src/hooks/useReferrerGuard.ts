import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BLOCK_FLAG_KEY = "genz_access_blocked_v1";
const ALLOWED_REFERRER_KEY = "genz_allowed_referrer_origin_v1";

function normalizeUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
}

export function isLovableHost(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return ["lovable.app", "lovable.dev", "lovableproject.com"].some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

function isBlocked(): boolean {
  try {
    return sessionStorage.getItem(BLOCK_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function markAccessBlocked() {
  try {
    sessionStorage.setItem(BLOCK_FLAG_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function storeAllowedReferrerOrigin(ref: string) {
  try {
    const origin = new URL(ref).origin;
    // Never store this site itself — "back" must leave to the real referring website.
    if (origin && origin !== window.location.origin) sessionStorage.setItem(ALLOWED_REFERRER_KEY, origin);
  } catch {
    /* ignore */
  }
}

export function isAccessBlocked(): boolean {
  try { return sessionStorage.getItem(BLOCK_FLAG_KEY) === "1"; } catch { return false; }
}

export function clearAccessBlocked() {
  try { sessionStorage.removeItem(BLOCK_FLAG_KEY); } catch { /* ignore */ }
}

/** Leave to the referring website; if unknown, stay on the cancel page. */
export function exitToReferrer() {
  const origin = getAllowedReferrerOrigin();
  if (origin && origin !== window.location.origin) window.location.replace(origin);
  else if (window.location.pathname !== "/payment-cancelled") window.location.replace("/payment-cancelled");
}

export function getAllowedReferrerOrigin(): string | null {
  try {
    return sessionStorage.getItem(ALLOWED_REFERRER_KEY);
  } catch {
    return null;
  }
}

function redirectToCancelled() {
  markAccessBlocked();
  window.location.replace("/payment-cancelled");
}

export const REF_AMOUNT_KEY = "genz_ref_amount_v1";

export function getReferrerAmount(): string | null {
  try {
    return sessionStorage.getItem(REF_AMOUNT_KEY);
  } catch {
    return null;
  }
}

/**
 * Follow the amount carried by the allowed referring website.
 * If the current URL has no `amount` param but the referrer does,
 * adopt it (URL + session fallback) so the gateway pays the same amount.
 */
function adoptAmountFromReferrer(ref: string) {
  try {
    const refUrl = new URL(ref);
    const refAmount = refUrl.searchParams.get("amount");
    if (!refAmount || !/^\d+$/.test(refAmount)) return;
    sessionStorage.setItem(REF_AMOUNT_KEY, refAmount);
    const current = new URL(window.location.href);
    if (current.searchParams.get("amount")) return;
    current.searchParams.set("amount", refAmount);
    window.history.replaceState(null, "", current.toString());
  } catch {
    /* ignore */
  }
}

export function useReferrerGuard() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const onLovable = isLovableHost(window.location.origin);

    async function checkAccess() {
      // Never guard the cancellation page itself (avoid redirect loop).
      if (window.location.pathname === "/payment-cancelled") {
        setChecking(false);
        return;
      }

      // Lovable preview/editor hosts are always allowed — clear any stale block.
      if (onLovable) {
        try { sessionStorage.removeItem(BLOCK_FLAG_KEY); } catch { /* ignore */ }
        if (!cancelled) setChecking(false);
        return;
      }

      // Once the visitor has been sent to the cancellation page, keep them
      // blocked for the rest of the tab session — including bfcache back-nav.
      if (isBlocked()) {
        redirectToCancelled();
        return;
      }

      try {
        const ref = document.referrer || "";
        const normalizedRef = normalizeUrl(ref);
        const currentOrigin = normalizeUrl(window.location.origin);

        if (ref && normalizedRef.startsWith(currentOrigin)) {
          storeAllowedReferrerOrigin(ref);
          adoptAmountFromReferrer(ref);
          if (!cancelled) setChecking(false);
          return;
        }

        if (ref && isLovableHost(ref)) {
          storeAllowedReferrerOrigin(ref);
          adoptAmountFromReferrer(ref);
          if (!cancelled) setChecking(false);
          return;
        }

        const { data: isAllowedRpc, error: refErr } = await supabase
          .rpc("is_referrer_allowed", { _referrer: normalizedRef });

        const isAllowed = !!ref && !refErr && isAllowedRpc === true;

        if (!isAllowed) {
          await supabase.from("blocked_access_logs").insert({
            referrer: (ref || "(empty)").slice(0, 500),
          });
          redirectToCancelled();
          return;
        }

        storeAllowedReferrerOrigin(ref);
        adoptAmountFromReferrer(ref);
        if (!cancelled) setChecking(false);
      } catch {
        redirectToCancelled();
      }
    }

    checkAccess();

    // Re-check when the tab is restored from bfcache (back/forward nav).
    const onPageShow = (e: PageTransitionEvent) => {
      if (window.location.pathname === "/payment-cancelled") return;
      if (onLovable) return;
      if (isBlocked() || e.persisted) {
        redirectToCancelled();
      }
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return { checking };
}
