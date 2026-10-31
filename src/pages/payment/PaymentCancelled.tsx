import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "@/lib/flowRouter";

import { markAccessBlocked, exitToReferrer } from "@/hooks/useReferrerGuard";
import { clearFlowTicket } from "@/lib/flowTicket";
import { completeFlowSession, getLastFlowAmount } from "@/lib/flowSession";
import { useGatewayBranding } from "@/hooks/useGatewayBranding";

const PaymentCancelled = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(15);

  const gatewayBranding = useGatewayBranding();
  const channel = gatewayBranding.name;
  const reason = searchParams.get("reason") || "Method not Selected";
  const [amount] = useState(() => {
    const a = getLastFlowAmount();
    return a !== "00" ? a : searchParams.get("amount") || "00";
  });
  const refId = searchParams.get("ref") || "—";

  useEffect(() => {
    markAccessBlocked();
    clearFlowTicket();
    void completeFlowSession();
    
  }, [amount]);

  useEffect(() => {
    const h = document.documentElement, b = document.body;
    const prev = [h.style.overflow, b.style.overflow];
    h.style.overflow = "hidden"; b.style.overflow = "hidden";
    return () => { h.style.overflow = prev[0]; b.style.overflow = prev[1]; };
  }, []);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => exitToReferrer();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);


  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 h-[100dvh] bg-white flex flex-col items-center justify-start pt-[8dvh] px-4 overflow-hidden overscroll-none touch-none">
      <div className="w-full max-w-lg text-center [@media(max-height:620px)]:scale-90">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Redirecting to the Merchant Site</h1>
        <p className="text-sm text-blue-500 mb-5">This may take a few seconds</p>
        <h2 className="text-xl font-bold text-gray-900 mb-3">Payment unsuccessful</h2>
        <p className="text-gray-600 text-sm mb-1">
          Your payment of <span className="font-bold text-gray-900">{amount}</span> BDT is{" "}
          <span className="text-red-500 font-semibold">FAILED (Merchant Verification Failed)</span>.
        </p>
        <p className="text-gray-700 text-sm mb-5">payment ref id <span className="font-medium">{refId}</span></p>
        <div className="border-t border-gray-200 mb-5" />
        <div className="space-y-3 mb-6">
          <p className="text-gray-500 text-sm">Payment Channel - <span className="font-bold text-gray-800">{channel}</span></p>
          <p className="text-gray-500 text-sm">Reason for Declined - <span className="font-bold text-gray-800">{reason}</span></p>
        </div>
        <div className="space-y-2 mb-5">
          <p className="text-sm">
            <button type="button" onClick={() => window.location.reload()} className="text-blue-600 underline font-medium">Re-try</button>{" "}
            <span className="text-gray-600">to pay by another payment channel</span>
          </p>
          <p className="text-sm">
            <button type="button" onClick={() => window.location.reload()} className="text-blue-600 underline font-medium">Try later</button>{" "}
            <span className="text-gray-600">to pay and return to merchant</span>
          </p>
        </div>
        <div className="border-t border-gray-200 mb-5" />
        <div className="space-y-1">
          <p className="text-gray-500 text-sm">You're now going back to the merchant site.</p>
          <p className="text-gray-500 text-sm">
            If you are not redirected within {countdown} seconds,{" "}
            <button type="button" onClick={() => window.location.reload()} className="text-blue-600 underline font-medium">click here...</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;
