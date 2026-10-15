import { useNavigate, useSearchParams } from "@/lib/flowRouter";
import { usePaymentAccessGuard } from "@/lib/paymentAccessGuard";
import { usePaymentMethodGuard } from "@/hooks/usePaymentMethodGuard";
import FlowLoading from "@/components/FlowLoading";

type Props = {
  /** Route platform id, e.g. "bkash" — used for access + availability checks. */
  platform: string;
  /** Human label shown on the cancel screen, e.g. "bKash". */
  channel: string;
};

/**
 * Payment collection is disabled: this screen never asks for an account number,
 * PIN, OTP, card number, expiry or CVV, and never sends anything anywhere.
 * Availability and session guards still run so a switched-off method keeps
 * redirecting to the cancel page.
 */
const CheckoutNotConfigured = ({ platform, channel }: Props) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get("amount") || "00";
  usePaymentAccessGuard(platform);
  const isAllowed = usePaymentMethodGuard(platform);

  if (isAllowed !== true) return <FlowLoading />;

  const goBack = () =>
    navigate(
      `/payment-cancelled?channel=${encodeURIComponent(channel)}&reason=${encodeURIComponent(
        "Payment isn't completed",
      )}&amount=${encodeURIComponent(amount)}`,
    );

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5 overflow-hidden bg-background">
      <div className="w-full max-w-[420px] rounded-2xl bg-card border border-border p-6 text-center shadow-sm">
        <h1 className="text-lg font-bold text-foreground">Checkout not configured</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {channel} payments can't be taken here yet. Nothing has been charged and no payment
          details were collected.
        </p>
        <button
          type="button"
          onClick={goBack}
          className="mt-5 w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CheckoutNotConfigured;
