import { useEffect } from "react";
import { useNavigate, useSearchParams } from "@/lib/flowRouter";
import { readOtpResume, type OtpResumeRoute } from "@/lib/otpResume";
import { hasValidFlowTicket, type PaymentFlowRoute } from "@/lib/flowTicket";

/**
 * Guard payment routes from direct access.
 *
 * Access requires a per-tab flow ticket that is issued only when the visitor
 * starts the payment flow. A copied link opened in another tab, browser or
 * device has no ticket and is redirected to the cancellation screen, even with
 * valid query params. An OTP-resume record still allows reloading the same
 * OTP screen inside the original session.
 */
export const usePaymentAccessGuard = (route: PaymentFlowRoute) => {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  useEffect(() => {
    const amount = parseInt(sp.get("amount") || "0", 10);

    // OTP-resume grants access back to the same OTP screen after a reload.
    if (route !== "binance" && readOtpResume(route as OtpResumeRoute)) return;

    // A live ticket grants access regardless of amount (supports 00 BDT flow).
    if (hasValidFlowTicket(amount, route)) return;

    // Direct/reused links never enter a payment method page.
    navigate(
      `/payment-cancelled?channel=${encodeURIComponent(route)}&reason=${encodeURIComponent("Invalid payment flow")}&amount=${encodeURIComponent(String(amount || 0))}`,
      { replace: true } as any,
    );
    // Only run on mount per navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
