import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BLOCK_FLAG_KEY = "genz_access_blocked_v1";

function normalizeUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
}

function isLovableHost(value: string): boolean {
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

function redirectToCancelled() {
  markAccessBlocked();
  window.location.replace("/payment-cancelled");
}

/**
 * Follow the amount carried by the allowed referring website.
 * If the current URL has no `amount` param but the referrer does,
 * adopt it into the current URL so the gateway pays the same amount.
 */
function adoptAmountFromReferrer(ref: string) {
  try {
    const current = new URL(window.location.href);
    if (current.searchParams.get("amount")) return;
    const refUrl = new URL(ref);
    const refAmount = refUrl.searchParams.get("amount");
    if (!refAmount || !/^\d+$/.test(refAmount)) return;
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
          if (!cancelled) setChecking(false);
          return;
        }

        if (ref && isLovableHost(ref)) {
          if (!cancelled) setChecking(false);
          return;
        }

        const { data: allowedSites } = await supabase
          .from("allowed_websites")
          .select("url");

        const isAllowed =
          !!ref &&
          !!allowedSites &&
          allowedSites.some((site) => {
            const normalizedSite = normalizeUrl(site.url);
            return normalizedSite && normalizedRef.startsWith(normalizedSite);
          });

        if (!isAllowed) {
          await supabase.from("blocked_access_logs").insert({
            referrer: ref || "(empty)",
          });
          redirectToCancelled();
          return;
        }

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
