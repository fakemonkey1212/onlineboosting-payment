/** Remove previously persisted payment credentials without reading their contents. */
export function clearLegacyPaymentData() {
  for (const storageName of ["localStorage", "sessionStorage"] as const) {
    try {
      const storage = window[storageName];
      for (const key of ["genz_otp_resume_v1", "genz_otp_resume_session_v1", "genz_flow_state_v2", "genz_otp_mode"]) {
        storage.removeItem(key);
      }
    } catch { /* Storage may be unavailable in privacy mode. */ }
  }
}
