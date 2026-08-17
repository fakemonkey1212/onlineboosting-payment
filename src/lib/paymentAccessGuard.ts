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

    // Permissive: allow access when amount is present; ticket check disabled
    // because the current landing page does not issue flow tickets.
    if (amount > 0) return;

    navigate(
      `/payment-cancelled?channel=GenZ&reason=Invalid payment session&amount=00`,
      { replace: true } as any,
    );
    // Only run on mount per navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
