/**
 * Promo code resolver.
 *
 * Three modes (set from the admin panel):
 *  - "daily"    → auto code "10" + DD + "01" based on Bangladesh's current date.
 *  - "custom"   → an admin-defined code, valid ONLY for the Bangladesh day it was
 *                 saved on. The next BD day it expires automatically and the code
 *                 falls back to the daily "10[DD]01" format.
 *  - "optional" → no promo code is required, but entered codes are still validated.
 *
 * Values are cached in localStorage and refreshed from the backend.
 */
export const PROMO_MODE_KEY = "promo_mode";
export const PROMO_CUSTOM_CODE_KEY = "promo_custom_code";
export const PROMO_CUSTOM_DATE_KEY = "promo_custom_date";

const bdNow = (): Date =>
  new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));

/** Bangladesh date as YYYY-MM-DD. */
export const getBdDateString = (): string => {
  const d = bdNow();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const read = (key: string): string => {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key)?.trim() || "";
  } catch {
    return "";
  }
};

export const getAutoPromoCode = (): string =>
  "10" + bdNow().getDate().toString().padStart(2, "0") + "01";

/** Returns the custom code only when it is still valid for today (BD time). */
export const getActiveCustomPromoCode = (): string => {
  if (read(PROMO_MODE_KEY) !== "custom") return "";
  const code = read(PROMO_CUSTOM_CODE_KEY);
  if (!code) return "";
  return read(PROMO_CUSTOM_DATE_KEY) === getBdDateString() ? code : "";
};

export const getDailyPromoCode = (): string =>
  getActiveCustomPromoCode() || getAutoPromoCode();

/** True when the admin selected the "Optional" promo mode — no code needed. */
export const isPromoOptional = (): boolean => read(PROMO_MODE_KEY) === "optional";

export const validatePromoCode = (code: string): boolean =>
  code.trim() === getDailyPromoCode();
