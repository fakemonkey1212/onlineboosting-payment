import { bumpAssetVersion } from "@/lib/assetVersion";
import { useEffect, useState } from "react";
import { getPublicAppSetting } from "@/lib/backend-api";
import { supabase } from "@/integrations/supabase/client";
import { subscribeAppSettingsUpdate } from "@/lib/appSettingsSync";
import { readDisplaySetting } from "@/lib/publicDisplaySettings";

type Info = { merchant: string; inv: string; logo?: string };

/**
 * Reads admin-editable merchant name + invoice/ref from `app_settings`
 * via the public `get_public_app_setting` RPC. Values fall back to
 * `defaults` when unset or on error. Cached in localStorage per method
 * so the visible values do not flicker between navigations.
 */
export const useMerchantInfo = (methodId: string, defaults: Info): Info => {
  // Per product rule: never fall back to hardcoded merchant/inv defaults.
  // Only `logo` may use a default.
  const effectiveDefaults: Info = { merchant: "", inv: "", logo: defaults.logo };
  const cacheKey = `merchant_info_${methodId}`;
  const cached: Info = {
    merchant: readDisplaySetting(`merchant_${methodId}`) ?? "",
    inv: readDisplaySetting(`inv_${methodId}`) ?? "",
    logo: readDisplaySetting(`logo_${methodId}`) || defaults.logo,
  };
  const [info, setInfo] = useState<Info>(cached ?? effectiveDefaults);

  useEffect(() => {
    let cancelled = false;
    let lastLocalUpdate = 0;
    const merchantKey = `merchant_${methodId}`;
    const invKey = `inv_${methodId}`;
    const logoKey = `logo_${methodId}`;

    const persist = (next: Info) => {
      setInfo(next);
      try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
    };

    const applyValues = (values: Record<string, string>) => {
      if (!(merchantKey in values) && !(invKey in values) && !(logoKey in values)) return;
      lastLocalUpdate = Date.now();
      if (logoKey in values) bumpAssetVersion();
      setInfo((prev) => {
        const next: Info = {
          merchant: merchantKey in values ? (String(values[merchantKey]).trim() || "") : prev.merchant,
          inv: invKey in values ? (String(values[invKey]).trim() || "") : prev.inv,
          logo: logoKey in values ? (String(values[logoKey]).trim() || defaults.logo) : prev.logo,
        };
        try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
        return next;
      });
    };

    const refresh = async () => {
      const startedAt = Date.now();
      try {
        const [mData, iData, lData] = await Promise.all([
          getPublicAppSetting(merchantKey),
          getPublicAppSetting(invKey),
          getPublicAppSetting(logoKey),
        ]);
        if (cancelled || startedAt < lastLocalUpdate) return;
        persist({
          merchant: (mData && String(mData).trim()) || "",
          inv: (iData && String(iData).trim()) || "",
          logo: (lData && String(lData).trim()) || defaults.logo,
        });
      } catch {}
    };

    const unsubscribeLocal = subscribeAppSettingsUpdate(applyValues);
    void refresh();
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    const poll = window.setInterval(refresh, 30000);

    const channel = supabase.channel('app_settings_sync', {
      config: { broadcast: { self: false } },
    });
    channel
      .on('broadcast', { event: 'update' }, (msg) => {
        const values = ((msg as { payload?: { values?: Record<string, string> } })?.payload?.values) ?? {};
        applyValues(values);
      })
      .subscribe();

    return () => {
      cancelled = true;
      unsubscribeLocal();
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisibility);
      supabase.removeChannel(channel);
    };
  }, [methodId, defaults.logo]);

  return info;
};
