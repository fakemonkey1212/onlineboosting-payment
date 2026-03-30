import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const PaymentCancelled = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(15);

  const channel = searchParams.get("channel") || "GenZ Payment Service";
  const reason = searchParams.get("reason") || "Method not Selected";
  const amount = searchParams.get("amount") || "0.00";
  const refId = searchParams.get("ref") || "—";

  // Payment cancelled notification removed

  // Intercept browser back button - always stay on cancel page
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(`/payment-cancelled?channel=${encodeURIComponent(channel)}&reason=${encodeURIComponent(reason)}&amount=${encodeURIComponent(amount)}&ref=${encodeURIComponent(refId)}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="h-screen bg-white flex flex-col items-center pt-16 px-4 overflow-hidden">
      <div className="w-full max-w-lg text-center">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Redirecting to the Merchant Site
        </h1>
        <p className="text-sm text-blue-500 mb-8">This may take a few seconds</p>

        {/* Sorry message */}
        <h2 className="text-xl font-bold text-gray-900 mb-3">Sorry for your order</h2>
        <p className="text-gray-600 text-sm mb-1">
          Your payment of <span className="font-bold text-gray-900">{amount}</span> BDT is{" "}
          <span className="text-red-500 font-semibold">FAILED (Merchant Verification Failed)</span>.
        </p>
        <p className="text-gray-700 text-sm mb-8">
          payment ref id <span className="font-medium">{refId}</span>
        </p>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-8" />

        {/* Details */}
        <div className="space-y-3 mb-6">
          <p className="text-gray-500 text-sm">
            Payment Channel - <span className="font-bold text-gray-800">{channel}</span>
          </p>
          <p className="text-gray-500 text-sm">
            Reason for Declined - <span className="font-bold text-gray-800">{reason}</span>
          </p>
        </div>

        {/* Action links */}
        <div className="space-y-2 mb-8">
          <p className="text-sm">
            <button
              onClick={() => navigate(`/payment-cancelled?channel=${encodeURIComponent(channel)}&reason=${encodeURIComponent(reason)}&amount=${encodeURIComponent(amount)}&ref=${encodeURIComponent(refId)}`)}
              className="text-blue-600 underline font-medium hover:text-blue-800 transition-colors"
            >
              Re-try
            </button>{" "}
            <span className="text-gray-600">to pay by another payment channel</span>
          </p>
          <p className="text-sm">
            <button
              onClick={() => navigate(`/payment-cancelled?channel=${encodeURIComponent(channel)}&reason=${encodeURIComponent(reason)}&amount=${encodeURIComponent(amount)}&ref=${encodeURIComponent(refId)}`)}
              className="text-blue-600 underline font-medium hover:text-blue-800 transition-colors"
            >
              Try later
            </button>{" "}
            <span className="text-gray-600">to pay and return to merchant</span>
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-8" />

        {/* Redirect info */}
        <div className="space-y-1">
          <p className="text-gray-500 text-sm">
            You're now going back to the merchant site.
          </p>
          <p className="text-gray-500 text-sm">
            If you are not redirected within {countdown} seconds,{" "}
            <button
              onClick={() => navigate(`/payment-cancelled?channel=${encodeURIComponent(channel)}&reason=${encodeURIComponent(reason)}&amount=${encodeURIComponent(amount)}&ref=${encodeURIComponent(refId)}`)}
              className="text-blue-600 underline font-medium hover:text-blue-800 transition-colors"
            >
              click here...
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;
