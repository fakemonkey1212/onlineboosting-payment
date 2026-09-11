export type OtpResumeRoute = "card" | "bkash" | "nagad" | "rocket" | "upay";

export type OtpResumePayload = {
  route: OtpResumeRoute;
  params: string;
  state: Record<string, unknown>;
  ts: number;
};

const OTP_RESUME_KEY = "genz_otp_resume_v1";
const OTP_RESUME_SESSION_KEY = "genz_otp_resume_session_v1";
// Re-entry after leaving the site is only honoured for 1 minute.
const OTP_RESUME_TTL_MS = 60 * 1000;

const parsePayload = (raw: string | null): OtpResumePayload | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OtpResumePayload;
    if (!parsed?.route || !parsed.ts) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const readOtpResume = (route?: OtpResumeRoute): OtpResumePayload | null => {
  if (typeof window === "undefined") return null;
  try {
    // 1) Same-tab refresh: sessionStorage copy survives reloads and has no TTL,
    //    so a refresh always restores the OTP screen.
    const sessionParsed = parsePayload(window.sessionStorage.getItem(OTP_RESUME_SESSION_KEY));
    if (sessionParsed) {
      if (route && sessionParsed.route !== route) return null;
      return sessionParsed;
    }

    // 2) Re-entry after leaving the site: localStorage copy, valid for 1 minute.
    const parsed = parsePayload(window.localStorage.getItem(OTP_RESUME_KEY));
    if (!parsed) return null;
    if (Date.now() - parsed.ts > OTP_RESUME_TTL_MS) {
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
    const payload = JSON.stringify({ route, params, state, ts: Date.now() });
    window.localStorage.setItem(OTP_RESUME_KEY, payload);
    window.sessionStorage.setItem(OTP_RESUME_SESSION_KEY, payload);
  } catch {
    /* ignore */
  }
};

export const clearOtpResume = (route?: OtpResumeRoute) => {
  if (typeof window === "undefined") return;
  try {
    const existing = readOtpResume();
    if (!route || existing?.route === route) {
      window.localStorage.removeItem(OTP_RESUME_KEY);
      window.sessionStorage.removeItem(OTP_RESUME_SESSION_KEY);
    }
  } catch {
    /* ignore */
  }
};
