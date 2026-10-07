import { getEnabledPaymentMethods, getPublicAppSetting } from "@/lib/backend-api";
import { bustImage } from "@/lib/assetVersion";

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

/** Starts loading fresh admin display data the moment the site opens (memory only). */
export const prefetchPublicDisplay = () => {
  void getPublicAppSetting("gateway_logo").then((logo) => { if (logo) preloadImage(String(logo).trim()); }).catch(() => {});
  ["gateway_name", "badge_color", "otp_approval_mode"].forEach((k) => void getPublicAppSetting(k).catch(() => {}));
  void getEnabledPaymentMethods().catch(() => {});
};
