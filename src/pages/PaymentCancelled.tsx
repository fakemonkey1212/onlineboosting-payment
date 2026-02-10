import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle, RefreshCw, ArrowRight, Shield } from "lucide-react";
import genzLogo from "@/assets/genz-logo.png";

const PaymentCancelled = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(7);
  const [progressWidth, setProgressWidth] = useState(100);

  const channel = searchParams.get("channel") || "GenZ Direct Debit";
  const reason = searchParams.get("reason") || "Method not Selected";
  const amount = searchParams.get("amount") || "434.00";
  const refId = searchParams.get("ref") || `GZ${Date.now().toString().slice(-8)}`;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
      setProgressWidth((prev) => Math.max(0, prev - 100 / 7));
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src={genzLogo} alt="GenZ" className="w-8 h-8 rounded-full shadow-sm" />
          <span className="text-gray-700 font-semibold text-sm">GenZ SMM</span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Status Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <XCircle className="w-9 h-9 text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-white text-xl font-bold mb-1">Payment Failed</h1>
            <p className="text-white/70 text-xs">Transaction could not be completed</p>
          </div>

          {/* Amount */}
          <div className="px-6 py-5 text-center border-b border-gray-100">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider font-medium mb-1">Amount</p>
            <p className="text-gray-800 text-2xl font-bold">৳{amount}</p>
          </div>

          {/* Details */}
          <div className="px-6 py-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Channel</span>
              <span className="text-gray-700 text-xs font-semibold">{channel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Status</span>
              <span className="text-red-500 text-xs font-semibold bg-red-50 px-2 py-0.5 rounded-full">
                Merchant Verification Failed
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Reference</span>
              <span className="text-gray-700 text-xs font-mono">{refId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Reason</span>
              <span className="text-gray-700 text-xs font-semibold">{reason}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-100 space-y-2.5">
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Another Method
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Return to Merchant
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Redirect Progress */}
          <div className="px-6 pb-5">
            <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gray-400 h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
            <p className="text-gray-400 text-[10px] text-center mt-2">
              Auto-redirecting in {countdown}s
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1 mt-4 text-gray-400">
          <Shield className="w-3 h-3" />
          <span className="text-[10px]">Secured by GenZ Payment Gateway</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;
