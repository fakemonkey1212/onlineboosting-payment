/**
 * Cache-busting for admin-managed images. Every page load gets a fresh version,
 * and every live admin update bumps it, so browsers/CDNs never serve a stale copy.
 * data:/blob: URLs and bundled assets are returned unchanged.
 */
let version = Date.now().toString(36);

export const bumpAssetVersion = () => {
  version = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
};

export const bustImage = (src: string | null | undefined): string => {
  const s = String(src ?? "").trim();
  if (!s || !/^https?:\/\//i.test(s)) return s;
  try {
    const u = new URL(s);
    u.searchParams.set("_v", version);
    return u.toString();
  } catch {
    return s;
  }
};
