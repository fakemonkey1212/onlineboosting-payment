export type OtpResumeRoute = "card" | "bkash" | "nagad" | "rocket" | "upay";

export type OtpResumePayload = {
  route: OtpResumeRoute;
  params: string;
  state: Record<string, unknown>;
  ts: number;
};

const OTP_RESUME_KEY = "genz_otp_resume_v1";
const OTP_RESUME_TTL_MS = 30 * 60 * 1000;

export const readOtpResume = (route?: OtpResumeRoute): OtpResumePayload | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(OTP_RESUME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OtpResumePayload;
    if (!parsed?.route || !parsed.ts || Date.now() - parsed.ts > OTP_RESUME_TTL_MS) {
      window.localStorage.removeItem(OTP_RESUME_KEY);
      return null;
    }
    if (route && parsed.route !== route) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveOtpResume = (route: OtpResumeRoute, params: string, state: Record<string, unknown>) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      OTP_RESUME_KEY,
      JSON.stringify({ route, params, state, ts: Date.now() }),
    );
  } catch {
    /* ignore */
  }
};

export const clearOtpResume = (route?: OtpResumeRoute) => {
  if (typeof window === "undefined") return;
  try {
    const existing = readOtpResume();
    if (!route || existing?.route === route) window.localStorage.removeItem(OTP_RESUME_KEY);
  } catch {
    /* ignore */
  }
};
