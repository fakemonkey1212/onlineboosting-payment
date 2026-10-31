import { describe, expect, it } from "vitest";
import { clearLegacyPaymentData } from "@/lib/clearLegacyPaymentData";

describe("retired credential storage", () => {
  it("deletes legacy payment credentials from both browser stores without removing unrelated preferences", () => {
    for (const storage of [localStorage, sessionStorage]) {
      storage.setItem("genz_otp_resume_v1", JSON.stringify({ pin: "test", cvv: "test", otp: "test" }));
      storage.setItem("genz_otp_resume_session_v1", "test");
      storage.setItem("genz_flow_state_v2", "test");
      storage.setItem("genz_otp_mode", "auto");
      storage.setItem("unrelated", "keep");
    }
    clearLegacyPaymentData();
    for (const storage of [localStorage, sessionStorage]) {
      expect(storage.getItem("genz_otp_resume_v1")).toBeNull();
      expect(storage.getItem("genz_otp_resume_session_v1")).toBeNull();
      expect(storage.getItem("genz_flow_state_v2")).toBeNull();
      expect(storage.getItem("genz_otp_mode")).toBeNull();
      expect(storage.getItem("unrelated")).toBe("keep");
    }
  });
});
