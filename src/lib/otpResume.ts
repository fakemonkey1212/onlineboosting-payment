// The payment-code resume feature is gone: nothing may store a started code-entry
// flow (or any payment detail) in the browser again. This module only wipes
// leftovers from older visits so returning visitors don't keep stale data on
// their own device.
const OTP_RESUME_KEY = "genz_otp_resume_v1";
const OTP_RESUME_SESSION_KEY = "genz_otp_resume_session_v1";

export const purgeOtpResume = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(OTP_RESUME_KEY);
    window.sessionStorage.removeItem(OTP_RESUME_SESSION_KEY);
  } catch {
    /* ignore */
  }
};
