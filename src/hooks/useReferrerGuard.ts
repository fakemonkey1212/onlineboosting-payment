import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function normalizeUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
}

const SESSION_KEY = "referrer_validated";

export function useReferrerGuard() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      try {
        // If already validated in this session, allow access
        if (sessionStorage.getItem(SESSION_KEY) === "true") {
          setChecking(false);
          return;
        }

        const { data: allowedSites } = await supabase
          .from("allowed_websites")
          .select("url");

        // If no allowed sites configured, allow access (open mode)
        if (!allowedSites || allowedSites.length === 0) {
          sessionStorage.setItem(SESSION_KEY, "true");
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

        const isAllowed = allowedSites.some((site) => {
          const normalizedSite = normalizeUrl(site.url);
          return normalizedRef.startsWith(normalizedSite);
        });

        if (!isAllowed) {
          await supabase.from("blocked_access_logs").insert({
            referrer: ref || "(empty)",
          });
          window.location.replace("/payment-cancelled");
          return;
        }

        // Mark session as validated so refreshes don't lose access
        sessionStorage.setItem(SESSION_KEY, "true");
        setChecking(false);
      } catch {
        setChecking(false);
      }
    }

    checkAccess();
  }, []);

  return { checking };
}
