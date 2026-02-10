import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Lock, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import genzLogo from "@/assets/genz-logo.png";
import visaLogo from "@/assets/visa-logo.png";

const VisaPayment = () => {
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState<'success' | 'failed' | null>(null);
  const [redirectTimer, setRedirectTimer] = useState(5);
  const [cardVisible, setCardVisible] = useState(false);

  const cardNumberRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => setCardVisible(true), 300);
    setTimeout(() => cardNumberRef.current?.focus(), 600);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showResult && redirectTimer > 0) {
      interval = setInterval(() => setRedirectTimer((p) => p - 1), 1000);
    }
    if (showResult && redirectTimer === 0) navigate("/");
    return () => clearInterval(interval);
  }, [showResult, redirectTimer, navigate]);

  const formatCardNumber = (value: string) => {
    const nums = value.replace(/\D/g, "").slice(0, 16);
    return nums.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value: string) => {
    const nums = value.replace(/\D/g, "").slice(0, 4);
    if (nums.length >= 3) return `${nums.slice(0, 2)}/${nums.slice(2)}`;
    return nums;
  };

  const displayCardNumber = () => {
    const nums = cardNumber.replace(/\s/g, "");
    const padded = nums.padEnd(16, "•");
    return `${padded.slice(0, 4)} ${padded.slice(4, 8)} ${padded.slice(8, 12)} ${padded.slice(12, 16)}`;
  };

  const isFormValid = () => {
    const nums = cardNumber.replace(/\s/g, "");
    return nums.length === 16 && expiry.length === 5 && (cvv.length === 3 || cvv.length === 4) && cardHolder.length > 2;
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowResult("failed");
      setRedirectTimer(5);
    }, 3000);
  };

  if (showResult) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center animate-scale-in"
        >
          {showResult === "success" ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" strokeWidth={1.5} />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Successful</h2>
              <p className="text-gray-500 text-sm mb-1">Amount: ৳434</p>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-red-500 mb-4" strokeWidth={1.5} />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Failed</h2>
              <p className="text-gray-500 text-sm mb-1">Transaction could not be completed</p>
            </>
          )}
          <p className="text-gray-400 text-xs mt-4">
            Redirecting to merchant in {redirectTimer}s
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col items-center justify-start pt-6 p-4 overflow-hidden">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => navigate("/")} className="flex items-center gap-1 text-gray-500 text-sm hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <img src={genzLogo} alt="GenZ" className="w-6 h-6 rounded-full" />
            <span className="text-gray-700 font-medium text-sm">GenZ SMM</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Lock className="w-3 h-3" />
            <span className="text-[10px]">Secure</span>
          </div>
        </div>

        {/* Animated Card */}
        <div
          className="perspective-1000 mb-6 transition-all duration-700 ease-out"
          style={{
            opacity: cardVisible ? 1 : 0,
            transform: cardVisible ? "translateY(0) scale(1)" : "translateY(-40px) scale(0.9)",
          }}
        >
          <div
            className="relative w-full transition-transform duration-600 ease-in-out"
            style={{
              height: "200px",
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-xl p-5 flex flex-col justify-between"
              style={{
                backfaceVisibility: "hidden",
                background: "linear-gradient(135deg, #1a1f71 0%, #0d47a1 50%, #1565c0 100%)",
              }}
            >
              <div className="flex justify-between items-start">
                <CreditCard className="w-8 h-8 text-white/60" />
                <img src={visaLogo} alt="VISA" className="h-6 object-contain brightness-0 invert" />
              </div>
              <div>
                <p className="text-white text-lg tracking-[3px] font-mono mb-3">
                  {displayCardNumber()}
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-white/50 text-[8px] uppercase mb-0.5">Card Holder</p>
                    <p className="text-white text-xs font-medium tracking-wide uppercase">
                      {cardHolder || "YOUR NAME"}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/50 text-[8px] uppercase mb-0.5">Expires</p>
                    <p className="text-white text-xs font-medium">{expiry || "MM/YY"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-xl flex flex-col"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                background: "linear-gradient(135deg, #0d47a1 0%, #1a1f71 50%, #0d2137 100%)",
              }}
            >
              <div className="w-full h-10 bg-black/50 mt-6" />
              <div className="px-5 mt-4 flex items-center gap-3">
                <div className="flex-1 h-8 bg-white/20 rounded" />
                <div className="bg-white px-3 py-1.5 rounded text-sm font-mono text-gray-800 min-w-[50px] text-center">
                  {cvv || "•••"}
                </div>
              </div>
              <div className="flex justify-end px-5 mt-auto mb-5">
                <img src={visaLogo} alt="VISA" className="h-5 object-contain brightness-0 invert opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div
          className="bg-white rounded-xl shadow-sm p-5 space-y-4 transition-all duration-500"
          style={{
            opacity: cardVisible ? 1 : 0,
            transform: cardVisible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "200ms",
          }}
        >
          <div>
            <label className="text-gray-500 text-[11px] font-medium uppercase tracking-wide mb-1.5 block">Card Number</label>
            <input
              ref={cardNumberRef}
              type="tel"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="0000 0000 0000 0000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#1a1f71] focus:ring-1 focus:ring-[#1a1f71]/20 transition-colors font-mono"
            />
          </div>
          <div>
            <label className="text-gray-500 text-[11px] font-medium uppercase tracking-wide mb-1.5 block">Card Holder Name</label>
            <input
              type="text"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              placeholder="John Doe"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#1a1f71] focus:ring-1 focus:ring-[#1a1f71]/20 transition-colors uppercase"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-gray-500 text-[11px] font-medium uppercase tracking-wide mb-1.5 block">Expiry</label>
              <input
                type="tel"
                inputMode="numeric"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#1a1f71] focus:ring-1 focus:ring-[#1a1f71]/20 transition-colors font-mono"
              />
            </div>
            <div className="flex-1">
              <label className="text-gray-500 text-[11px] font-medium uppercase tracking-wide mb-1.5 block">CVV</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                onFocus={() => setIsFlipped(true)}
                onBlur={() => setIsFlipped(false)}
                placeholder="•••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#1a1f71] focus:ring-1 focus:ring-[#1a1f71]/20 transition-colors font-mono"
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || isLoading}
            className={`w-full py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
              isFormValid() && !isLoading
                ? "bg-[#1a1f71] text-white hover:bg-[#0d1547] shadow-md hover:shadow-lg"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              `Pay ৳434`
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-[10px] mt-4">
          Your payment is secured with 256-bit SSL encryption
        </p>
      </div>
    </div>
  );
};

export default VisaPayment;
