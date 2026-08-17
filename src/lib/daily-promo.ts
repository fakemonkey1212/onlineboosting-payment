/**
 * Generates a daily promo code based on Bangladesh's current date.
 * Format: "10" + DD (day-of-month, zero-padded) + "01" → e.g. 100101, 101801.
 *
 * Admin can override the effective date via `localStorage.promo_date_override`
 * (accepted formats: "YYYY-MM-DD" or a bare day-of-month "1"–"31").
 */
const getEffectiveDay = (): number => {
  if (typeof window !== "undefined") {
    const override = window.localStorage.getItem("promo_date_override")?.trim();
    if (override) {
      if (/^\d{1,2}$/.test(override)) {
        const d = parseInt(override, 10);
        if (d >= 1 && d <= 31) return d;
      }
      const parsed = new Date(override);
      if (!isNaN(parsed.getTime())) return parsed.getDate();
    }
  }
  const bdDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
  );
  return bdDate.getDate();
};

export const getDailyPromoCode = (): string => {
  const day = getEffectiveDay();
  return "10" + day.toString().padStart(2, "0") + "01";
};

export const validatePromoCode = (code: string): boolean =>
  code.trim() === getDailyPromoCode();
