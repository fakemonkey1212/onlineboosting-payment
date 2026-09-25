import { useEffect, useState } from "react";
import { getPublicAppSetting } from "@/lib/backend-api";
import { supabase } from "@/integrations/supabase/client";
import { subscribeAppSettingsUpdate } from "@/lib/appSettingsSync";
import { bumpAssetVersion } from "@/lib/assetVersion";

type GatewayBranding = { name: string; logo: string };

const NAME_CACHE_KEY = "genz_gateway_name";
const LOGO_CACHE_KEY = "genz_gateway_logo";

const getCachedBranding = (): GatewayBranding => {
  if (typeof window === "undefined") return { name: "", logo: "" };
  return {
    name: localStorage.getItem(NAME_CACHE_KEY) ?? "",
    logo: localStorage.getItem(LOGO_CACHE_KEY) ?? "",
  };
};

export const useGatewayBranding = (): GatewayBranding => {
  const [branding, setBranding] = useState<GatewayBranding>(getCachedBranding);

  useEffect(() => {
    let cancelled = false;
    let lastLiveUpdate = 0;

    const persist = (next: GatewayBranding) => {
      setBranding(next);
      try {
        localStorage.setItem(NAME_CACHE_KEY, next.name);
        localStorage.setItem(LOGO_CACHE_KEY, next.logo);
      } catch {}
    };

    const applyValues = (values: Record<string, string>) => {
      if (!("gateway_name" in values) && !("gateway_logo" in values)) return;
      lastLiveUpdate = Date.now();
      bumpAssetVersion();
      setBranding((current) => {
        const next = {
          name: "gateway_name" in values ? String(values.gateway_name ?? "").trim() : current.name,
          logo: "gateway_logo" in values ? String(values.gateway_logo ?? "").trim() : current.logo,
        };
        try {
          localStorage.setItem(NAME_CACHE_KEY, next.name);
          localStorage.setItem(LOGO_CACHE_KEY, next.logo);
        } catch {}
        return next;
      });
    };

    const refresh = async () => {
      const startedAt = Date.now();
      try {
        const [name, logo] = await Promise.all([
          getPublicAppSetting("gateway_name"),
          getPublicAppSetting("gateway_logo"),
        ]);
        if (cancelled || startedAt < lastLiveUpdate) return;
        persist({
          name: name ? String(name).trim() : "",
          logo: logo ? String(logo).trim() : "",
        });
      } catch {}
    };

    void refresh();
    const unsubscribeLocal = subscribeAppSettingsUpdate(applyValues);
    const poll = window.setInterval(refresh, 3000);
    const channel = supabase
      .channel("gateway_branding_sync")
      .on("broadcast", { event: "update" }, (message) => {
        const values = ((message as { payload?: { values?: Record<string, string> } }).payload?.values) ?? {};
        applyValues(values);
      })
      .subscribe();

    return () => {
      cancelled = true;
      unsubscribeLocal();
      window.clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, []);

  return branding;
};