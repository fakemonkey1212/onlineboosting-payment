import { fetchEnabledPaymentMethodsFresh, fetchPublicAppSettingFresh, getPublicAppSetting, seedEnabledPaymentMethods } from "@/lib/backend-api";
import { bustImage } from "@/lib/assetVersion";
import { seedDisplaySetting } from "@/lib/publicDisplaySettings";

const preloaded = new Set<string>();
export const preloadImage = (src: string | null | undefined) => {
  const url = bustImage(src);
  if (!url || preloaded.has(url)) return url;
  preloaded.add(url);
  const img = new Image();
  img.decoding = "async";
  (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "high";
  img.src = url;
  return url;
};

const KEYS = ["gateway_name", "gateway_logo", "badge_color"];
type Bundle = { data?: { settings?: Record<string, unknown>; enabled?: unknown } } | null;

/**
 * Uses the fresh request started in index.html (one round-trip, no-store) and
 * shares it with every reader, so nothing waits for a second request and no
 * stale copy is ever shown. Falls back to individual requests if it failed.
 */
export const prefetchPublicDisplay = () => {
  const started = (window as unknown as { __displayBundle?: Promise<Bundle> }).__displayBundle;
  const bundle: Promise<Bundle> = started ?? Promise.resolve(null);
  KEYS.forEach((k) => seedDisplaySetting(k, bundle.then((b) => {
    const s = b?.data?.settings;
    if (!s) return fetchPublicAppSettingFresh(k);
    const v = s[k];
    return v == null ? null : String(v);
  })));
  seedEnabledPaymentMethods(bundle.then((b) => {
    const e = b?.data?.enabled;
    return Array.isArray(e) ? e.filter((x): x is string => typeof x === "string") : fetchEnabledPaymentMethodsFresh();
  }));
  void bundle.then(() => getPublicAppSetting("gateway_logo")).then((logo) => { if (logo) preloadImage(String(logo).trim()); }).catch(() => {});
};
