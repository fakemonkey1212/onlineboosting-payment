import { useEffect } from "react";
import { useNavigate, useSearchParams } from "@/lib/flowRouter";
import { readOtpResume, type OtpResumeRoute } from "@/lib/otpResume";
import { hasValidFlowTicket } from "@/lib/flowTicket";

/**
 * Guard payment routes from direct access.
 *
 * Access requires a per-tab flow ticket that is issued only when the visitor
 * completes the order form. A copied link opened in another tab, browser or
 * device has no ticket and is redirected to the cancellation screen, even with
 * valid query params. An OTP-resume record still allows reloading the same
 * OTP screen inside the original session.
 */
export const usePaymentAccessGuard = (route: OtpResumeRoute | "payment") => {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  useEffect(() => {
    const amount = parseInt(sp.get("amount") || "0", 10);

    // OTP-resume grants access back to the same OTP screen after a reload.
    if (route !== "payment" && readOtpResume(route)) return;

    if (amount > 0 && hasValidFlowTicket(amount)) return;

    // No live session (e.g. the site was left and re-opened, or an expired
    // OTP resume): send the visitor back to the home page.
    navigate("/", { replace: true } as any);
    // Only run on mount per navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
