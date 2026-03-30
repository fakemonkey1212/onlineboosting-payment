import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function normalizeUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
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
