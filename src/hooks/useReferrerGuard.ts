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
      try {
        const { data: allowedSites } = await supabase
          .from("allowed_websites")
          .select("url");

        // If no allowed sites configured, allow access (open mode)
        if (!allowedSites || allowedSites.length === 0) {
          setChecking(false);
          return;
        }

        const ref = document.referrer || "";
        const normalizedRef = normalizeUrl(ref);

        // Allow same-origin navigation (internal page transitions)
        const currentOrigin = normalizeUrl(window.location.origin);
        if (normalizedRef.startsWith(currentOrigin)) {
          setChecking(false);
          return;
        }

        // Always allow Lovable preview/editor domains (for admin access)
        if (isLovableHost(window.location.origin) || isLovableHost(ref)) {
          setChecking(false);
          return;
        }


        const isAllowed = allowedSites.some((site) => {
          const normalizedSite = normalizeUrl(site.url);
          return normalizedRef.startsWith(normalizedSite);
        });

        if (!isAllowed) {
          // Log blocked attempt
          await supabase.from("blocked_access_logs").insert({
            referrer: ref || "(empty)",
          });
          window.location.replace("/payment-cancelled");
          return;
        }

        setChecking(false);
      } catch {
        // On error, allow access to not break the site
        setChecking(false);
      }
    }

    checkAccess();
  }, []);

  return { checking };
}
