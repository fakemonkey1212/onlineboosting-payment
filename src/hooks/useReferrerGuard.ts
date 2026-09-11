import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useReferrerGuard() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      // Never guard the cancellation page itself (avoid redirect loop).
      if (window.location.pathname === "/payment-cancelled") {
        setChecking(false);
        return;
      }
      try {
        const ref = document.referrer || "";
        const normalizedRef = normalizeUrl(ref);
        const currentOrigin = normalizeUrl(window.location.origin);

        // Allow same-origin navigation (internal page transitions)
        if (ref && normalizedRef.startsWith(currentOrigin)) {
          setChecking(false);
          return;
        }

        // Always allow Lovable preview/editor domains (for admin access)
        if (isLovableHost(window.location.origin) || (ref && isLovableHost(ref))) {
          setChecking(false);
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
          window.location.replace("/payment-cancelled");
          return;
        }

        setChecking(false);
      } catch {
        window.location.replace("/payment-cancelled");
      }
    }

    checkAccess();
  }, []);

  return { checking };
}
